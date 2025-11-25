using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Card Grid Block
public class CardGridBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "CardGrid";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new CardGridContent();
}

public class CardGridContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;

    [JsonPropertyName("layout")]
    public string Layout { get; set; } = "grid";

    [JsonPropertyName("cards")]
    public List<Card> Cards { get; set; } = new();
}

public class Card
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("image-alt")]
    public string ImageAlt { get; set; } = string.Empty;

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;

    [JsonPropertyName("link")]
    public string Link { get; set; } = string.Empty;

    [JsonPropertyName("alt")]
    public string Alt { get; set; } = string.Empty;
}