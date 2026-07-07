import type { Metadata } from 'next';
import type { OpenGraphData, Page, SeoData, TwitterCardData } from 'pumpkin-ts-models';

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

function buildTwitter(twitterCard: TwitterCardData): Metadata['twitter'] {
  return {
    card: (twitterCard['twitter:card'] as 'summary_large_image') || 'summary_large_image',
    title: twitterCard['twitter:title'],
    description: twitterCard['twitter:description'],
    images: twitterCard['twitter:image'] ? [twitterCard['twitter:image']] : undefined,
    site: twitterCard['twitter:site'],
    creator: twitterCard['twitter:creator'],
  };
}

function buildAlternateLanguages(seo: SeoData): Record<string, string> | undefined {
  if (!seo.alternateUrls?.length) return undefined;

  return seo.alternateUrls.reduce<Record<string, string>>((languages, alternateUrl) => {
    languages[alternateUrl.hrefLang] = alternateUrl.href;
    return languages;
  }, {});
}
