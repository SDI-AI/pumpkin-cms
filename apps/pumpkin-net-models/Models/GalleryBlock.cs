using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Gallery Block
public class GalleryBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "Gallery";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new GalleryContent();
}

public class GalleryContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;

    [JsonPropertyName("images")]
    public List<GalleryImage> Images { get; set; } = new();
}

public class GalleryImage
{
    [JsonPropertyName("src")]
    public string Src { get; set; } = string.Empty;

    [JsonPropertyName("alt")]
    public string Alt { get; set; } = string.Empty;

    [JsonPropertyName("caption")]
    public string Caption { get; set; } = string.Empty;
}