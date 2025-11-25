using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Primary CTA Block
public class PrimaryCtaBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "PrimaryCTA";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new PrimaryCtaContent();
}

public class PrimaryCtaContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("buttonText")]
    public string ButtonText { get; set; } = string.Empty;

    [JsonPropertyName("buttonLink")]
    public string ButtonLink { get; set; } = string.Empty;

    [JsonPropertyName("secondaryText")]
    public string SecondaryText { get; set; } = string.Empty;

    [JsonPropertyName("secondaryLinkText")]
    public string SecondaryLinkText { get; set; } = string.Empty;

    [JsonPropertyName("secondaryLink")]
    public string SecondaryLink { get; set; } = string.Empty;

    [JsonPropertyName("backgroundImage")]
    public string BackgroundImage { get; set; } = string.Empty;

    [JsonPropertyName("mainImage")]
    public string MainImage { get; set; } = string.Empty;

    [JsonPropertyName("alt")]
    public string Alt { get; set; } = string.Empty;
}