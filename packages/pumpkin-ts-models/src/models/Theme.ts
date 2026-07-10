// ─── Per-block style overrides ───────────────────────────────
// Mirrors BlockClassNamesMap from pumpkin-block-views but as a
// serialisable dictionary so it can live in a Cosmos DB document.
// Outer key = block type ("Hero", "CardGrid", …)
// Inner key = style slot  ("root", "headline", …)
// Value     = CSS class string

export type BlockStyleMap = Record<string, Record<string, string>>;

// ─── Menu tree ───────────────────────────────────────────────

export interface MenuItem {
  label: string;
  url: string;
  target: string;
  icon: string;
  order: number;
  isVisible: boolean;
  children: MenuItem[];
}

// ─── Header / Footer ────────────────────────────────────────

export interface ThemeHeader {
  logoUrl: string;
  logoAlt: string;
  sticky: boolean;
  /** CTA button label shown in the header (e.g. "Get Started"). Empty = hidden. */
  ctaText: string;
  /** CTA button destination URL. */
  ctaUrl: string;
  /** CTA link target: "_self" | "_blank". */
  ctaTarget: string;
  /** Style-slot class overrides applied to the header wrapper. */
  classNames: Record<string, string>;
}

export interface ThemeFooter {
  copyright: string;
  /** Short brand description displayed in the footer brand column. */
  description: string;
  /** Style-slot class overrides applied to the footer wrapper. */
  classNames: Record<string, string>;
}

export interface ThemePreview {
  palette: string[];
  background: string;
  foreground: string;
  primary: string;
  accent: string;
}

export interface ThemeTypography {
  fontSans: string;
  fontSerif: string;
  fontMono: string;
  headingFont: string;
  bodyFont: string;
  baseFontSize: string;
  lineHeight: string;
  fontWeights: Record<string, string>;
}

export interface ThemeSpacing {
  baseUnit: string;
  scale: Record<string, string>;
}

export interface ThemeBorders {
  radius: Record<string, string>;
  width: Record<string, string>;
  style: string;
}

export interface ThemeShadows {
  scale: Record<string, string>;
}

// ─── Compiled theme assets ──────────────────────────────────

/**
 * References to precompiled theme files. Tailwind/theme generation happens
 * outside the running app; tenants load the optimized CSS from blob/CDN.
 */
export interface ThemeCompiledAssets {
  /** Runtime mode for this theme. "compiled" means cssUrl should be loaded. */
  mode: 'runtime' | 'compiled' | string;
  /** Absolute or app-relative URL to the optimized stylesheet. */
  cssUrl?: string;
  /** Optional subresource integrity hash for the stylesheet. */
  cssIntegrity?: string;
  /** Base URL for fonts, images, and other files referenced by the stylesheet. */
  assetsBaseUrl?: string;
  /** URL to the generated package manifest. */
  manifestUrl?: string;
  /** URL to the uploaded source/package archive. */
  packageUrl?: string;
  /** ISO timestamp from the theme compiler/build process. */
  compiledAt?: string;
  /** Compiler identifier, for example "pumpkin-theme-compiler@1.0.0". */
  compiler?: string;
  /** Content hash used for cache busting and package verification. */
  contentHash?: string;
}

// ─── Theme (top-level document) ──────────────────────────────

/**
 * A site-wide theme stored per tenant.  Contains header & footer layout settings,
 * per-block-type style overrides (matching the BlockClassNamesMap pattern),
 * and a recursive navigation menu tree.
 */
export interface Theme {
  id: string;
  themeId: string;
  tenantId: string;
  name: string;
  label: string;
  description: string;
  category: string;
  tags: string[];
  isActive: boolean;
  isSystem: boolean;
  isCustom: boolean;
  createdByUserId: string;
  version: number;

  preview: ThemePreview;
  cssVariables: Record<string, string>;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borders: ThemeBorders;
  shadows: ThemeShadows;
  compiledAssets?: ThemeCompiledAssets;

  header: ThemeHeader;
  footer: ThemeFooter;

  /** Per-block-type classNames overrides (mirrors BlockClassNamesMap). */
  blockStyles: BlockStyleMap;

  menu: MenuItem[];

  createdAt: string;
  updatedAt: string;
}
