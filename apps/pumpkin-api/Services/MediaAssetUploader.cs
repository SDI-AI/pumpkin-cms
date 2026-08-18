using Microsoft.Extensions.Options;
using pumpkin_net_models.Models;

namespace pumpkin_api.Services;

public class MediaAssetUploadRequest
{
    public string TenantId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Folder { get; set; } = string.Empty;
    public string AltText { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string UserId { get; set; } = string.Empty;
}

public class MediaAssetUploader
{
    private readonly AssetStorageSettings _settings;
    private readonly IAssetStorageConnection _storage;
    private readonly ILogger<MediaAssetUploader> _logger;

    public MediaAssetUploader(
        IOptions<AssetStorageSettings> settings,
        IAssetStorageConnection storage,
        ILogger<MediaAssetUploader> logger)
    {
        _settings = settings.Value;
        _storage = storage;
        _logger = logger;
    }

    public async Task<MediaAsset> UploadAsync(Stream fileStream, MediaAssetUploadRequest request, CancellationToken cancellationToken)
    {
        if (fileStream == null || !fileStream.CanRead)
            throw new InvalidOperationException("Media file stream is required.");
        if (string.IsNullOrWhiteSpace(request.TenantId))
            throw new InvalidOperationException("Tenant ID is required.");
        if (string.IsNullOrWhiteSpace(request.FileName))
            throw new InvalidOperationException("File name is required.");
        if (request.SizeBytes <= 0)
            throw new InvalidOperationException("Media file is empty.");
        if (request.SizeBytes > _settings.MaxMediaAssetBytes)
            throw new InvalidOperationException($"Media file is too large. Maximum size is {_settings.MaxMediaAssetBytes} bytes.");

        var createdAt = DateTimeOffset.UtcNow;
        var assetId = Guid.NewGuid().ToString("N");
        var cleanFileName = Path.GetFileName(request.FileName);
        var extension = Path.GetExtension(cleanFileName).ToLowerInvariant();
        if (!_settings.AllowedMediaExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Media file extension '{extension}' is not allowed.");

        var resolvedContentType = ResolveContentType(cleanFileName);
        if (!_settings.AllowedMediaContentTypes.Contains(resolvedContentType, StringComparer.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Media content type '{resolvedContentType}' is not allowed.");

        if (!string.IsNullOrWhiteSpace(request.ContentType) &&
            !request.ContentType.Equals(resolvedContentType, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning(
                "Media upload content type mismatch - FileName: {FileName}, ClientContentType: {ClientContentType}, ResolvedContentType: {ResolvedContentType}",
                cleanFileName,
                request.ContentType,
                resolvedContentType);
        }

        var storagePath = _settings.BuildTenantMediaPath(request.TenantId, assetId, cleanFileName, createdAt);
        var publicUrl = _storage.GetTarget(AssetStorageArea.Media, storagePath).PublicUrl;
        if (string.IsNullOrWhiteSpace(publicUrl))
            throw new InvalidOperationException("Asset storage public URL settings are required to create media asset public URLs.");

        var contentType = resolvedContentType;

        await _storage.UploadAsync(AssetStorageArea.Media, storagePath, fileStream, contentType, cancellationToken);

        _logger.LogInformation(
            "Media asset uploaded - MediaAssetId: {MediaAssetId}, TenantId: {TenantId}, Provider: {Provider}, StoragePath: {StoragePath}",
            assetId,
            request.TenantId,
            _storage.Provider,
            storagePath);

        return new MediaAsset
        {
            Id = assetId,
            MediaAssetId = assetId,
            TenantId = request.TenantId,
            FileName = cleanFileName,
            OriginalFileName = cleanFileName,
            BlobPath = storagePath,
            PublicUrl = publicUrl,
            ContentType = contentType,
            SizeBytes = request.SizeBytes,
            AltText = request.AltText,
            Caption = request.Caption,
            Folder = request.Folder,
            Tags = request.Tags,
            Source = "admin-upload",
            CreatedByUserId = request.UserId,
            UpdatedByUserId = request.UserId,
            CreatedAt = createdAt.UtcDateTime,
            UpdatedAt = createdAt.UtcDateTime
        };
    }

    public async Task<bool> DeleteAsync(string storagePath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(storagePath))
        {
            _logger.LogWarning("Media asset delete skipped because storage path is empty.");
            return false;
        }

        var deleted = await _storage.DeleteAsync(AssetStorageArea.Media, storagePath, cancellationToken);
        _logger.LogInformation(
            "Media asset delete attempted - Provider: {Provider}, StoragePath: {StoragePath}, Deleted: {Deleted}",
            _storage.Provider,
            storagePath,
            deleted);
        return deleted;
    }

    private static string ResolveContentType(string fileName)
    {
        return Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".svg" => "image/svg+xml",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".avif" => "image/avif",
            ".pdf" => "application/pdf",
            ".txt" => "text/plain; charset=utf-8",
            ".json" => "application/json; charset=utf-8",
            _ => "application/octet-stream"
        };
    }
}
