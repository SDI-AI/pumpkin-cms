using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

public class HubSpokesBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "HubSpokes";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new HubSpokesContent();
}

public class HubSpokesContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;

    [JsonPropertyName("hubPageSlug")]
    public string HubPageSlug { get; set; } = string.Empty;

    [JsonPropertyName("layout")]
    public string Layout { get; set; } = "cards";

    [JsonPropertyName("limit")]
    public int Limit { get; set; } = 12;

    [JsonPropertyName("showExcerpt")]
    public bool ShowExcerpt { get; set; } = true;

    [JsonPropertyName("showLocation")]
    public bool ShowLocation { get; set; } = true;

    [JsonPropertyName("ctaText")]
    public string CtaText { get; set; } = "Learn more";

    [JsonPropertyName("spokes")]
    public List<HubSpokeLink> Spokes { get; set; } = new();
}

public class HubSpokeLink
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("metro")]
    public string Metro { get; set; } = string.Empty;

    [JsonPropertyName("spokePriority")]
    public int SpokePriority { get; set; }
}
