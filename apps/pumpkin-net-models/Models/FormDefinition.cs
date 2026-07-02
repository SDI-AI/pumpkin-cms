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

    /// <summary>message | redirect. Determines what public submitters should do after success.</summary>
    [JsonPropertyName("submitBehavior")]
    public string SubmitBehavior { get; set; } = FormSubmitBehavior.Message;

    [JsonPropertyName("redirectUrl")]
    public string RedirectUrl { get; set; } = string.Empty;

    [JsonPropertyName("notificationEmails")]
    public List<string> NotificationEmails { get; set; } = new();

    [JsonPropertyName("notifications")]
    public FormNotificationSettings Notifications { get; set; } = new();

    [JsonPropertyName("spamProtection")]
    public FormSpamProtection SpamProtection { get; set; } = new();

    [JsonPropertyName("rateLimit")]
    public FormRateLimit RateLimit { get; set; } = new();

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

    [JsonPropertyName("helpText")]
    public string HelpText { get; set; } = string.Empty;

    [JsonPropertyName("defaultValue")]
    public string? DefaultValue { get; set; }

    [JsonPropertyName("autocomplete")]
    public string Autocomplete { get; set; } = string.Empty;

    /// <summary>Options for select/radio fields.</summary>
    [JsonPropertyName("options")]
    public List<FormFieldOption>? Options { get; set; }

    /// <summary>Display order (ascending).</summary>
    [JsonPropertyName("order")]
    public int Order { get; set; } = 0;

    /// <summary>If true the field is submitted server-side but not shown to the user.</summary>
    [JsonPropertyName("hidden")]
    public bool Hidden { get; set; } = false;

    /// <summary>Layout width hint: full | half | third | two-thirds.</summary>
    [JsonPropertyName("width")]
    public string Width { get; set; } = "full";

    [JsonPropertyName("validation")]
    public FormFieldValidation Validation { get; set; } = new();

    [JsonPropertyName("attributes")]
    public Dictionary<string, string> Attributes { get; set; } = new();
}

/// <summary>A single option in a select or radio field.</summary>
public class FormFieldOption
{
    [JsonPropertyName("value")]
    public string Value { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;
}

public static class FormFieldTypes
{
    public const string Text = "text";
    public const string Email = "email";
    public const string Phone = "phone";
    public const string Textarea = "textarea";
    public const string Select = "select";
    public const string Checkbox = "checkbox";
    public const string Radio = "radio";
    public const string Hidden = "hidden";
}

public static class FormSubmitBehavior
{
    public const string Message = "message";
    public const string Redirect = "redirect";
}

public class FormFieldValidation
{
    [JsonPropertyName("minLength")]
    public int? MinLength { get; set; }

    [JsonPropertyName("maxLength")]
    public int? MaxLength { get; set; }

    [JsonPropertyName("pattern")]
    public string Pattern { get; set; } = string.Empty;

    [JsonPropertyName("min")]
    public decimal? Min { get; set; }

    [JsonPropertyName("max")]
    public decimal? Max { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public class FormNotificationSettings
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("replyToField")]
    public string ReplyToField { get; set; } = string.Empty;

    [JsonPropertyName("subjectTemplate")]
    public string SubjectTemplate { get; set; } = string.Empty;
}

public class FormSpamProtection
{
    [JsonPropertyName("honeypotFieldName")]
    public string HoneypotFieldName { get; set; } = "_website";

    [JsonPropertyName("rejectWhenHoneypotFilled")]
    public bool RejectWhenHoneypotFilled { get; set; } = true;

    [JsonPropertyName("requireConsent")]
    public bool RequireConsent { get; set; } = false;

    [JsonPropertyName("consentFieldName")]
    public string ConsentFieldName { get; set; } = "consent";
}

public class FormRateLimit
{
    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = false;

    [JsonPropertyName("maxSubmissions")]
    public int MaxSubmissions { get; set; } = 5;

    [JsonPropertyName("windowSeconds")]
    public int WindowSeconds { get; set; } = 300;
}
