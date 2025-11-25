using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// How It Works Block
public class HowItWorksBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "HowItWorks";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new HowItWorksContent();
}

public class HowItWorksContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("steps")]
    public List<Step> Steps { get; set; } = new();
}

public class Step
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("alt")]
    public string Alt { get; set; } = string.Empty;
}