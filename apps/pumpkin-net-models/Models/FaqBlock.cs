using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// FAQ Block
public class FaqBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "FAQ";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new FaqContent();
}

public class FaqContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;

    [JsonPropertyName("layout")]
    public string Layout { get; set; } = "accordion";

    [JsonPropertyName("items")]
    public List<FaqItem> Items { get; set; } = new();
}

public class FaqItem
{
    [JsonPropertyName("question")]
    public string Question { get; set; } = string.Empty;

    [JsonPropertyName("answer")]
    public string Answer { get; set; } = string.Empty;
}