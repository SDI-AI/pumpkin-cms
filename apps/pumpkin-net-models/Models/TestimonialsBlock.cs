using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Testimonials Block
public class TestimonialsBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "Testimonials";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new TestimonialsContent();
}

public class TestimonialsContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;

    [JsonPropertyName("layout")]
    public string Layout { get; set; } = "carousel";

    [JsonPropertyName("items")]
    public List<TestimonialItem> Items { get; set; } = new();
}

public class TestimonialItem
{
    [JsonPropertyName("quote")]
    public string Quote { get; set; } = string.Empty;

    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    [JsonPropertyName("eventType")]
    public string EventType { get; set; } = string.Empty;

    [JsonPropertyName("rating")]
    public double Rating { get; set; } = 5.0;
}