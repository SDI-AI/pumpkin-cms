import type { IHtmlBlock } from 'pumpkin-ts-models'

export interface BlockTypeInfo {
  type: string
  label: string
  icon: string
  category: 'hero' | 'cta' | 'content' | 'navigation' | 'interaction' | 'blog'
  description: string
}

export const BLOCK_TYPE_INFO: BlockTypeInfo[] = [
  { type: 'Hero', label: 'Hero', icon: '???', category: 'hero', description: 'Full-width hero banner with headline, images, and CTA' },
  { type: 'PrimaryCTA', label: 'Primary CTA', icon: '??', category: 'cta', description: 'Primary call-to-action with background image' },
  { type: 'SecondaryCTA', label: 'Secondary CTA', icon: '??', category: 'cta', description: 'Lighter call-to-action section' },
  { type: 'CardGrid', label: 'Card Grid', icon: '??', category: 'content', description: 'Grid of cards with images, icons, and links' },
  { type: 'FAQ', label: 'FAQ', icon: '?', category: 'content', description: 'Frequently asked questions accordion' },
  { type: 'Breadcrumbs', label: 'Breadcrumbs', icon: '??', category: 'navigation', description: 'Navigation breadcrumb trail' },
  { type: 'TrustBar', label: 'Trust Bar', icon: '???', category: 'navigation', description: 'Trust indicators with icons' },
  { type: 'HowItWorks', label: 'How It Works', icon: '??', category: 'navigation', description: 'Step-by-step process section' },
  { type: 'ServiceAreaMap', label: 'Service Area Map', icon: '???', category: 'navigation', description: 'Map with neighborhoods and zip codes' },
  { type: 'LocalProTips', label: 'Local Pro Tips', icon: '??', category: 'navigation', description: 'Expert tips section' },
  { type: 'Gallery', label: 'Gallery', icon: '???', category: 'interaction', description: 'Image gallery with captions' },
  { type: 'Testimonials', label: 'Testimonials', icon: '?', category: 'interaction', description: 'Customer reviews and testimonials' },
  { type: 'Contact', label: 'Contact', icon: '??', category: 'interaction', description: 'Contact form with details' },
  { type: 'Blog', label: 'Blog', icon: '??', category: 'blog', description: 'Blog post content block' },
]

export const BLOCK_CATEGORIES = [
  { key: 'hero', label: 'Hero & Banners' },
  { key: 'cta', label: 'Call to Action' },
  { key: 'content', label: 'Content' },
  { key: 'navigation', label: 'Navigation & Info' },
  { key: 'interaction', label: 'Interactive' },
  { key: 'blog', label: 'Blog' },
] as const

export function createDefaultBlock(type: string): IHtmlBlock {
  switch (type) {
    case 'Hero':
      return { type: 'Hero', content: { type: 'Main', headline: '', subheadline: '', backgroundImage: '', backgroundImageAltText: '', mainImage: '', mainImageAltText: '', buttonText: '', buttonLink: '' } }
    case 'PrimaryCTA':
      return { type: 'PrimaryCTA', content: { title: '', description: '', buttonText: '', buttonLink: '', secondaryText: '', secondaryLinkText: '', secondaryLink: '', backgroundImage: '', mainImage: '', alt: '' } }
    case 'SecondaryCTA':
      return { type: 'SecondaryCTA', content: { title: '', description: '', buttonText: '', buttonLink: '' } }
    case 'CardGrid':
      return { type: 'CardGrid', content: { title: '', subtitle: '', layout: 'grid-3', cards: [] } }
    case 'FAQ':
      return { type: 'FAQ', content: { title: '', subtitle: '', layout: 'accordion', items: [] } }
    case 'Breadcrumbs':
      return { type: 'Breadcrumbs', content: { items: [] } }
    case 'TrustBar':
      return { type: 'TrustBar', content: { items: [] } }
    case 'HowItWorks':
      return { type: 'HowItWorks', content: { title: '', steps: [] } }
    case 'ServiceAreaMap':
      return { type: 'ServiceAreaMap', content: { title: '', subtitle: '', mapEmbedUrl: '', neighborhoods: [], zipCodes: [], nearbyCities: [] } }
    case 'LocalProTips':
      return { type: 'LocalProTips', content: { title: '', items: [] } }
    case 'Gallery':
      return { type: 'Gallery', content: { title: '', subtitle: '', images: [] } }
    case 'Testimonials':
      return { type: 'Testimonials', content: { title: '', subtitle: '', layout: 'carousel', items: [] } }
    case 'Contact':
      return { type: 'Contact', content: { id: '', title: '', subtitle: '', address: '', phone: '', email: '', hours: '', formFields: [], submitButtonText: 'Submit', socialLinks: [] } }
    case 'Blog':
      return { type: 'Blog', content: { title: '', subtitle: '', author: '', authorImage: '', authorBio: '', publishedDate: '', featuredImage: '', featuredImageAlt: '', excerpt: '', body: '', tags: [], categories: [], readingTime: 0, relatedPosts: [] } }
    default:
      return { type, content: {} }
  }
}
