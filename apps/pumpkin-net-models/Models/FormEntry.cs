using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

/// <summary>
/// Represents a form submission entry stored in the FormEntry container
/// </summary>
public class FormEntry
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("tenantId")]
    public string TenantId { get; set; } = string.Empty;

    [JsonPropertyName("formId")]
    public string FormId { get; set; } = string.Empty;

    [JsonPropertyName("pageSlug")]
    public string PageSlug { get; set; } = string.Empty;

    [JsonPropertyName("formData")]
    public Dictionary<string, object> FormData { get; set; } = new();

    [JsonPropertyName("submittedAt")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("ipAddress")]
    public string IpAddress { get; set; } = string.Empty;

    [JsonPropertyName("userAgent")]
    public string UserAgent { get; set; } = string.Empty;

    [JsonPropertyName("metadata")]
    public FormEntryMetadata Metadata { get; set; } = new();
}

public class FormEntryMetadata
{
    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;

    [JsonPropertyName("referrer")]
    public string Referrer { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "new";

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();
}
