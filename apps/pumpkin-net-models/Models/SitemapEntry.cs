using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

/// <summary>
/// Represents a single entry in the sitemap, containing page slug and last modification date.
/// </summary>
public class SitemapEntry
{
    /// <summary>
    /// The page slug (URL path segment).
    /// </summary>
    [JsonPropertyName("pageSlug")]
    public string PageSlug { get; set; } = string.Empty;

    /// <summary>
    /// The last modification date. Uses publishedAt if available, otherwise updatedAt.
    /// </summary>
    [JsonPropertyName("lastModified")]
    public DateTime LastModified { get; set; }
}
