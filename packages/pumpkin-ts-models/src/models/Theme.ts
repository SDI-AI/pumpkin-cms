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
  description: string;
  isActive: boolean;

  header: ThemeHeader;
  footer: ThemeFooter;

  /** Per-block-type classNames overrides (mirrors BlockClassNamesMap). */
  blockStyles: BlockStyleMap;

  menu: MenuItem[];

  createdAt: string;
  updatedAt: string;
}
