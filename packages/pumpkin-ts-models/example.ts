import {
  Page,
  PageJsonConverter,
  HeroBlock,
  CardGridBlock,
  FaqBlock,
  isBlockOfType
} from './src/index';

/**
 * Example usage of Pumpkin TypeScript Models
 */

// Example 1: Creating a page manually
const examplePage: Page = {
  PageId: 'typescript-example',
  fullSlug: 'examples/typescript',
  PageVersion: 1,
  Layout: 'default',
  MetaData: {
    category: 'example',
    product: 'pumpkin-cms',
    keyword: 'typescript',
    title: 'TypeScript Example Page',
    description: 'Example of using Pumpkin TypeScript models',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: 'TypeScript Developer',
    language: 'en-us',
    market: 'global'
  },
  searchData: {
    state: '',
    city: '',
    keyword: 'typescript models',
    tags: ['typescript', 'pumpkin-cms', 'models'],
    contentSummary: 'Example page demonstrating TypeScript model usage',
    blockTypes: ['Hero']
  },
  ContentData: {
    ContentBlocks: [
      {
        type: 'Hero',
        content: {
          type: 'Main',
          headline: 'TypeScript Models',
          subheadline: 'Type-safe Pumpkin CMS development',
          backgroundImage: 'hero-bg.jpg',
          backgroundImageAltText: 'TypeScript code background',
          mainImage: 'typescript-logo.png',
          mainImageAltText: 'TypeScript logo',
          buttonText: 'Get Started',
          buttonLink: '/docs/typescript'
        }
      } as HeroBlock,
      {
        type: 'CardGrid',
        content: {
          title: 'TypeScript Benefits',
          subtitle: 'Why use TypeScript models?',
          layout: 'grid',
          cards: [
            {
              title: 'Type Safety',
              description: 'Catch errors at compile time',
              image: 'type-safety.jpg',
              'image-alt': 'Type safety illustration',
              icon: 'shield',
              link: '/docs/type-safety',
              alt: 'Learn about type safety'
            },
            {
              title: 'IntelliSense',
              description: 'Great developer experience',
              image: 'intellisense.jpg',
              'image-alt': 'IntelliSense screenshot',
              icon: 'lightbulb',
              link: '/docs/intellisense',
              alt: 'IntelliSense support'
            }
          ]
        }
      } as CardGridBlock,
      {
        type: 'FAQ',
        content: {
          title: 'Frequently Asked Questions',
          subtitle: 'Common questions about TypeScript models',
          layout: 'accordion',
          items: [
            {
              question: 'How do I install the TypeScript models?',
              answer: 'Run `npm install pumpkin-ts-models` in your project.'
            },
            {
              question: 'Are the models compatible with JavaScript?',
              answer: 'Yes, TypeScript compiles to JavaScript and can be used in JS projects.'
            }
          ]
        }
      } as FaqBlock
    ]
  },
  seo: {
    metaTitle: 'TypeScript Models - Pumpkin CMS',
    metaDescription: 'Type-safe models for Pumpkin CMS development',
    keywords: ['typescript', 'models', 'pumpkin-cms'],
    robots: 'index, follow',
    canonicalUrl: 'https://pumpkincms.dev/examples/typescript',
    alternateUrls: [],
    openGraph: {
      'og:title': 'TypeScript Models Example',
      'og:description': 'Example of using Pumpkin TypeScript models',
      'og:type': 'website',
      'og:url': 'https://pumpkincms.dev/examples/typescript',
      'og:image': 'typescript-og.jpg',
      'og:image:alt': 'TypeScript models',
      'og:site_name': 'Pumpkin CMS',
      'og:locale': 'en_US'
    },
    twitterCard: {
      'twitter:card': 'summary_large_image',
      'twitter:title': 'TypeScript Models',
      'twitter:description': 'Type-safe Pumpkin CMS models',
      'twitter:image': 'typescript-twitter.jpg',
      'twitter:site': '@pumpkincms',
      'twitter:creator': '@pumpkincms'
    }
  },
  isPublished: false,
  publishedAt: null
};

// Example 2: JSON conversion
console.log('=== JSON Conversion Example ===');

// Convert to JSON
const jsonString = PageJsonConverter.toJson(examplePage);
console.log('Page converted to JSON:', jsonString.substring(0, 200) + '...');

// Convert back from JSON
const parsedPage = PageJsonConverter.fromJson(jsonString);
console.log('Page parsed from JSON:', parsedPage?.PageId);

// Example 3: Type guards
console.log('\n=== Type Guards Example ===');

examplePage.ContentData.ContentBlocks.forEach((block, index) => {
  console.log(`Block ${index + 1}:`);
  
  if (isBlockOfType(block, 'Hero')) {
    console.log(`  Hero (${block.content.type}): ${block.content.headline}`);
  } else if (isBlockOfType(block, 'CardGrid')) {
    console.log(`  CardGrid: ${block.content.title} (${block.content.cards.length} cards)`);
  } else if (isBlockOfType(block, 'FAQ')) {
    console.log(`  FAQ: ${block.content.title} (${block.content.items.length} items)`);
  } else {
    console.log(`  Unknown block type: ${block.type}`);
  }
});

// Example 4: Validation
console.log('\n=== Validation Example ===');

const validJson = JSON.stringify(examplePage);
const invalidJson = '{"invalid": true}';

console.log('Valid JSON check:', PageJsonConverter.isValidPageJson(validJson));
console.log('Invalid JSON check:', PageJsonConverter.isValidPageJson(invalidJson));

export { examplePage };