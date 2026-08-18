using Azure;
using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;

namespace pumpkin_api.Services;

public enum AssetStorageArea
{
    Themes,
    Media
}

public sealed record AssetStorageTarget(
    string Provider,
    string StoragePath,
    string PublicUrl,
    string? ContainerName = null,
    string? PublicBaseUrl = null);

public interface IAssetStorageConnection
{
    string Provider { get; }
    AssetStorageTarget GetTarget(AssetStorageArea area, string storagePath);
    Task UploadAsync(AssetStorageArea area, string storagePath, Stream stream, string contentType, CancellationToken cancellationToken);
    Task UploadAsync(AssetStorageArea area, string storagePath, BinaryData content, string contentType, CancellationToken cancellationToken);
    Task<string> ReadTextAsync(AssetStorageArea area, string storagePath, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(AssetStorageArea area, string storagePath, CancellationToken cancellationToken);
}

public sealed class AssetStorageService : IAssetStorageConnection
{
    private readonly AssetStorageSettings _settings;
    private readonly AzureBlobAssetStorageConnection _azureBlob;
    private readonly LocalFileAssetStorageConnection _localFile;

    public AssetStorageService(
        IOptions<AssetStorageSettings> settings,
        AzureBlobAssetStorageConnection azureBlob,
        LocalFileAssetStorageConnection localFile)
    {
        _settings = settings.Value;
        _azureBlob = azureBlob;
        _localFile = localFile;
    }

    public string Provider => Current.Provider;

    public AssetStorageTarget GetTarget(AssetStorageArea area, string storagePath)
    {
        return Current.GetTarget(area, storagePath);
    }

    public Task UploadAsync(AssetStorageArea area, string storagePath, Stream stream, string contentType, CancellationToken cancellationToken)
    {
        return Current.UploadAsync(area, storagePath, stream, contentType, cancellationToken);
    }

    public Task UploadAsync(AssetStorageArea area, string storagePath, BinaryData content, string contentType, CancellationToken cancellationToken)
    {
        return Current.UploadAsync(area, storagePath, content, contentType, cancellationToken);
    }

    public Task<string> ReadTextAsync(AssetStorageArea area, string storagePath, CancellationToken cancellationToken)
    {
        return Current.ReadTextAsync(area, storagePath, cancellationToken);
    }

    public Task<bool> DeleteAsync(AssetStorageArea area, string storagePath, CancellationToken cancellationToken)
    {
        return Current.DeleteAsync(area, storagePath, cancellationToken);
    }

    private IAssetStorageConnection Current
    {
        get
        {
            if (_settings.Provider.Equals("AzureBlob", StringComparison.OrdinalIgnoreCase))
                return _azureBlob;

            if (_settings.Provider.Equals("LocalFile", StringComparison.OrdinalIgnoreCase))
                return _localFile;

            throw new InvalidOperationException($"Unsupported asset storage provider: {_settings.Provider}");
        }
    }
}

public sealed class AzureBlobAssetStorageConnection : IAssetStorageConnection
{
    private const string CacheControl = "public, max-age=31536000, immutable";

    private readonly AssetStorageSettings _settings;

    public AzureBlobAssetStorageConnection(IOptions<AssetStorageSettings> settings)
    {
        _settings = settings.Value;
    }

    public string Provider => "AzureBlob";

    public AssetStorageTarget GetTarget(AssetStorageArea area, string storagePath)
    {
        return new AssetStorageTarget(
            Provider,
            NormalizeStoragePath(storagePath),
            area == AssetStorageArea.Themes
                ? _settings.BuildThemePublicUrl(GetParentPath(storagePath), Path.GetFileName(storagePath))
                : _settings.BuildMediaPublicUrl(storagePath),
            GetContainerName(area),
            GetPublicBaseUrl(area));
    }

    public async Task UploadAsync(AssetStorageArea area, string storagePath, Stream stream, string contentType, CancellationToken cancellationToken)
    {
        var container = BuildContainerClient(area);
        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

        var blob = container.GetBlobClient(NormalizeStoragePath(storagePath));
        await blob.DeleteIfExistsAsync(cancellationToken: cancellationToken);
        await blob.UploadAsync(
            stream,
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType,
                    CacheControl = CacheControl
                }
            },
            cancellationToken);
    }

    public Task UploadAsync(AssetStorageArea area, string storagePath, BinaryData content, string contentType, CancellationToken cancellationToken)
    {
        return UploadAsync(area, storagePath, content.ToStream(), contentType, cancellationToken);
    }

    public async Task<string> ReadTextAsync(AssetStorageArea area, string storagePath, CancellationToken cancellationToken)
    {
        var blob = BuildContainerClient(area).GetBlobClient(NormalizeStoragePath(storagePath));
        var download = await blob.DownloadContentAsync(cancellationToken);
        return download.Value.Content.ToString();
    }

    public async Task<bool> DeleteAsync(AssetStorageArea area, string storagePath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(storagePath))
            return false;

        try
        {
            var blob = BuildContainerClient(area).GetBlobClient(NormalizeStoragePath(storagePath));
            var response = await blob.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: cancellationToken);
            return response.Value;
        }
        catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
        {
            return false;
        }
    }

    private BlobContainerClient BuildContainerClient(AssetStorageArea area)
    {
        var azureBlob = _settings.AzureBlob;
        var containerName = GetContainerName(area);

        if (!string.IsNullOrWhiteSpace(azureBlob.ConnectionString))
            return new BlobContainerClient(azureBlob.ConnectionString, containerName);

        if (string.IsNullOrWhiteSpace(azureBlob.AccountName))
            throw new InvalidOperationException("AssetStorage:AzureBlob:AccountName is required when ConnectionString is not configured.");

        var serviceUri = new Uri($"https://{azureBlob.AccountName}.blob.core.windows.net");
        var serviceClient = new BlobServiceClient(serviceUri, new DefaultAzureCredential());
        return serviceClient.GetBlobContainerClient(containerName);
    }

    private string GetContainerName(AssetStorageArea area)
    {
        return area == AssetStorageArea.Themes
            ? _settings.AzureBlob.ThemesContainerName
            : _settings.AzureBlob.MediaContainerName;
    }

    private string GetPublicBaseUrl(AssetStorageArea area)
    {
        var specificBaseUrl = area == AssetStorageArea.Themes
            ? _settings.AzureBlob.ThemesPublicBaseUrl
            : _settings.AzureBlob.MediaPublicBaseUrl;

        return string.IsNullOrWhiteSpace(specificBaseUrl)
            ? _settings.AzureBlob.PublicBaseUrl
            : specificBaseUrl;
    }

    private static string NormalizeStoragePath(string storagePath)
    {
        return storagePath.Replace('\\', '/').Trim('/');
    }

    private static string GetParentPath(string storagePath)
    {
        var normalized = NormalizeStoragePath(storagePath);
        var lastSlash = normalized.LastIndexOf('/');
        return lastSlash < 0 ? string.Empty : normalized[..lastSlash];
    }
}

