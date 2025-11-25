using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Local Pro Tips Block
public class LocalProTipsBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "LocalProTips";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new LocalProTipsContent();
}

public class LocalProTipsContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("items")]
    public List<ProTipItem> Items { get; set; } = new();
}

public class ProTipItem
{
    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}