using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

public class Page
{
    [JsonPropertyName("id")]
    public string Id 
    { 
        get => PageId; 
        set => PageId = value; 
    }

    [JsonPropertyName("PageId")]
    public string PageId { get; set; } = string.Empty;

    [JsonPropertyName("tenantId")]
    public string TenantId { get; set; } = string.Empty;

    private string _pageSlug = string.Empty;
    
    [JsonPropertyName("pageSlug")]
    public string PageSlug 
    { 
        get => _pageSlug;
        set => _pageSlug = value?.ToLowerInvariant() ?? string.Empty;
    }

    [JsonPropertyName("PageVersion")]
    public int PageVersion { get; set; } = 1;

    [JsonPropertyName("Layout")]
    public string Layout { get; set; } = string.Empty;

    [JsonPropertyName("MetaData")]
    public PageMetaData MetaData { get; set; } = new();

    [JsonPropertyName("searchData")]
    public SearchData SearchData { get; set; } = new();

    [JsonPropertyName("ContentData")]
    public ContentData ContentData { get; set; } = new();

    [JsonPropertyName("seo")]
    public SeoData Seo { get; set; } = new();

    [JsonPropertyName("isPublished")]
    public bool IsPublished { get; set; } = false;

    [JsonPropertyName("publishedAt")]
    public DateTime? PublishedAt { get; set; } = null;

    [JsonPropertyName("includeInSitemap")]
    public bool IncludeInSitemap { get; set; } = true;
}

public class PageMetaData
{
    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("product")]
    public string Product { get; set; } = string.Empty;

    [JsonPropertyName("keyword")]
    public string Keyword { get; set; } = string.Empty;

    [JsonPropertyName("pageType")]
    public string PageType { get; set; } = "Keyword";

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("author")]
    public string Author { get; set; } = string.Empty;

    [JsonPropertyName("language")]
    public string Language { get; set; } = "en-us";

    [JsonPropertyName("market")]
    public string Market { get; set; } = string.Empty;
}

public class SearchData
{
    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("metro")]
    public string Metro { get; set; } = string.Empty;

    [JsonPropertyName("county")]
    public string County { get; set; } = string.Empty;

    [JsonPropertyName("keyword")]
    public string Keyword { get; set; } = string.Empty;

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonPropertyName("contentSummary")]
    public string ContentSummary { get; set; } = string.Empty;

    [JsonPropertyName("blockTypes")]
    public List<string> BlockTypes { get; set; } = new();
}

public class ContentData
{
    [JsonPropertyName("ContentBlocks")]
    public List<HtmlBlockBase> ContentBlocks { get; set; } = new();
}

public class SeoData
{
    [JsonPropertyName("metaTitle")]
    public string MetaTitle { get; set; } = string.Empty;

    [JsonPropertyName("metaDescription")]
    public string MetaDescription { get; set; } = string.Empty;

    [JsonPropertyName("keywords")]
    public List<string> Keywords { get; set; } = new();

    [JsonPropertyName("robots")]
    public string Robots { get; set; } = "index, follow";

    [JsonPropertyName("canonicalUrl")]
    public string CanonicalUrl { get; set; } = string.Empty;

    [JsonPropertyName("alternateUrls")]
    public List<AlternateUrl> AlternateUrls { get; set; } = new();

    [JsonPropertyName("structuredData")]
    public string StructuredData { get; set; } = string.Empty;

    [JsonPropertyName("openGraph")]
    public OpenGraphData OpenGraph { get; set; } = new();

    [JsonPropertyName("twitterCard")]
    public TwitterCardData TwitterCard { get; set; } = new();
}

public class AlternateUrl
{
    [JsonPropertyName("hrefLang")]
    public string HrefLang { get; set; } = string.Empty;

    [JsonPropertyName("href")]
    public string Href { get; set; } = string.Empty;
}

public class OpenGraphData
{
    [JsonPropertyName("og:title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("og:description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("og:type")]
    public string Type { get; set; } = "website";

    [JsonPropertyName("og:url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("og:image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("og:image:alt")]
    public string ImageAlt { get; set; } = string.Empty;

    [JsonPropertyName("og:site_name")]
    public string SiteName { get; set; } = string.Empty;

    [JsonPropertyName("og:locale")]
    public string Locale { get; set; } = "en_US";
}

public class TwitterCardData
{
    [JsonPropertyName("twitter:card")]
    public string Card { get; set; } = "summary_large_image";

    [JsonPropertyName("twitter:title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("twitter:description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("twitter:image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("twitter:site")]
    public string Site { get; set; } = string.Empty;

    [JsonPropertyName("twitter:creator")]
    public string Creator { get; set; } = string.Empty;
}