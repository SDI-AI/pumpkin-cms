import type { Page } from 'pumpkin-ts-models';

/**
 * Renders JSON-LD structured data from the Page's seo.structuredData array.
 * Include this in your layout or page head.
 */
export function StructuredData({ page }: { page: Page }) {
  if (!page.seo.structuredData || page.seo.structuredData.length === 0) return null;

  return (
    <>
      {page.seo.structuredData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schema }}
        />
      ))}
    </>
  );
}
