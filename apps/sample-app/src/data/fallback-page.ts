import type { Page } from 'pumpkin-ts-models';
import type { IHtmlBlock } from 'pumpkin-ts-models';

/**
 * Extended block type with CMS metadata fields (id, name, enabled)
 * that come from the API but aren't part of the base IHtmlBlock interface.
 */
interface CmsBlock extends IHtmlBlock {
  id: string;
  name: string;
  enabled: boolean;
}

/**
 * Fallback home page used when the API doesn't return a "home" page.
 * Demonstrates all 14 content block types themed around Pumpkin CMS.
 *
 * In production, content comes from the API:
 *   GET /api/pages/{tenantId}/home
 */
export const fallbackHomePage: Page = {
  id: 'sample-home-001',
  PageId: 'sample-home-001',
  tenantId: 'pumpkin-demo',
  pageSlug: 'home',
  PageVersion: 1,
  Layout: 'default',

  MetaData: {
    category: 'marketing',
    product: 'pumpkin-cms',
    keyword: 'headless cms',
    pageType: 'landing',
    title: 'Pumpkin CMS — The Open-Source Headless CMS for Modern Web',
    description:
      'Build lightning-fast websites with Pumpkin CMS. Open-source, block-based content management with API-first architecture, multi-tenant support, and beautiful default themes.',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    author: 'Pumpkin CMS Team',
    language: 'en',
    market: 'US',
  },

  searchData: {
    state: '',
    city: '',
    metro: '',
    county: '',
    keyword: 'headless cms open source',
    tags: ['cms', 'headless', 'open-source', 'nextjs', 'react', 'tailwind', 'api-first'],
    contentSummary:
      'Pumpkin CMS is an open-source headless CMS with multi-tenant support, 14 content block types, and Tailwind-powered theming.',
    blockTypes: [
      'Hero', 'Breadcrumbs', 'TrustBar', 'CardGrid', 'HowItWorks', 'PrimaryCTA',
      'FAQ', 'Testimonials', 'Gallery', 'LocalProTips', 'ServiceAreaMap',
      'Blog', 'SecondaryCTA', 'Contact',
    ],
  },

  seo: {
    metaTitle: 'Pumpkin CMS — Open-Source Headless CMS for Modern Web',
    metaDescription:
      'Build blazing-fast websites with Pumpkin CMS. API-first headless CMS with 14 content blocks, multi-tenant architecture, and Tailwind CSS theming.',
    keywords: [
      'headless cms', 'open source cms', 'nextjs cms', 'react cms',
      'content blocks', 'api first', 'multi tenant', 'tailwind cms',
    ],
    robots: 'index, follow',
    canonicalUrl: 'https://pumpkincms.dev',
    alternateUrls: [],
    structuredData: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Pumpkin CMS',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: 'Open-source headless CMS with block-based content and multi-tenant support.',
    }),
    openGraph: {
      'og:title': 'Pumpkin CMS — Open-Source Headless CMS',
      'og:description':
        'Build modern websites with 14 content block types, API-first architecture, and Tailwind theming.',
      'og:type': 'website',
      'og:url': 'https://pumpkincms.dev',
      'og:image': 'https://pumpkincms.dev/images/og-cover.png',
      'og:image:alt': 'Pumpkin CMS — Headless Content Management',
      'og:site_name': 'Pumpkin CMS',
      'og:locale': 'en_US',
    },
    twitterCard: {
      'twitter:card': 'summary_large_image',
      'twitter:title': 'Pumpkin CMS — Open-Source Headless CMS',
      'twitter:description':
        'API-first headless CMS with 14 block types, multi-tenant architecture, and Tailwind CSS theming.',
      'twitter:image': 'https://pumpkincms.dev/images/og-cover.png',
      'twitter:site': '@pumpkincms',
      'twitter:creator': '@pumpkincms',
    },
  },

  isPublished: true,
  publishedAt: '2025-01-15T00:00:00Z',
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
      // ── 1. Breadcrumbs ─────────────────────────────────────
      {
        id: 'block-breadcrumbs',
        type: 'Breadcrumbs',
        name: 'Top Breadcrumbs',
        enabled: true,
        content: {
          items: [
            { label: 'Home', url: '/', current: false },
            { label: 'Product', url: '/product', current: true },
          ],
        },
      },

      // ── 2. Hero ────────────────────────────────────────────
      {
        id: 'block-hero',
        type: 'Hero',
        name: 'Main Hero',
        enabled: true,
        content: {
          type: 'split',
          headline: 'The Headless CMS That Grows With You',
          subheadline:
            'Pumpkin CMS is an open-source, API-first content management system with 14 ready-to-use content blocks, multi-tenant architecture, and drop-in Tailwind CSS theming.',
          backgroundImage: '',
          backgroundImageAltText: '',
          mainImage: '/images/hero-dashboard.png',
          mainImageAltText: 'Pumpkin CMS admin dashboard showing the page editor',
          buttonText: 'Get Started Free',
          buttonLink: 'https://github.com/pumpkin-cms/pumpkin',
        },
      },

      // ── 3. Trust Bar ───────────────────────────────────────
      {
        id: 'block-trustbar',
        type: 'TrustBar',
        name: 'Stats Bar',
        enabled: true,
        content: {
          items: [
            { icon: '🚀', title: '14 Block Types', text: 'Ready out of the box', alt: '' },
            { icon: '🏢', title: 'Multi-Tenant', text: 'One API, many sites', alt: '' },
            { icon: '🎨', title: 'Tailwind Theming', text: 'Override any class', alt: '' },
            { icon: '🔓', title: '100% Open Source', text: 'MIT licensed', alt: '' },
          ],
        },
      },

      // ── 4. Card Grid ───────────────────────────────────────
      {
        id: 'block-cardgrid',
        type: 'CardGrid',
        name: 'Features',
        enabled: true,
        content: {
          title: 'Everything You Need to Build Amazing Sites',
          subtitle: 'Pumpkin CMS ships with powerful features so you can focus on creating content, not infrastructure.',
          layout: 'grid-3',
          cards: [
            {
              title: 'Block-Based Content',
              description: 'Choose from 14 content block types — Hero, Card Grid, FAQ, Blog, Testimonials, and more. Mix and match to build any page layout.',
              image: '',
              'image-alt': '',
              icon: '🧱',
              link: '/features/blocks',
              alt: '',
            },
            {
              title: 'API-First Architecture',
              description: 'RESTful endpoints for every operation. Fetch pages by slug, manage tenants, and deliver content to any front-end framework.',
              image: '',
              'image-alt': '',
              icon: '🔌',
              link: '/features/api',
              alt: '',
            },
            {
              title: 'Multi-Tenant by Design',
              description: 'Isolate content per tenant with per-tenant CORS policies, API keys, and custom domains. Perfect for agencies and SaaS platforms.',
              image: '',
              'image-alt': '',
              icon: '🏢',
              link: '/features/multi-tenant',
              alt: '',
            },
            {
              title: 'Tailwind CSS Theming',
              description: 'Every block component accepts a classNames prop. Override individual style slots or replace the entire theme with your own Tailwind classes.',
              image: '',
              'image-alt': '',
              icon: '🎨',
              link: '/features/theming',
              alt: '',
            },
            {
              title: 'Azure Cosmos DB Ready',
              description: 'Built-in support for Azure Cosmos DB and MongoDB. Choose the database that fits your workload — or use both with the data connection abstraction.',
              image: '',
              'image-alt': '',
              icon: '☁️',
              link: '/features/database',
              alt: '',
            },
            {
              title: 'Visual Page Map',
              description: 'See the hub-spoke relationships between your pages with an interactive ReactFlow-powered page map. Plan your content architecture visually.',
              image: '',
              'image-alt': '',
              icon: '🗺️',
              link: '/features/page-map',
              alt: '',
            },
          ],
        },
      },

      // ── 5. How It Works ────────────────────────────────────
      {
        id: 'block-howitworks',
        type: 'HowItWorks',
        name: 'Getting Started Steps',
        enabled: true,
        content: {
          title: 'Up and Running in 3 Steps',
          steps: [
            {
              title: 'Clone & Configure',
              text: 'Clone the repo, set your connection string for Cosmos DB or MongoDB, and run the API. The sample data gets you started instantly.',
              image: '',
              alt: '',
            },
            {
              title: 'Create Your Content',
              text: 'Use the admin dashboard to create tenants, pages, and content blocks. The visual editor lets you arrange blocks in real time.',
              image: '',
              alt: '',
            },
            {
              title: 'Ship Your Site',
              text: 'Point your Next.js, Astro, or any front-end at the content API. Use pumpkin-block-views for instant rendering or build your own components.',
              image: '',
              alt: '',
            },
          ],
        },
      },

      // ── 6. Primary CTA ─────────────────────────────────────
      {
        id: 'block-primarycta',
        type: 'PrimaryCTA',
        name: 'Open Source CTA',
        enabled: true,
        content: {
          title: 'Free Forever. Open Source Always.',
          description:
            'Pumpkin CMS is MIT-licensed and community-driven. No hidden fees, no vendor lock-in. Star us on GitHub to show your support.',
          buttonText: 'Star on GitHub',
          buttonLink: 'https://github.com/pumpkin-cms/pumpkin',
          secondaryText: 'Want to contribute?',
          secondaryLinkText: 'Read the contributing guide →',
          secondaryLink: 'https://github.com/pumpkin-cms/pumpkin/blob/main/CONTRIBUTING.md',
          backgroundImage: '',
          mainImage: '',
          alt: '',
        },
      },

      // ── 7. FAQ ─────────────────────────────────────────────
      {
        id: 'block-faq',
        type: 'FAQ',
        name: 'Frequently Asked Questions',
        enabled: true,
        content: {
          title: 'Frequently Asked Questions',
          subtitle: 'Everything you need to know about Pumpkin CMS.',
          layout: 'accordion',
          items: [
            {
              question: 'What is Pumpkin CMS?',
              answer:
                'Pumpkin CMS is an open-source, API-first headless content management system. It provides a .NET 10 API backend, a Next.js admin dashboard, and a shared React component library for rendering content blocks with Tailwind CSS theming.',
            },
            {
              question: 'Which databases does Pumpkin CMS support?',
              answer:
                'Out of the box, Pumpkin CMS supports Azure Cosmos DB (NoSQL API) and MongoDB. The IDataConnection abstraction makes it straightforward to add other providers.',
            },
            {
              question: 'Can I use Pumpkin CMS with any front-end framework?',
              answer:
                'Absolutely. The content API is framework-agnostic — use it with Next.js, Astro, Remix, Vue, Angular, or even a static site generator. The pumpkin-block-views package provides pre-built React components, but you can build your own using the pumpkin-ts-models TypeScript interfaces.',
            },
            {
              question: 'How does multi-tenant support work?',
              answer:
                'Each tenant gets its own set of pages, API keys, and CORS policies. The API routes are scoped by tenantId, so content is fully isolated. A single Pumpkin CMS deployment can power dozens of sites.',
            },
            {
              question: 'Is there a hosted version?',
              answer:
                'Not yet — Pumpkin CMS is self-hosted. Deploy the API to Azure App Service, AWS, or any container host. The admin dashboard and sample app are standard Next.js apps that deploy anywhere.',
            },
            {
              question: 'How do I customize the look and feel?',
              answer:
                'Every block view component accepts a classNames prop that lets you override individual style slots with your own Tailwind classes. The mergeClasses utility handles the merge logic — you only specify the slots you want to change.',
            },
          ],
        },
      },

      // ── 8. Testimonials ────────────────────────────────────
      {
        id: 'block-testimonials',
        type: 'Testimonials',
        name: 'Community Feedback',
        enabled: true,
        content: {
          title: 'Loved by Developers',
          subtitle: 'Hear what the community is saying about Pumpkin CMS.',
          layout: 'grid',
          items: [
            {
              quote: 'Pumpkin CMS let me spin up a multi-tenant blog platform in a weekend. The block-based content model is exactly what I needed.',
              author: 'Alex Rivera',
              eventType: 'Agency Developer',
              rating: 5,
            },
            {
              quote: 'The Tailwind theming system is genius. I override a few classNames slots and the entire site matches my brand without fighting the framework.',
              author: 'Priya Sharma',
              eventType: 'Freelance Designer',
              rating: 5,
            },
            {
              quote: 'Finally a CMS that treats multi-tenancy as a first-class feature. Per-tenant CORS, API keys, and isolated content — it just works.',
              author: 'Marcus Chen',
              eventType: 'SaaS Founder',
              rating: 5,
            },
          ],
        },
      },

      // ── 9. Gallery ─────────────────────────────────────────
      {
        id: 'block-gallery',
        type: 'Gallery',
        name: 'Screenshots',
        enabled: true,
        content: {
          title: 'See Pumpkin CMS in Action',
          subtitle: 'A quick tour of the admin dashboard, page editor, and content blocks.',
          images: [
            { src: '/images/screenshots/dashboard.png', alt: 'Admin dashboard overview', caption: 'Dashboard — manage tenants and pages' },
            { src: '/images/screenshots/page-editor.png', alt: 'Two-column page editor', caption: 'Page Editor — visual block arrangement' },
            { src: '/images/screenshots/page-map.png', alt: 'Interactive page map', caption: 'Page Map — hub-spoke visualization' },
            { src: '/images/screenshots/block-editor.png', alt: 'Content block editor', caption: 'Block Editor — edit any block type' },
            { src: '/images/screenshots/tenant-form.png', alt: 'Tenant management form', caption: 'Tenant Manager — multi-tenant config' },
            { src: '/images/screenshots/api-response.png', alt: 'API JSON response', caption: 'Content API — clean JSON responses' },
            { src: '/images/screenshots/theme-compare.png', alt: 'Default vs custom theme', caption: 'Theming — before and after' },
            { src: '/images/screenshots/mobile-view.png', alt: 'Mobile responsive view', caption: 'Responsive — looks great on mobile' },
          ],
        },
      },

      // ── 10. Local Pro Tips ─────────────────────────────────
      {
        id: 'block-protips',
        type: 'LocalProTips',
        name: 'Developer Tips',
        enabled: true,
        content: {
          title: 'Pro Tips from the Pumpkin CMS Team',
          items: [
            {
              icon: '💡',
              image: '',
              title: 'Use the Cosmos DB Emulator',
              text: 'Run the Azure Cosmos DB Emulator locally for free development. No cloud costs until you deploy!',
            },
            {
              icon: '⚡',
              image: '',
              title: 'Leverage ISR for Performance',
              text: 'Combine Pumpkin\'s API with Next.js Incremental Static Regeneration for blazing-fast pages that stay up-to-date.',
            },
            {
              icon: '🎯',
              image: '',
              title: 'Start With the Sample App',
              text: 'This sample app is the fastest way to explore all 14 block types. Clone it, swap in your API key, and you\'re live.',
            },
            {
              icon: '🔑',
              image: '',
              title: 'Rotate API Keys Regularly',
              text: 'Each tenant has its own API key. Use the admin dashboard to regenerate keys without downtime.',
            },
          ],
        },
      },

      // ── 11. Service Area Map ───────────────────────────────
      {
        id: 'block-serviceareamap',
        type: 'ServiceAreaMap',
        name: 'Technology Ecosystem',
        enabled: true,
        content: {
          title: 'Works With Your Stack',
          subtitle: 'Pumpkin CMS integrates with the tools and platforms you already use.',
          mapEmbedUrl: '',
          neighborhoods: ['Next.js', 'React', 'Astro', 'Remix', 'Vue', 'Angular', 'Svelte'],
          zipCodes: ['Azure Cosmos DB', 'MongoDB', 'Azure App Service', 'Docker', 'Vercel', 'Netlify'],
          nearbyCities: ['TypeScript', 'Tailwind CSS', 'REST API', '.NET 10', 'JWT Auth', 'CORS'],
        },
      },

      // ── 12. Blog ───────────────────────────────────────────
      {
        id: 'block-blog',
        type: 'Blog',
        name: 'Launch Announcement',
        enabled: true,
        content: {
          title: 'Introducing Pumpkin CMS v1.0',
          subtitle: 'The open-source headless CMS built for modern web development.',
          author: 'Pumpkin CMS Team',
          authorImage: '/images/team-avatar.png',
          authorBio: 'The team behind Pumpkin CMS — building open-source tools for the modern web.',
          publishedDate: '2025-01-15',
          featuredImage: '/images/blog-launch.png',
          featuredImageAlt: 'Pumpkin CMS v1.0 launch announcement banner',
          excerpt:
            'After months of development, we\'re thrilled to release Pumpkin CMS v1.0 — a fully open-source, API-first headless CMS with multi-tenant support and 14 content block types.',
          body: `<h2>Why We Built Pumpkin CMS</h2>
<p>Content management shouldn't be complicated. We wanted a CMS that's <strong>API-first</strong>, supports <strong>multi-tenancy out of the box</strong>, and gives developers full control over the front-end.</p>
<h3>Key Features in v1.0</h3>
<ul>
<li><strong>14 Content Block Types</strong> — Hero, Card Grid, FAQ, Blog, Testimonials, Gallery, and more</li>
<li><strong>Multi-Tenant Architecture</strong> — isolated content, API keys, and CORS per tenant</li>
<li><strong>Tailwind CSS Theming</strong> — override any style slot with your own classes</li>
<li><strong>Azure Cosmos DB & MongoDB</strong> — choose your database or use both</li>
<li><strong>Visual Page Map</strong> — see hub-spoke relationships with ReactFlow</li>
</ul>
<h3>What's Next</h3>
<p>We're working on image asset management, scheduled publishing, and a plugin system. Follow us on GitHub to stay updated.</p>`,
          tags: ['launch', 'v1.0', 'open-source', 'headless-cms'],
          categories: ['Announcements'],
          readingTime: '3 min read',
          relatedPosts: [
            {
              title: 'Getting Started with Pumpkin CMS',
              slug: '/blog/getting-started',
              image: '/images/blog-getting-started.png',
              excerpt: 'A step-by-step guide to setting up your first Pumpkin CMS project.',
            },
            {
              title: 'Theming with Tailwind CSS',
              slug: '/blog/theming-tailwind',
              image: '/images/blog-theming.png',
              excerpt: 'Learn how to customize every block with the classNames override system.',
            },
          ],
        },
      },

      // ── 13. Secondary CTA ──────────────────────────────────
      {
        id: 'block-secondarycta',
        type: 'SecondaryCTA',
        name: 'Newsletter CTA',
        enabled: true,
        content: {
          title: 'Stay in the Loop',
          description: 'Get notified about new releases, features, and community updates. No spam — just pumpkin patches.',
          buttonText: 'Subscribe to Updates',
          buttonLink: 'https://pumpkincms.dev/newsletter',
        },
      },

      // ── 14. Contact ────────────────────────────────────────
      {
        id: 'block-contact',
        type: 'Contact',
        name: 'Get In Touch',
        enabled: true,
        content: {
          id: 'contact-form',
          title: 'Get in Touch',
          subtitle: 'Have questions about Pumpkin CMS? We\'d love to hear from you.',
          address: '',
          phone: '',
          email: 'hello@pumpkincms.dev',
          hours: '',
          formFields: [
            { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'Jane Developer' },
            { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'jane@example.com' },
            { name: 'subject', label: 'Subject', type: 'text', required: false, placeholder: 'Question about Pumpkin CMS' },
            { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Tell us what\'s on your mind...' },
          ],
          submitButtonText: 'Send Message',
          socialLinks: [
            { platform: 'github', url: 'https://github.com/pumpkin-cms/pumpkin', icon: 'github' },
            { platform: 'twitter', url: 'https://twitter.com/pumpkincms', icon: 'twitter' },
            { platform: 'discord', url: 'https://discord.gg/pumpkincms', icon: 'discord' },
          ],
        },
      },
    ] as CmsBlock[] as IHtmlBlock[],
  },
};
