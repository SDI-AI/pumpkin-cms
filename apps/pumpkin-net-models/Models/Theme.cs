using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

/// <summary>
/// A site-wide theme stored per tenant.  Contains header &amp; footer layout settings,
/// per-block-type style overrides (matching the BlockClassNamesMap pattern),
/// and a recursive navigation menu tree.
/// </summary>
public class Theme
{
    [JsonPropertyName("id")]
    public string Id
    {
        get => ThemeId;
        set => ThemeId = value;
    }

    [JsonPropertyName("themeId")]
    public string ThemeId { get; set; } = string.Empty;

    [JsonPropertyName("tenantId")]
    public string TenantId { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    // ── Layout sections ──────────────────────────────────────

    [JsonPropertyName("header")]
    public ThemeHeader Header { get; set; } = new();

    [JsonPropertyName("footer")]
    public ThemeFooter Footer { get; set; } = new();

    // ── Per-block-type style overrides ───────────────────────
    // Outer key = block type ("Hero", "CardGrid", …)
    // Inner key = style slot  ("root", "headline", …)
    // Value     = CSS class string

    [JsonPropertyName("blockStyles")]
    public Dictionary<string, Dictionary<string, string>> BlockStyles { get; set; } = new();

    // ── Navigation ───────────────────────────────────────────

    [JsonPropertyName("menu")]
    public List<MenuItem> Menu { get; set; } = new();

    // ── Audit ────────────────────────────────────────────────

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// ─── Header ──────────────────────────────────────────────────

public class ThemeHeader
{
    [JsonPropertyName("logoUrl")]
    public string LogoUrl { get; set; } = string.Empty;

    [JsonPropertyName("logoAlt")]
    public string LogoAlt { get; set; } = string.Empty;

    [JsonPropertyName("sticky")]
    public bool Sticky { get; set; } = false;

    /// <summary>CTA button label shown in the header (e.g. "Get Started"). Empty = hidden.</summary>
    [JsonPropertyName("ctaText")]
    public string CtaText { get; set; } = string.Empty;

    /// <summary>CTA button destination URL.</summary>
    [JsonPropertyName("ctaUrl")]
    public string CtaUrl { get; set; } = string.Empty;

    /// <summary>CTA link target: "_self" | "_blank".</summary>
    [JsonPropertyName("ctaTarget")]
    public string CtaTarget { get; set; } = "_self";

    /// <summary>Style-slot class overrides applied to the header wrapper.</summary>
    [JsonPropertyName("classNames")]
    public Dictionary<string, string> ClassNames { get; set; } = new();
}

// ─── Footer ──────────────────────────────────────────────────

public class ThemeFooter
{
    [JsonPropertyName("copyright")]
    public string Copyright { get; set; } = string.Empty;

    /// <summary>Short brand description displayed in the footer brand column.</summary>
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    /// <summary>Style-slot class overrides applied to the footer wrapper.</summary>
    [JsonPropertyName("classNames")]
    public Dictionary<string, string> ClassNames { get; set; } = new();
}

// ─── Menu tree ───────────────────────────────────────────────

public class MenuItem
{
    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("target")]
    public string Target { get; set; } = "_self";

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;

    [JsonPropertyName("order")]
    public int Order { get; set; } = 0;

    [JsonPropertyName("isVisible")]
    public bool IsVisible { get; set; } = true;

    [JsonPropertyName("children")]
    public List<MenuItem> Children { get; set; } = new();
}
