using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Hero Block
public class HeroBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "Hero";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new HeroContent();
}

public class HeroContent
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "Main";

    [JsonPropertyName("headline")]
    public string Headline { get; set; } = string.Empty;

    [JsonPropertyName("subheadline")]
    public string Subheadline { get; set; } = string.Empty;

    [JsonPropertyName("backgroundImage")]
    public string BackgroundImage { get; set; } = string.Empty;

    [JsonPropertyName("backgroundImageAltText")]
    public string BackgroundImageAltText { get; set; } = string.Empty;

    [JsonPropertyName("mainImage")]
    public string MainImage { get; set; } = string.Empty;

    [JsonPropertyName("mainImageAltText")]
    public string MainImageAltText { get; set; } = string.Empty;

    [JsonPropertyName("buttonText")]
    public string ButtonText { get; set; } = string.Empty;

    [JsonPropertyName("buttonLink")]
    public string ButtonLink { get; set; } = string.Empty;
}