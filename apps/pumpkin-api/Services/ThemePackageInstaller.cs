using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;
using pumpkin_net_models.Models;

namespace pumpkin_api.Services;

public class ThemePackageInstallResult
{
    public Theme Theme { get; set; } = new();
    public string TenantThemePath { get; set; } = string.Empty;
    public string CssBlobPath { get; set; } = string.Empty;
    public string ManifestBlobPath { get; set; } = string.Empty;
    public string PackageBlobPath { get; set; } = string.Empty;
    public List<string> AssetBlobPaths { get; set; } = new();
}

public class ThemePackageInstaller
{
    private static readonly JsonSerializerOptions ThemeJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly AssetStorageSettings _settings;
    private readonly ILogger<ThemePackageInstaller> _logger;

    public ThemePackageInstaller(IOptions<AssetStorageSettings> settings, ILogger<ThemePackageInstaller> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<ThemePackageInstallResult> InstallAsync(Stream packageStream, string tenantId, CancellationToken cancellationToken)
    {
        if (packageStream == null || !packageStream.CanRead)
            throw new InvalidOperationException("Theme package stream is required.");

        await using var packageBuffer = new MemoryStream();
        await CopyWithLimitAsync(packageStream, packageBuffer, _settings.MaxThemePackageBytes, cancellationToken);
        packageBuffer.Position = 0;

        using var archive = new ZipArchive(packageBuffer, ZipArchiveMode.Read, leaveOpen: true);
        var themeEntry = FindRequiredEntry(archive, "theme.json");
        var cssEntry = FindRequiredEntry(archive, "theme.css");
        var manifestEntry = FindOptionalEntry(archive, "theme-manifest.json");

        var theme = await ReadThemeAsync(themeEntry, cancellationToken);
        ValidateTheme(theme, tenantId);

        var version = Math.Max(theme.Version, 1).ToString();
        var tenantThemePath = _settings.BuildTenantThemePath(tenantId, theme.ThemeId, version);
        var container = BuildThemeContainerClient();
        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

        await using var cssStream = new MemoryStream();
        await CopyEntryToAsync(cssEntry, cssStream, cancellationToken);
        cssStream.Position = 0;
        var cssHashBytes = SHA256.HashData(cssStream);
        var cssIntegrity = $"sha256-{Convert.ToBase64String(cssHashBytes)}";
        var cssContentHash = Convert.ToHexString(cssHashBytes).ToLowerInvariant();
        cssStream.Position = 0;

        var cssBlobPath = $"{tenantThemePath}/theme.css";
        await UploadAsync(container, cssBlobPath, cssStream, "text/css; charset=utf-8", cancellationToken);

        string manifestBlobPath = string.Empty;
        if (manifestEntry != null)
        {
            manifestBlobPath = $"{tenantThemePath}/theme-manifest.json";
            await using var manifestStream = new MemoryStream();
            await CopyEntryToAsync(manifestEntry, manifestStream, cancellationToken);
            manifestStream.Position = 0;
            await UploadAsync(container, manifestBlobPath, manifestStream, "application/json; charset=utf-8", cancellationToken);
        }

        var assetBlobPaths = new List<string>();
        foreach (var entry in archive.Entries.Where(IsAssetEntry))
        {
            ValidateThemeAssetEntry(entry);
            var relativeAssetPath = NormalizeAssetPath(entry.FullName);
            var blobPath = $"{tenantThemePath}/{relativeAssetPath}";
            await using var assetStream = new MemoryStream();
            await CopyEntryToAsync(entry, assetStream, cancellationToken);
            assetStream.Position = 0;
            await UploadAsync(container, blobPath, assetStream, ResolveContentType(entry.FullName), cancellationToken);
            assetBlobPaths.Add(blobPath);
        }

        packageBuffer.Position = 0;
        var packageBlobPath = $"{tenantThemePath}/theme-package.zip";
        await UploadAsync(container, packageBlobPath, packageBuffer, "application/zip", cancellationToken);

        theme.TenantId = tenantId;
        theme.Id = theme.ThemeId;
        theme.Version = Math.Max(theme.Version, 1);
        theme.CompiledAssets = new ThemeCompiledAssets
        {
            Mode = "compiled",
            CssUrl = _settings.BuildThemePublicUrl(tenantThemePath, "theme.css"),
            CssIntegrity = cssIntegrity,
            AssetsBaseUrl = _settings.BuildThemePublicUrl(tenantThemePath, "assets/"),
            ManifestUrl = manifestEntry == null ? string.Empty : _settings.BuildThemePublicUrl(tenantThemePath, "theme-manifest.json"),
            PackageUrl = _settings.BuildThemePublicUrl(tenantThemePath, "theme-package.zip"),
            CompiledAt = DateTime.UtcNow,
            Compiler = "pumpkin-api-theme-installer",
            ContentHash = cssContentHash
        };

        _logger.LogInformation("Theme package installed to blob storage - ThemeId: {ThemeId}, TenantId: {TenantId}", theme.ThemeId, tenantId);

        return new ThemePackageInstallResult
        {
            Theme = theme,
            TenantThemePath = tenantThemePath,
            CssBlobPath = cssBlobPath,
            ManifestBlobPath = manifestBlobPath,
            PackageBlobPath = packageBlobPath,
            AssetBlobPaths = assetBlobPaths
        };
    }

    private BlobContainerClient BuildThemeContainerClient()
    {
        var azureBlob = _settings.AzureBlob;

        if (!string.IsNullOrWhiteSpace(azureBlob.ConnectionString))
        {
            return new BlobContainerClient(azureBlob.ConnectionString, azureBlob.ThemesContainerName);
        }

        if (string.IsNullOrWhiteSpace(azureBlob.AccountName))
            throw new InvalidOperationException("AssetStorage:AzureBlob:AccountName is required when ConnectionString is not configured.");

        var serviceUri = new Uri($"https://{azureBlob.AccountName}.blob.core.windows.net");
        var serviceClient = new BlobServiceClient(serviceUri, new DefaultAzureCredential());
        return serviceClient.GetBlobContainerClient(azureBlob.ThemesContainerName);
    }

    private static async Task CopyWithLimitAsync(Stream source, Stream destination, long maxBytes, CancellationToken cancellationToken)
    {
        var buffer = new byte[81920];
        long totalBytes = 0;
        int bytesRead;
        while ((bytesRead = await source.ReadAsync(buffer, cancellationToken)) > 0)
        {
            totalBytes += bytesRead;
            if (totalBytes > maxBytes)
                throw new InvalidOperationException($"Theme package is too large. Maximum size is {maxBytes} bytes.");

            await destination.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
        }
    }

    private static ZipArchiveEntry FindRequiredEntry(ZipArchive archive, string fileName)
    {
        return FindOptionalEntry(archive, fileName)
            ?? throw new InvalidOperationException($"Theme package must include {fileName}.");
    }

    private static ZipArchiveEntry? FindOptionalEntry(ZipArchive archive, string fileName)
    {
        return archive.Entries.FirstOrDefault(entry =>
            !string.IsNullOrWhiteSpace(entry.Name) &&
            entry.Name.Equals(fileName, StringComparison.OrdinalIgnoreCase));
    }

    private static async Task<Theme> ReadThemeAsync(ZipArchiveEntry themeEntry, CancellationToken cancellationToken)
    {
        await using var stream = themeEntry.Open();
        var theme = await JsonSerializer.DeserializeAsync<Theme>(stream, ThemeJsonOptions, cancellationToken);
        return theme ?? throw new InvalidOperationException("theme.json could not be parsed.");
    }

    private static void ValidateTheme(Theme theme, string tenantId)
    {
        if (string.IsNullOrWhiteSpace(theme.ThemeId))
            throw new InvalidOperationException("theme.json must include themeId.");

        if (!string.IsNullOrWhiteSpace(theme.TenantId) && !theme.TenantId.Equals(tenantId, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("theme.json tenantId does not match the install tenant.");
    }

    private static bool IsAssetEntry(ZipArchiveEntry entry)
    {
        var normalized = NormalizeZipPath(entry.FullName);
        return !string.IsNullOrWhiteSpace(entry.Name) &&
            normalized.StartsWith("assets/", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeAssetPath(string zipPath)
    {
        var normalized = NormalizeZipPath(zipPath);
        var assetsIndex = normalized.IndexOf("assets/", StringComparison.OrdinalIgnoreCase);
        return normalized[assetsIndex..];
    }

    private static string NormalizeZipPath(string zipPath)
    {
        return zipPath.Replace('\\', '/').TrimStart('/');
    }

    private static void ValidateThemeAssetEntry(ZipArchiveEntry entry)
    {
        var extension = Path.GetExtension(entry.Name).ToLowerInvariant();
        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".webp",
            ".avif",
            ".woff",
            ".woff2",
            ".ttf",
            ".otf"
        };

        if (!allowedExtensions.Contains(extension))
            throw new InvalidOperationException($"Theme asset '{entry.FullName}' has an unsupported extension.");
    }

    private static async Task CopyEntryToAsync(ZipArchiveEntry entry, Stream destination, CancellationToken cancellationToken)
    {
        await using var entryStream = entry.Open();
        await entryStream.CopyToAsync(destination, cancellationToken);
    }

    private static async Task UploadAsync(
        BlobContainerClient container,
        string blobPath,
        Stream stream,
        string contentType,
        CancellationToken cancellationToken)
    {
        var blobClient = container.GetBlobClient(blobPath);
        await blobClient.DeleteIfExistsAsync(cancellationToken: cancellationToken);
        await blobClient.UploadAsync(
            stream,
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType,
                    CacheControl = "public, max-age=31536000, immutable"
                }
            },
            cancellationToken);
    }

    private static string ResolveContentType(string fileName)
    {
        return Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".css" => "text/css; charset=utf-8",
            ".json" => "application/json; charset=utf-8",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".avif" => "image/avif",
            ".woff" => "font/woff",
            ".woff2" => "font/woff2",
            ".ttf" => "font/ttf",
            ".otf" => "font/otf",
            _ => "application/octet-stream"
        };
    }
}
