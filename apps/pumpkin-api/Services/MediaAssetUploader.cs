using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
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
    private readonly ILogger<MediaAssetUploader> _logger;

    public MediaAssetUploader(IOptions<AssetStorageSettings> settings, ILogger<MediaAssetUploader> logger)
    {
        _settings = settings.Value;
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
        var blobPath = _settings.BuildTenantMediaPath(request.TenantId, assetId, cleanFileName, createdAt);
        var publicUrl = _settings.BuildMediaPublicUrl(blobPath);
        if (string.IsNullOrWhiteSpace(publicUrl))
            throw new InvalidOperationException("AssetStorage:AzureBlob:PublicBaseUrl or MediaPublicBaseUrl is required to create media asset public URLs.");

        var contentType = string.IsNullOrWhiteSpace(request.ContentType)
            ? ResolveContentType(cleanFileName)
            : request.ContentType;

        var container = BuildMediaContainerClient();
        await container.CreateIfNotExistsAsync(cancellationToken: cancellationToken);

        var blobClient = container.GetBlobClient(blobPath);
        await blobClient.UploadAsync(
            fileStream,
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType,
                    CacheControl = "public, max-age=31536000, immutable"
                }
            },
            cancellationToken);

        _logger.LogInformation("Media asset uploaded - MediaAssetId: {MediaAssetId}, TenantId: {TenantId}, BlobPath: {BlobPath}",
            assetId, request.TenantId, blobPath);

        return new MediaAsset
        {
            Id = assetId,
            MediaAssetId = assetId,
            TenantId = request.TenantId,
            FileName = cleanFileName,
            OriginalFileName = cleanFileName,
            BlobPath = blobPath,
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

    private BlobContainerClient BuildMediaContainerClient()
    {
        var azureBlob = _settings.AzureBlob;

        if (!string.IsNullOrWhiteSpace(azureBlob.ConnectionString))
        {
            return new BlobContainerClient(azureBlob.ConnectionString, azureBlob.MediaContainerName);
        }

        if (string.IsNullOrWhiteSpace(azureBlob.AccountName))
            throw new InvalidOperationException("AssetStorage:AzureBlob:AccountName is required when ConnectionString is not configured.");

        var serviceUri = new Uri($"https://{azureBlob.AccountName}.blob.core.windows.net");
        var serviceClient = new BlobServiceClient(serviceUri, new DefaultAzureCredential());
        return serviceClient.GetBlobContainerClient(azureBlob.MediaContainerName);
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
