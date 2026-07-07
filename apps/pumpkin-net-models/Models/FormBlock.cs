using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

public class FormBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "Form";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new FormBlockContent();
}

public class FormBlockContent
{
    [JsonPropertyName("formType")]
    public string FormType { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("layout")]
    public string Layout { get; set; } = "default";

    [JsonPropertyName("successMessage")]
    public string SuccessMessage { get; set; } = string.Empty;
}
