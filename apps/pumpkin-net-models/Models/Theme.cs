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

    [JsonPropertyName("label")]
    public string Label { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = "custom";

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("isSystem")]
    public bool IsSystem { get; set; } = false;

    [JsonPropertyName("isCustom")]
    public bool IsCustom { get; set; } = true;

    [JsonPropertyName("createdByUserId")]
    public string CreatedByUserId { get; set; } = string.Empty;

    [JsonPropertyName("version")]
    public int Version { get; set; } = 1;

    // CSS-variable theme tokens consumed by Tailwind and the starter app.

    [JsonPropertyName("preview")]
    public ThemePreview Preview { get; set; } = new();

    [JsonPropertyName("cssVariables")]
    public Dictionary<string, string> CssVariables { get; set; } = new();

    [JsonPropertyName("typography")]
    public ThemeTypography Typography { get; set; } = new();

    [JsonPropertyName("spacing")]
    public ThemeSpacing Spacing { get; set; } = new();

    [JsonPropertyName("borders")]
    public ThemeBorders Borders { get; set; } = new();

    [JsonPropertyName("shadows")]
    public ThemeShadows Shadows { get; set; } = new();

    [JsonPropertyName("compiledAssets")]
    public ThemeCompiledAssets? CompiledAssets { get; set; }

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

public class ThemePreview
{
    [JsonPropertyName("palette")]
    public List<string> Palette { get; set; } = new();

    [JsonPropertyName("background")]
    public string Background { get; set; } = string.Empty;

    [JsonPropertyName("foreground")]
    public string Foreground { get; set; } = string.Empty;

    [JsonPropertyName("primary")]
    public string Primary { get; set; } = string.Empty;

    [JsonPropertyName("accent")]
    public string Accent { get; set; } = string.Empty;
}

public class ThemeTypography
{
    [JsonPropertyName("fontSans")]
    public string FontSans { get; set; } = "Inter, system-ui, sans-serif";

    [JsonPropertyName("fontSerif")]
    public string FontSerif { get; set; } = "Georgia, serif";

    [JsonPropertyName("fontMono")]
    public string FontMono { get; set; } = "ui-monospace, SFMono-Regular, monospace";

    [JsonPropertyName("headingFont")]
    public string HeadingFont { get; set; } = "Inter, system-ui, sans-serif";

    [JsonPropertyName("bodyFont")]
    public string BodyFont { get; set; } = "Inter, system-ui, sans-serif";

    [JsonPropertyName("baseFontSize")]
    public string BaseFontSize { get; set; } = "16px";

    [JsonPropertyName("lineHeight")]
    public string LineHeight { get; set; } = "1.5";

    [JsonPropertyName("fontWeights")]
    public Dictionary<string, string> FontWeights { get; set; } = new();
}

public class ThemeSpacing
{
    [JsonPropertyName("baseUnit")]
    public string BaseUnit { get; set; } = "0.25rem";

    [JsonPropertyName("scale")]
    public Dictionary<string, string> Scale { get; set; } = new();
}

public class ThemeBorders
{
    [JsonPropertyName("radius")]
    public Dictionary<string, string> Radius { get; set; } = new();

    [JsonPropertyName("width")]
    public Dictionary<string, string> Width { get; set; } = new();

    [JsonPropertyName("style")]
    public string Style { get; set; } = "solid";
}

public class ThemeShadows
{
    [JsonPropertyName("scale")]
    public Dictionary<string, string> Scale { get; set; } = new();
}

public class ThemeCompiledAssets
{
    /// <summary>Runtime mode for this theme. "compiled" means CssUrl should be loaded.</summary>
    [JsonPropertyName("mode")]
    public string Mode { get; set; } = "runtime";

    /// <summary>Absolute or app-relative URL to the optimized stylesheet.</summary>
    [JsonPropertyName("cssUrl")]
    public string CssUrl { get; set; } = string.Empty;

    /// <summary>Optional subresource integrity hash for the stylesheet.</summary>
    [JsonPropertyName("cssIntegrity")]
    public string CssIntegrity { get; set; } = string.Empty;

    /// <summary>Base URL for fonts, images, and other files referenced by the stylesheet.</summary>
    [JsonPropertyName("assetsBaseUrl")]
    public string AssetsBaseUrl { get; set; } = string.Empty;

    /// <summary>URL to the generated package manifest.</summary>
    [JsonPropertyName("manifestUrl")]
    public string ManifestUrl { get; set; } = string.Empty;

    /// <summary>URL to the uploaded source/package archive.</summary>
    [JsonPropertyName("packageUrl")]
    public string PackageUrl { get; set; } = string.Empty;

    /// <summary>ISO timestamp from the theme compiler/build process.</summary>
    [JsonPropertyName("compiledAt")]
    public DateTime? CompiledAt { get; set; }

    /// <summary>Compiler identifier, for example "pumpkin-theme-compiler@1.0.0".</summary>
    [JsonPropertyName("compiler")]
    public string Compiler { get; set; } = string.Empty;

    /// <summary>Content hash used for cache busting and package verification.</summary>
    [JsonPropertyName("contentHash")]
    public string ContentHash { get; set; } = string.Empty;
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
