using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Contact Block
public class ContactBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "Contact";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new ContactContent();
}

public class ContactContent
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("hours")]
    public string Hours { get; set; } = string.Empty;

    [JsonPropertyName("formFields")]
    public List<FormField> FormFields { get; set; } = new();

    [JsonPropertyName("submitButtonText")]
    public string SubmitButtonText { get; set; } = string.Empty;

    [JsonPropertyName("socialLinks")]
    public List<SocialLink> SocialLinks { get; set; } = new();
}

public class FormField
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("required")]
    public bool Required { get; set; } = false;

    [JsonPropertyName("placeholder")]
    public string Placeholder { get; set; } = string.Empty;
}

public class SocialLink
{
    [JsonPropertyName("platform")]
    public string Platform { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;
}