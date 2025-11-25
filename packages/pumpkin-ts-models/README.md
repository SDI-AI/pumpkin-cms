# Pumpkin TypeScript Models

TypeScript models and utilities for Pumpkin CMS - the TypeScript equivalent of the .NET models library.

## Installation

```bash
npm install pumpkin-ts-models
```

## Usage

### Basic Types

```typescript
import { Page, IHtmlBlock, HeroBlock, CardGridBlock } from 'pumpkin-ts-models';

// Create a page
const page: Page = {
  PageId: 'example-page',
  fullSlug: 'example/page',
  PageVersion: 1,
  Layout: 'default',
  MetaData: {
    title: 'Example Page',
    description: 'This is an example page',
    author: 'Content Team',
    // ... other metadata
  },
  ContentData: {
    ContentBlocks: [
      {
        type: 'Hero',
        content: {
          headline: 'Welcome to Our Site',
          subheadline: 'We\'re glad you\'re here',
          buttonText: 'Get Started',
          buttonLink: '/get-started',
          // ... other hero content
        }
      } as HeroBlock
    ]
  },
  // ... other page properties
};
```

### JSON Conversion

```typescript
import { PageJsonConverter } from 'pumpkin-ts-models';

// Convert JSON to Page object
const page = PageJsonConverter.fromJson(jsonString);

// Convert Page object to JSON
const json = PageJsonConverter.toJson(page);

// Validate JSON format
const isValid = PageJsonConverter.isValidPageJson(jsonString);

// File operations (Node.js only)
const page = await PageJsonConverter.fromJsonFile('page.json');
await PageJsonConverter.toJsonFile(page, 'output.json');
```

### Block Type Guards

```typescript
import { isBlockOfType, isHtmlBlock } from 'pumpkin-ts-models';

// Check if a block is a specific type
if (isBlockOfType(block, 'Hero')) {
  // TypeScript knows this is a HeroBlock
  console.log(block.content.headline);
}

// Check if an object is a valid HTML block
if (isHtmlBlock(someObject)) {
  // TypeScript knows this has type and content properties
  console.log(someObject.type);
}
```

## Supported Block Types

### Hero Blocks
- `HeroBlock` - Main hero section
- `HeroSecondaryBlock` - Secondary hero section  
- `HeroTertiaryBlock` - Tertiary hero section

### CTA Blocks
- `PrimaryCtaBlock` - Primary call-to-action
- `SecondaryCtaBlock` - Secondary call-to-action

### Content Blocks
- `CardGridBlock` - Grid of cards
- `FaqBlock` - Frequently asked questions

### Navigation Blocks
- `BreadcrumbsBlock` - Navigation breadcrumbs
- `TrustBarBlock` - Trust indicators
- `HowItWorksBlock` - Step-by-step process
- `ServiceAreaMapBlock` - Geographic service area
- `LocalProTipsBlock` - Local tips and advice

### Interaction Blocks
- `GalleryBlock` - Image gallery
- `TestimonialsBlock` - Customer testimonials
- `ContactBlock` - Contact form and information

## Type Safety

All interfaces are fully typed with TypeScript, providing:

- **Compile-time type checking**
- **IntelliSense support** in VS Code and other editors
- **Refactoring safety**
- **Documentation through types**

## Compatibility

This library is designed to be compatible with:

- **Node.js** 18+ 
- **Modern browsers** (ES2020+)
- **TypeScript** 5.0+
- **Bundlers** like Webpack, Vite, Rollup

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Development mode (watch)
npm run dev

# Clean build output
npm run clean
```

## License

MIT - See LICENSE file for details.