public sealed class LocalFileAssetStorageConnection : IAssetStorageConnection
{
    private readonly AssetStorageSettings _settings;
    private readonly IWebHostEnvironment _environment;

    public LocalFileAssetStorageConnection(IOptions<AssetStorageSettings> settings, IWebHostEnvironment environment)
    {
        _settings = settings.Value;
        _environment = environment;
    }

    public string Provider => "LocalFile";

    public AssetStorageTarget GetTarget(AssetStorageArea area, string storagePath)
    {
        var normalized = NormalizeStoragePath(storagePath);
        return new AssetStorageTarget(
            Provider,
            normalized,
            area == AssetStorageArea.Themes
                ? _settings.BuildThemePublicUrl(GetParentPath(normalized), Path.GetFileName(normalized))
                : _settings.BuildMediaPublicUrl(normalized),
            PublicBaseUrl: string.IsNullOrWhiteSpace(_settings.LocalFile.PublicBaseUrl)
                ? _settings.LocalFile.RequestPath
                : _settings.LocalFile.PublicBaseUrl);
    }

    public async Task UploadAsync(AssetStorageArea area, string storagePath, Stream stream, string contentType, CancellationToken cancellationToken)
    {
        var targetPath = ResolveFilePath(storagePath);
        var directory = Path.GetDirectoryName(targetPath);
        if (!string.IsNullOrWhiteSpace(directory))
            Directory.CreateDirectory(directory);

        await using var file = File.Create(targetPath);
        await stream.CopyToAsync(file, cancellationToken);
    }

    public async Task UploadAsync(AssetStorageArea area, string storagePath, BinaryData content, string contentType, CancellationToken cancellationToken)
    {
        await using var stream = content.ToStream();
        await UploadAsync(area, storagePath, stream, contentType, cancellationToken);
    }

    public async Task<string> ReadTextAsync(AssetStorageArea area, string storagePath, CancellationToken cancellationToken)
    {
        var targetPath = ResolveFilePath(storagePath);
        if (!File.Exists(targetPath))
            throw new FileNotFoundException("Stored asset was not found.", storagePath);

        return await File.ReadAllTextAsync(targetPath, cancellationToken);
    }

    public Task<bool> DeleteAsync(AssetStorageArea area, string storagePath, CancellationToken cancellationToken)
    {
        var targetPath = ResolveFilePath(storagePath);
        if (!File.Exists(targetPath))
            return Task.FromResult(false);

        File.Delete(targetPath);
        return Task.FromResult(true);
    }

    public string ResolveRootPath()
    {
        var rootPath = _settings.LocalFile.RootPath;
        if (string.IsNullOrWhiteSpace(rootPath))
            rootPath = "App_Data/assets";

        return Path.GetFullPath(Path.IsPathRooted(rootPath)
            ? rootPath
            : Path.Combine(_environment.ContentRootPath, rootPath));
    }

    private string ResolveFilePath(string storagePath)
    {
        var rootPath = ResolveRootPath();
        var normalized = NormalizeStoragePath(storagePath);
        var targetPath = Path.GetFullPath(Path.Combine(rootPath, normalized.Replace('/', Path.DirectorySeparatorChar)));
        var rootWithSeparator = rootPath.EndsWith(Path.DirectorySeparatorChar)
            ? rootPath
            : $"{rootPath}{Path.DirectorySeparatorChar}";

        if (!targetPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Asset storage path escapes the configured local asset root.");

        return targetPath;
    }

    private static string NormalizeStoragePath(string storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath))
            throw new InvalidOperationException("Asset storage path is required.");

        var normalized = storagePath.Replace('\\', '/').Trim('/');
        if (normalized.Contains("../", StringComparison.Ordinal) ||
            normalized.Contains("/..", StringComparison.Ordinal) ||
            normalized.Equals("..", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Asset storage path cannot contain parent traversal.");
        }

        return normalized;
    }

    private static string GetParentPath(string storagePath)
    {
        var normalized = NormalizeStoragePath(storagePath);
        var lastSlash = normalized.LastIndexOf('/');
        return lastSlash < 0 ? string.Empty : normalized[..lastSlash];
    }
}
