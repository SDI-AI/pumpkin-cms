import { PageJsonConverter, isBlockOfType } from '../src/index';

/**
 * Example demonstrating improved polymorphic HTML block handling
 */

const examplePageJson = `{
  "id": "example-123",
  "PageId": "example-123",
  "tenantId": "demo-tenant",
  "pageSlug": "Test/Sample-Page",
  "PageVersion": 1,
  "Layout": "default",
  "MetaData": {
    "category": "test",
    "product": "demo",
    "keyword": "example",
    "title": "Example Page",
    "description": "Test page",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "author": "Test Author",
    "language": "en-us",
    "market": "global"
  },
  "searchData": {
    "state": "",
    "city": "",
    "keyword": "test",
    "tags": ["test"],
    "contentSummary": "Test page",
    "blockTypes": ["Hero", "CardGrid"]
  },
  "ContentData": {
    "ContentBlocks": [
      {
        "type": "Hero",
        "content": {
          "type": "Main",
          "headline": "Welcome",
          "subheadline": "Get started today",
          "backgroundImage": "bg.jpg",
          "backgroundImageAltText": "Background",
          "mainImage": "main.jpg",
          "mainImageAltText": "Main image",
          "buttonText": "Click here",
          "buttonLink": "/start"
        }
      },
      {
        "type": "CardGrid",
        "content": {
          "title": "Features",
          "subtitle": "What we offer",
          "layout": "grid",
          "cards": [
            {
              "title": "Feature 1",
              "description": "First feature",
              "image": "f1.jpg",
              "image-alt": "Feature 1",
              "icon": "star",
              "link": "/feature1",
              "alt": "Learn more"
            }
          ]
        }
      },
      {
        "type": "CustomBlock",
        "content": {
          "customProperty": "value"
        }
      }
    ]
  },
  "seo": {
    "metaTitle": "Example",
    "metaDescription": "Test",
    "keywords": ["test"],
    "robots": "index, follow",
    "canonicalUrl": "https://example.com/test",
    "alternateUrls": [],
    "openGraph": {
      "og:title": "Example",
      "og:description": "Test",
      "og:type": "website",
      "og:url": "https://example.com",
      "og:image": "image.jpg",
      "og:image:alt": "Image",
      "og:site_name": "Example",
      "og:locale": "en_US"
    },
    "twitterCard": {
      "twitter:card": "summary",
      "twitter:title": "Example",
      "twitter:description": "Test",
      "twitter:image": "image.jpg",
      "twitter:site": "@example",
      "twitter:creator": "@example"
    }
  },
  "isPublished": true,
  "publishedAt": "2025-01-01T00:00:00Z",
  "includeInSitemap": true
}`;

// Deserialize the JSON
const page = PageJsonConverter.fromJson(examplePageJson);

if (page) {
  console.log('? Page deserialized successfully!');
  console.log(`   Page ID: ${page.PageId}`);
  console.log(`   Slug (normalized): ${page.pageSlug}`); // Should be lowercase
  console.log(`   Blocks: ${page.ContentData.ContentBlocks.length}`);
  
  // Demonstrate type-safe block handling
  page.ContentData.ContentBlocks.forEach((block, index) => {
    console.log(`\n?? Block ${index + 1}:`);
    console.log(`   Type: ${block.type}`);
    
    // Use type guards for type-safe access
    if (isBlockOfType(block, 'Hero')) {
      console.log(`   ? Hero Block - Headline: "${block.content.headline}"`);
      console.log(`   ? Button: "${block.content.buttonText}"`);
    } else if (isBlockOfType(block, 'CardGrid')) {
      console.log(`   ? CardGrid - Title: "${block.content.title}"`);
      console.log(`   ? Cards: ${block.content.cards.length}`);
    } else {
      console.log(`   ??  Generic/Unknown block type`);
    }
  });
  
  // Demonstrate slug normalization
  console.log('\n?? Slug Normalization:');
  console.log(`   Original: "Test/Sample-Page"`);
  console.log(`   Normalized: "${page.pageSlug}"`);
  
  // Demonstrate validation
  console.log('\n? Validation:');
  console.log(`   Valid page JSON: ${PageJsonConverter.isValidPageJson(examplePageJson)}`);
  
  // Demonstrate serialization back to JSON
  const jsonOutput = PageJsonConverter.toJson(page, { prettify: false });
  console.log(`\n?? Re-serialization successful: ${jsonOutput.length} characters`);
  
} else {
  console.error('? Failed to deserialize page');
}

// Test with invalid JSON
console.log('\n?? Testing invalid JSON handling:');
const invalidJson = '{"invalid": true}';
const invalidPage = PageJsonConverter.fromJson(invalidJson);
console.log(`   Result: ${invalidPage === null ? '? Correctly returned null' : '? Should have returned null'}`);

// Test slug normalization utility
console.log('\n?? Slug Normalization Utility:');
console.log(`   "HELLO/WORLD" ? "${PageJsonConverter.normalizeSlug('HELLO/WORLD')}"`);
console.log(`   "Test-Page" ? "${PageJsonConverter.normalizeSlug('Test-Page')}"`);
