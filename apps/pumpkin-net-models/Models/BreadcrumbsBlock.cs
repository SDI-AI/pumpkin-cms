using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Breadcrumbs Block
public class BreadcrumbsBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "Breadcrumbs";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new BreadcrumbsContent();
}

public class BreadcrumbsContent
{
    [JsonPropertyName("items")]
    public List<BreadcrumbItem> Items { get; set; } = new();
}

public class BreadcrumbItem
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("current")]
    public bool Current { get; set; } = false;
}