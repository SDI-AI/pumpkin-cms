import { IHtmlBlock } from './IHtmlBlock';
/**
 * Main page model representing a complete page structure
 */
export interface Page {
    PageId: string;
    fullSlug: string;
    PageVersion: number;
    Layout: string;
    MetaData: PageMetaData;
    searchData: SearchData;
    ContentData: ContentData;
    seo: SeoData;
    isPublished: boolean;
    publishedAt: string | null;
}
/**
 * Page metadata containing basic page information
 */
export interface PageMetaData {
    category: string;
    product: string;
    keyword: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    author: string;
    language: string;
    market: string;
}
/**
 * Search-related data for SEO and indexing
 */
export interface SearchData {
    state: string;
    city: string;
    keyword: string;
    tags: string[];
    contentSummary: string;
    blockTypes: string[];
}
/**
 * Container for all content blocks on a page
 */
export interface ContentData {
    ContentBlocks: IHtmlBlock[];
}
/**
 * Complete SEO metadata including Open Graph and Twitter Card data
 */
export interface SeoData {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    robots: string;
    canonicalUrl: string;
    alternateUrls: AlternateUrl[];
    openGraph: OpenGraphData;
    twitterCard: TwitterCardData;
}
/**
 * Alternate URL for different languages or regions
 */
export interface AlternateUrl {
    hrefLang: string;
    href: string;
}
/**
 * Open Graph metadata for social media sharing
 */
export interface OpenGraphData {
    'og:title': string;
    'og:description': string;
    'og:type': string;
    'og:url': string;
    'og:image': string;
    'og:image:alt': string;
    'og:site_name': string;
    'og:locale': string;
}
/**
 * Twitter Card metadata for Twitter sharing
 */
export interface TwitterCardData {
    'twitter:card': string;
    'twitter:title': string;
    'twitter:description': string;
    'twitter:image': string;
    'twitter:site': string;
    'twitter:creator': string;
}
//# sourceMappingURL=Page.d.ts.map