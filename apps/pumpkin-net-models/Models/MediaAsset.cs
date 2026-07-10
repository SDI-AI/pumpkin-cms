using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

/// <summary>
/// Metadata for a tenant media file stored in external asset storage.
/// Blob Storage owns the bytes; this document owns search, ownership, and edit metadata.
/// </summary>
public class MediaAsset
{
    [JsonPropertyName("id")]
    public string Id
    {
        get => MediaAssetId;
        set => MediaAssetId = value;
    }

    [JsonPropertyName("mediaAssetId")]
    public string MediaAssetId { get; set; } = Guid.NewGuid().ToString("N");

    [JsonPropertyName("tenantId")]
    public string TenantId { get; set; } = string.Empty;

    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = string.Empty;

    [JsonPropertyName("originalFileName")]
    public string OriginalFileName { get; set; } = string.Empty;

    [JsonPropertyName("blobPath")]
    public string BlobPath { get; set; } = string.Empty;

    [JsonPropertyName("publicUrl")]
    public string PublicUrl { get; set; } = string.Empty;

    [JsonPropertyName("contentType")]
    public string ContentType { get; set; } = string.Empty;

    [JsonPropertyName("sizeBytes")]
    public long SizeBytes { get; set; }

    [JsonPropertyName("width")]
    public int? Width { get; set; }

    [JsonPropertyName("height")]
    public int? Height { get; set; }

    [JsonPropertyName("altText")]
    public string AltText { get; set; } = string.Empty;

    [JsonPropertyName("caption")]
    public string Caption { get; set; } = string.Empty;

    [JsonPropertyName("folder")]
    public string Folder { get; set; } = string.Empty;

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonPropertyName("source")]
    public string Source { get; set; } = "admin";

    [JsonPropertyName("createdByUserId")]
    public string CreatedByUserId { get; set; } = string.Empty;

    [JsonPropertyName("updatedByUserId")]
    public string UpdatedByUserId { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
