using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;
using pumpkin_net_models.Models;

namespace pumpkin_api.Services;

public sealed record ThemeCssPublishResult(ThemeCustomCss CustomCss, string Css);

public sealed class ThemeCssPublisher
{
    public const int MaxCssBytes = 256 * 1024;
    private const int MaxHistoryEntries = 100;

    private static readonly Regex[] RejectedPatterns =
    {
        new(@"@import\b", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"expression\s*\(", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"(?:behavior|-moz-binding)\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"javascript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"data\s*:\s*text/html", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"</?style\b", RegexOptions.IgnoreCase | RegexOptions.Compiled)
    };

    private readonly AssetStorageSettings _settings;
    private readonly ILogger<ThemeCssPublisher> _logger;

    public ThemeCssPublisher(IOptions<AssetStorageSettings> settings, ILogger<ThemeCssPublisher> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<ThemeCssPublishResult> PublishAsync(
        string tenantId,
        string themeId,
        ThemeCustomCss? current,
        string css,
        string note,
        string userId,
        CancellationToken cancellationToken)
    {
        css = NormalizeAndValidate(css);
        note = (note ?? string.Empty).Trim();
        if (note.Length > 200)
            throw new InvalidOperationException("CSS revision notes are limited to 200 characters.");

        var contentBytes = Encoding.UTF8.GetBytes(css);
        var hashBytes = SHA256.HashData(contentBytes);
        var contentHash = Convert.ToHexString(hashBytes).ToLowerInvariant();
        var integrity = $"sha256-{Convert.ToBase64String(hashBytes)}";
        var customCss = current ?? new ThemeCustomCss();

        if (string.Equals(customCss.ContentHash, contentHash, StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(customCss.ActiveRevisionId))
        {
            return new ThemeCssPublishResult(customCss, css);
        }

        var version = customCss.Revisions.Count == 0
            ? 1
            : customCss.Revisions.Max(revision => revision.Version) + 1;
        var revisionId = $"v{version}-{contentHash[..12]}";
        var revisionRoot = $"tenants/{Uri.EscapeDataString(tenantId)}/themes/{Uri.EscapeDataString(themeId)}/css-revisions/{revisionId}";
        var blobPath = $"{revisionRoot}/theme.css";
        var cssUrl = _settings.BuildThemePublicUrl(revisionRoot, "theme.css");
        if (string.IsNullOrWhiteSpace(cssUrl))
            throw new InvalidOperationException("Theme asset public URL settings are required before CSS can be published.");

        var container = BuildThemeContainerClient();
        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
        var blob = container.GetBlobClient(blobPath);
        await blob.UploadAsync(
            BinaryData.FromBytes(contentBytes),
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = "text/css; charset=utf-8",
                    CacheControl = "public, max-age=31536000, immutable"
                }
            },
            cancellationToken);

        var createdAt = DateTime.UtcNow;
        var revision = new ThemeCssRevision
        {
            RevisionId = revisionId,
            Version = version,
            CssUrl = cssUrl,
            CssIntegrity = integrity,
            ContentHash = contentHash,
            BlobPath = blobPath,
            Note = note,
            CreatedAt = createdAt,
            CreatedByUserId = userId
        };

        customCss.Revisions = customCss.Revisions
            .Where(existing => existing.RevisionId != revisionId)
            .Append(revision)
            .OrderByDescending(existing => existing.Version)
            .Take(MaxHistoryEntries)
            .OrderBy(existing => existing.Version)
            .ToList();
        ApplyRevision(customCss, revision);

        _logger.LogInformation(
            "Published custom theme CSS - TenantId: {TenantId}, ThemeId: {ThemeId}, RevisionId: {RevisionId}",
            tenantId,
            themeId,
            revisionId);

        return new ThemeCssPublishResult(customCss, css);
    }

