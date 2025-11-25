using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Secondary CTA Block
public class SecondaryCtaBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "SecondaryCTA";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new SecondaryCtaContent();
}

public class SecondaryCtaContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("buttonText")]
    public string ButtonText { get; set; } = string.Empty;

    [JsonPropertyName("buttonLink")]
    public string ButtonLink { get; set; } = string.Empty;
}