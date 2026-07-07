import type { IHtmlBlock, Page } from 'pumpkin-ts-models';

interface CmsBlock extends IHtmlBlock {
  id: string;
  name: string;
  enabled: boolean;
}

export const fallbackHomePage: Page = {
  id: 'pumpkin-home',
  PageId: 'pumpkin-home',
  tenantId: 'pumpkin',
  pageSlug: 'home',
  PageVersion: 1,
  Layout: 'default',
  MetaData: {
    category: 'marketing',
    product: 'pumpkin-cms',
    keyword: 'headless cms',
    pageType: 'landing',
    title: 'Pumpkin CMS',
    description: 'Build fast, themeable websites with an API-first content system.',
    createdAt: '2026-07-03T00:00:00Z',
    updatedAt: '2026-07-03T00:00:00Z',
    author: 'Pumpkin CMS',
    language: 'en',
    market: 'US',
  },
  searchData: {
    state: '',
    city: '',
    metro: '',
    county: '',
    keyword: 'headless cms',
    tags: ['cms', 'nextjs', 'tailwind', 'multi-tenant'],
    contentSummary: 'Pumpkin CMS is a block-based CMS for modern tenant websites.',
    blockTypes: ['Hero', 'TrustBar', 'CardGrid', 'HowItWorks', 'FAQ', 'Form'],
  },
  seo: {
    metaTitle: 'Pumpkin CMS - Block-Based Websites for Modern Teams',
    metaDescription: 'Launch fast websites with Pumpkin CMS, a block-based content API and Tailwind theme system.',
    keywords: ['pumpkin cms', 'headless cms', 'nextjs cms', 'tailwind cms'],
    robots: 'index, follow',
    canonicalUrl: 'https://pumpkincms.com',
    alternateUrls: [],
    structuredData: [],
    openGraph: {
      'og:title': 'Pumpkin CMS',
      'og:description': 'A block-based CMS for fast tenant websites.',
      'og:type': 'website',
      'og:url': 'https://pumpkincms.com',
      'og:image': '',
      'og:image:alt': '',
      'og:site_name': 'Pumpkin CMS',
      'og:locale': 'en_US',
    },
    twitterCard: {
      'twitter:card': 'summary_large_image',
      'twitter:title': 'Pumpkin CMS',
      'twitter:description': 'A block-based CMS for fast tenant websites.',
      'twitter:image': '',
      'twitter:site': '',
      'twitter:creator': '',
    },
  },
  isPublished: true,
  publishedAt: '2026-07-03T00:00:00Z',
  includeInSitemap: true,
  contentRelationships: {
    isHub: true,
    hubPageSlug: '',
    topicCluster: 'pumpkin-cms',
    relatedHubs: [],
    spokePriority: 0,
  },
  ContentData: {
    ContentBlocks: [
      {
        id: 'hero',
        type: 'Hero',
        name: 'Hero',
        enabled: true,
        content: {
          type: 'split',
          headline: 'The starter app that becomes your site',
          subheadline:
            'Pumpkin CMS gives every tenant a fast Next.js front end, ISR page rendering, reusable content blocks, and a Tailwind theme layer you can customize without rebuilding the product from scratch.',
          backgroundImage: '',
          backgroundImageAltText: '',
          mainImage: '',
          mainImageAltText: '',
          buttonText: 'Build with Pumpkin',
          buttonLink: '#contact',
        },
      },
      {
        id: 'trust',
        type: 'TrustBar',
        name: 'Trust Bar',
        enabled: true,
        content: {
          items: [
            { icon: 'PlugZap', title: 'API-first', text: 'Content by slug', alt: '' },
            { icon: 'RefreshCw', title: 'ISR ready', text: 'Fast pages that refresh', alt: '' },
            { icon: 'Blocks', title: 'Block-based', text: 'Pages made from blocks', alt: '' },
            { icon: 'Palette', title: 'Tailwind themes', text: 'Override the look', alt: '' },
          ],
        },
      },
      {
        id: 'features',
        type: 'CardGrid',
        name: 'Features',
        enabled: true,
        content: {
          title: 'A practical foundation for every tenant site',
          subtitle:
            'Use this starter as the deployable front end for Pumpkin CMS customers, including pumpkincms.com itself.',
          layout: 'grid-3',
          cards: [
            {
              title: 'Slug-driven pages',
              description: 'The home page maps to the CMS home slug, and nested routes fetch matching page slugs from the API.',
              image: '',
              'image-alt': '',
              icon: '01',
              link: '#',
              alt: '',
            },
            {
              title: 'Theme-based chrome',
              description: 'Header, footer, navigation, and block styles come from the active theme with a Pumpkin fallback.',
              image: '',
              'image-alt': '',
              icon: '02',
              link: '#',
              alt: '',
            },
            {
              title: 'Tenant-safe config',
              description: 'API URL, tenant ID, and API key stay in deployment settings while public pages render server-side.',
              image: '',
              'image-alt': '',
              icon: '03',
              link: '#',
              alt: '',
            },
          ],
        },
      },
      {
        id: 'how-it-works',
        type: 'HowItWorks',
        name: 'How It Works',
        enabled: true,
        content: {
          title: 'From CMS content to shipped pages',
          steps: [
            {
              title: 'Create pages',
              text: 'Build a page in Pumpkin Admin and publish it with a slug like home, about, or services/design.',
              image: '',
              alt: '',
            },
            {
              title: 'Apply a theme',
              text: 'Set the active theme for the tenant. The starter reads its header, footer, menu, and block styles.',
              image: '',
              alt: '',
            },
            {
              title: 'Deploy once',
              text: 'Host the starter app, point it at the tenant API settings, and let ISR keep pages fresh.',
              image: '',
              alt: '',
            },
          ],
        },
      },
      {
        id: 'faq',
        type: 'FAQ',
        name: 'FAQ',
        enabled: true,
        content: {
          title: 'Starter app questions',
          subtitle: 'A few defaults baked into this deployable front end.',
          layout: 'accordion',
          items: [
            {
              question: 'Can this be pumpkincms.com?',
              answer: 'Yes. Without a CMS home page, it renders the bundled Pumpkin homepage and theme. With API settings, it can also pull live content from Pumpkin CMS.',
            },
            {
              question: 'Can other tenants use the same app?',
              answer: 'Yes. Deploy the same starter with different API URL, tenant ID, API key, and active theme settings.',
            },
            {
              question: 'Does the browser see the API key?',
              answer: 'No. Page and theme fetches run on the server, so the API key remains in server-side environment variables.',
            },
          ],
        },
      },
      {
        id: 'contact',
        type: 'Form',
        name: 'Contact Form',
        enabled: true,
        content: {
          formType: 'contact',
          title: 'Ready to shape the first tenant site?',
          subtitle: 'Use the admin app to publish a home page, then this starter will render it from Pumpkin CMS.',
          description: 'The form fields, validation, submit text, and storage behavior come from the contact FormDefinition.',
          layout: 'default',
          successMessage: 'Thanks, we received your message.',
        },
      },
    ] as CmsBlock[] as IHtmlBlock[],
  },
};
