import type { Page } from 'pumpkin-ts-models';

/**
 * Renders JSON-LD structured data from the Page's seo.structuredData field.
 * Include this in your layout or page head.
 */
export function StructuredData({ page }: { page: Page }) {
  if (!page.seo.structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: page.seo.structuredData }}
    />
  );
}
