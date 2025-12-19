using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

/// <summary>
/// Blog block for displaying blog post content
/// </summary>
public class BlogBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "Blog";

    [JsonPropertyName("content")]
    public override object Content { get; set; } = new BlogContent();
}

public class BlogContent
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; set; } = string.Empty;

    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    [JsonPropertyName("authorImage")]
    public string AuthorImage { get; set; } = string.Empty;

    [JsonPropertyName("authorBio")]
    public string AuthorBio { get; set; } = string.Empty;

    [JsonPropertyName("publishedDate")]
    public DateTime PublishedDate { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("featuredImage")]
    public string FeaturedImage { get; set; } = string.Empty;

    [JsonPropertyName("featuredImageAlt")]
    public string FeaturedImageAlt { get; set; } = string.Empty;

    [JsonPropertyName("excerpt")]
    public string Excerpt { get; set; } = string.Empty;

    [JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty;

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonPropertyName("categories")]
    public List<string> Categories { get; set; } = new();

    [JsonPropertyName("readingTime")]
    public int ReadingTime { get; set; } = 0;

    [JsonPropertyName("relatedPosts")]
    public List<RelatedPost> RelatedPosts { get; set; } = new();
}

public class RelatedPost
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;

    [JsonPropertyName("excerpt")]
    public string Excerpt { get; set; } = string.Empty;

    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("imageAlt")]
    public string ImageAlt { get; set; } = string.Empty;

    [JsonPropertyName("publishedDate")]
    public DateTime PublishedDate { get; set; } = DateTime.UtcNow;
}
