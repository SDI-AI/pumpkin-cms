using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

/// <summary>
/// Defines the schema for a dynamic form — fields, validation, notifications, and submission behaviour.
/// The <see cref="Type"/> property (e.g. "contact_submission") is the linking key between a
/// FormDefinition and its submitted <see cref="FormEntry"/> records.
/// </summary>
public class FormDefinition
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("formDefinitionId")]
    public string FormDefinitionId { get; set; } = string.Empty;

    [JsonPropertyName("tenantId")]
    public string TenantId { get; set; } = string.Empty;

    /// <summary>Human-readable name, e.g. "Contact Form".</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Machine-readable slug that links this definition to <see cref="FormEntry.Type"/>,
    /// e.g. "contact_submission".
    /// </summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("fields")]
    public List<FormFieldDefinition> Fields { get; set; } = new();

    [JsonPropertyName("submitButtonText")]
    public string SubmitButtonText { get; set; } = "Submit";

    [JsonPropertyName("successMessage")]
    public string SuccessMessage { get; set; } = string.Empty;

    [JsonPropertyName("notificationEmails")]
    public List<string> NotificationEmails { get; set; } = new();

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Describes a single field within a <see cref="FormDefinition"/>.
/// The <see cref="Name"/> is the key written into <see cref="FormEntry.FormData"/>.
/// </summary>
public class FormFieldDefinition
{
    /// <summary>Key used in FormEntry.FormData, e.g. "email".</summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>Display label shown to the user, e.g. "Email Address".</summary>
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    /// <summary>Input type: text | email | phone | textarea | select | checkbox | radio | hidden.</summary>
    [JsonPropertyName("type")]
    public string Type { get; set; } = "text";

    [JsonPropertyName("required")]
    public bool Required { get; set; } = false;

    [JsonPropertyName("placeholder")]
    public string Placeholder { get; set; } = string.Empty;

    [JsonPropertyName("defaultValue")]
    public string? DefaultValue { get; set; }

    /// <summary>Options for select/radio fields.</summary>
    [JsonPropertyName("options")]
    public List<FormFieldOption>? Options { get; set; }

    /// <summary>Display order (ascending).</summary>
    [JsonPropertyName("order")]
    public int Order { get; set; } = 0;

    /// <summary>If true the field is submitted server-side but not shown to the user.</summary>
    [JsonPropertyName("hidden")]
    public bool Hidden { get; set; } = false;
}

/// <summary>A single option in a select or radio field.</summary>
public class FormFieldOption
{
    [JsonPropertyName("value")]
    public string Value { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;
}
