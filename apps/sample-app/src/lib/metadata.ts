import type { Page, SeoData, OpenGraphData, TwitterCardData, PageMetaData } from 'pumpkin-ts-models';
import type { Metadata } from 'next';

/**
 * Build Next.js `Metadata` from the Page model's SEO + MetaData fields.
 *
 * Usage in a page/layout:
 * ```ts
 * export async function generateMetadata(): Promise<Metadata> {
 *   const page = await fetchPage('home');
 *   return buildMetadata(page);
 * }
 * ```
 */
export function buildMetadata(page: Page): Metadata {
  const { seo, MetaData: meta } = page;

  return {
    title: seo.metaTitle || meta.title,
    description: seo.metaDescription || meta.description,
    keywords: seo.keywords,
    authors: meta.author ? [{ name: meta.author }] : undefined,

    robots: seo.robots || 'index, follow',

    alternates: {
      canonical: seo.canonicalUrl || undefined,
      languages: buildAlternateLanguages(seo),
    },

    openGraph: buildOpenGraph(seo.openGraph, seo),
    twitter: buildTwitter(seo.twitterCard),

    // Note: structuredData is now an array and should be rendered using the
    // <StructuredData> component in your page/layout, not via metadata.other
  };
}

function buildOpenGraph(og: OpenGraphData, seo: SeoData): Metadata['openGraph'] {
  return {
    title: og['og:title'] || seo.metaTitle,
    description: og['og:description'] || seo.metaDescription,
    type: (og['og:type'] as 'website') || 'website',
    url: og['og:url'] || seo.canonicalUrl,
    siteName: og['og:site_name'],
    locale: og['og:locale'] || 'en_US',
    images: og['og:image']
      ? [{ url: og['og:image'], alt: og['og:image:alt'] || '' }]
      : undefined,
  };
}

function buildTwitter(tw: TwitterCardData): Metadata['twitter'] {
  return {
    card: (tw['twitter:card'] as 'summary_large_image') || 'summary_large_image',
    title: tw['twitter:title'],
    description: tw['twitter:description'],
    images: tw['twitter:image'] ? [tw['twitter:image']] : undefined,
    site: tw['twitter:site'],
    creator: tw['twitter:creator'],
  };
}

function buildAlternateLanguages(seo: SeoData): Record<string, string> | undefined {
  if (!seo.alternateUrls || seo.alternateUrls.length === 0) return undefined;
  const map: Record<string, string> = {};
  for (const alt of seo.alternateUrls) {
    map[alt.hrefLang] = alt.href;
  }
  return map;
}