    public async Task<string> ReadActiveCssAsync(ThemeCustomCss? customCss, CancellationToken cancellationToken)
    {
        if (customCss == null || string.IsNullOrWhiteSpace(customCss.ActiveRevisionId))
            return string.Empty;

        var revision = customCss.Revisions.FirstOrDefault(item => item.RevisionId == customCss.ActiveRevisionId)
            ?? throw new KeyNotFoundException("The active CSS revision metadata is missing.");
        if (string.IsNullOrWhiteSpace(revision.BlobPath))
            throw new KeyNotFoundException("The active CSS revision blob path is missing.");

        var blob = BuildThemeContainerClient().GetBlobClient(revision.BlobPath);
        var download = await blob.DownloadContentAsync(cancellationToken);
        return download.Value.Content.ToString();
    }

    public ThemeCustomCss ActivateRevision(ThemeCustomCss? current, string revisionId)
    {
        var customCss = current ?? new ThemeCustomCss();
        if (string.Equals(revisionId, "original", StringComparison.OrdinalIgnoreCase))
        {
            customCss.ActiveRevisionId = string.Empty;
            customCss.CssUrl = string.Empty;
            customCss.CssIntegrity = string.Empty;
            customCss.ContentHash = string.Empty;
            customCss.PublishedAt = DateTime.UtcNow;
            return customCss;
        }

        var revision = customCss.Revisions.FirstOrDefault(item => item.RevisionId == revisionId)
            ?? throw new KeyNotFoundException($"CSS revision '{revisionId}' was not found.");
        ApplyRevision(customCss, revision);
        return customCss;
    }

    private static void ApplyRevision(ThemeCustomCss customCss, ThemeCssRevision revision)
    {
        customCss.ActiveRevisionId = revision.RevisionId;
        customCss.CssUrl = revision.CssUrl;
        customCss.CssIntegrity = revision.CssIntegrity;
        customCss.ContentHash = revision.ContentHash;
        customCss.PublishedAt = DateTime.UtcNow;
    }

    private static string NormalizeAndValidate(string css)
    {
        if (css == null)
            throw new InvalidOperationException("CSS is required.");

        css = css.Replace("\r\n", "\n").Replace('\r', '\n').Trim();
        var byteCount = Encoding.UTF8.GetByteCount(css);
        if (byteCount > MaxCssBytes)
            throw new InvalidOperationException($"Custom CSS is limited to {MaxCssBytes / 1024} KB.");

        foreach (var pattern in RejectedPatterns)
        {
            if (pattern.IsMatch(css))
                throw new InvalidOperationException("Custom CSS contains a disallowed rule or value.");
        }

        ValidateBalancedBlocks(css);
        return css.Length == 0 ? string.Empty : $"{css}\n";
    }

    private static void ValidateBalancedBlocks(string css)
    {
        var depth = 0;
        var quote = '\0';
        var inComment = false;
        for (var index = 0; index < css.Length; index++)
        {
            var current = css[index];
            var next = index + 1 < css.Length ? css[index + 1] : '\0';

            if (inComment)
            {
                if (current == '*' && next == '/')
                {
                    inComment = false;
                    index++;
                }
                continue;
            }

            if (quote != '\0')
            {
                if (current == '\\') index++;
                else if (current == quote) quote = '\0';
                continue;
            }

            if (current == '/' && next == '*')
            {
                inComment = true;
                index++;
            }
            else if (current is '\'' or '"') quote = current;
            else if (current == '{') depth++;
            else if (current == '}' && --depth < 0) break;
        }

        if (depth != 0 || quote != '\0' || inComment)
            throw new InvalidOperationException("Custom CSS has unbalanced blocks, quotes, or comments.");
    }

    private BlobContainerClient BuildThemeContainerClient()
    {
        var azureBlob = _settings.AzureBlob;
        if (!string.IsNullOrWhiteSpace(azureBlob.ConnectionString))
            return new BlobContainerClient(azureBlob.ConnectionString, azureBlob.ThemesContainerName);
        if (string.IsNullOrWhiteSpace(azureBlob.AccountName))
            throw new InvalidOperationException("AssetStorage:AzureBlob:AccountName is required when ConnectionString is not configured.");

        var serviceUri = new Uri($"https://{azureBlob.AccountName}.blob.core.windows.net");
        return new BlobServiceClient(serviceUri, new DefaultAzureCredential())
            .GetBlobContainerClient(azureBlob.ThemesContainerName);
    }
}
