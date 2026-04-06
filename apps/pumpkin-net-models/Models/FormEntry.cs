using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

/// <summary>
/// Represents a submitted form entry stored in the FormEntry container.
/// The <see cref="Type"/> property (e.g. "contact_submission") links this entry to its
/// <see cref="FormDefinition"/>. Field values are stored in <see cref="FormData"/>.
/// </summary>
public class FormEntry
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Machine-readable form type matching <see cref="FormDefinition.Type"/>,
    /// e.g. "contact_submission".
    /// </summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("tenantId")]
    public string TenantId { get; set; } = string.Empty;

    /// <summary>References the parent <see cref="FormDefinition.FormDefinitionId"/>.</summary>
    [JsonPropertyName("formDefinitionId")]
    public string FormDefinitionId { get; set; } = string.Empty;

    [JsonPropertyName("pageSlug")]
    public string PageSlug { get; set; } = string.Empty;

    /// <summary>
    /// Key/value pairs of submitted field data, keyed by <see cref="FormFieldDefinition.Name"/>.
    /// Values may be null (e.g. optional fields left blank).
    /// </summary>
    [JsonPropertyName("formData")]
    public Dictionary<string, object?> FormData { get; set; } = new();

    [JsonPropertyName("submittedAt")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Submission status: new | read | actioned | archived.</summary>
    [JsonPropertyName("status")]
    public string Status { get; set; } = "new";

    /// <summary>Submission source, e.g. "website_contact_form" or "website_form".</summary>
    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;

    [JsonPropertyName("ipAddress")]
    public string IpAddress { get; set; } = string.Empty;

    [JsonPropertyName("userAgent")]
    public string UserAgent { get; set; } = string.Empty;

    [JsonPropertyName("metadata")]
    public FormEntryMetadata Metadata { get; set; } = new();
}

public class FormEntryMetadata
{
    [JsonPropertyName("referrer")]
    public string Referrer { get; set; } = string.Empty;

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();
}
