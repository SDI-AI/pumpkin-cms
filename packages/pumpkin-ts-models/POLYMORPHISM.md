# TypeScript Polymorphic HTML Block Handling

## Overview

The TypeScript `PageJsonConverter` now includes a factory pattern for handling polymorphic HTML blocks, similar to the .NET `HtmlBlockBaseJsonConverter`.

## What Was Added

### 1. Enhanced `processHtmlBlock()` Method

```typescript
private static processHtmlBlock(block: any): IHtmlBlock {
  if (!isHtmlBlock(block)) {
    console.warn('Invalid block structure:', block);
    return createGenericBlock('Unknown', {});
  }

  // Type discrimination based on block type
  switch (block.type) {
    case 'Hero':
    case 'PrimaryCTA':
    case 'SecondaryCTA':
    case 'CardGrid':
    case 'FAQ':
    case 'Breadcrumbs':
    case 'TrustBar':
    case 'HowItWorks':
    case 'ServiceAreaMap':
    case 'LocalProTips':
    case 'Gallery':
    case 'Testimonials':
    case 'Contact':
    case 'Blog':
      return this.validateBlockContent(block);
    
    default:
      console.warn(`Unknown block type: ${block.type}`);
      return createGenericBlock(block.type, block.content);
  }
}
```

### 2. Content Validation Method

```typescript
private static validateBlockContent(block: any): IHtmlBlock {
  if (!block.content || typeof block.content !== 'object') {
    console.warn(`Invalid content for block type ${block.type}:`, block.content);
    return createGenericBlock(block.type, {});
  }

  return {
    type: block.type,
    content: block.content
  } as IHtmlBlock;
}
```

## Features

### ? Type Discrimination

- Recognizes 14 known block types
- Falls back to `GenericBlock` for unknown types
- Validates block structure before processing

### ? Content Validation

- Ensures `content` property exists and is an object
- Logs warnings for invalid content
- Creates safe fallback for malformed blocks

### ? Type Safety with Type Guards

Use the provided type guards for compile-time type safety:

```typescript
import { PageJsonConverter, isBlockOfType } from 'pumpkin-ts-models';

const page = PageJsonConverter.fromJson(jsonString);

page?.ContentData.ContentBlocks.forEach(block => {
  if (isBlockOfType(block, 'Hero')) {
    // TypeScript knows this is a HeroBlock
    console.log(block.content.headline);      // ? Type-safe
    console.log(block.content.buttonText);    // ? Type-safe
  } else if (isBlockOfType(block, 'CardGrid')) {
    // TypeScript knows this is a CardGridBlock
    console.log(block.content.title);         // ? Type-safe
    console.log(block.content.cards.length);  // ? Type-safe
  }
});
```

## Supported Block Types

| Block Type | Class/Interface | Status |
|------------|----------------|--------|
| `Hero` | `HeroBlock` | ? Supported |
| `PrimaryCTA` | `PrimaryCtaBlock` | ? Supported |
| `SecondaryCTA` | `SecondaryCtaBlock` | ? Supported |
| `CardGrid` | `CardGridBlock` | ? Supported |
| `FAQ` | `FaqBlock` | ? Supported |
| `Breadcrumbs` | `BreadcrumbsBlock` | ? Supported |
| `TrustBar` | `TrustBarBlock` | ? Supported |
| `HowItWorks` | `HowItWorksBlock` | ? Supported |
| `ServiceAreaMap` | `ServiceAreaMapBlock` | ? Supported |
| `LocalProTips` | `LocalProTipsBlock` | ? Supported |
| `Gallery` | `GalleryBlock` | ? Supported |
| `Testimonials` | `TestimonialsBlock` | ? Supported |
| `Contact` | `ContactBlock` | ? Supported |
| `Blog` | `BlogBlock` | ? Supported |
| Unknown types | `GenericHtmlBlock` | ? Fallback |

## Usage Examples

### Basic Deserialization

```typescript
import { PageJsonConverter } from 'pumpkin-ts-models';

const jsonFromApi = `{ ... }`;
const page = PageJsonConverter.fromJson(jsonFromApi);

if (page) {
  console.log(`Page: ${page.PageId}`);
  console.log(`Slug: ${page.pageSlug}`); // Automatically lowercase
  console.log(`Blocks: ${page.ContentData.ContentBlocks.length}`);
}
```

### Type-Safe Block Access

```typescript
import { PageJsonConverter, isBlockOfType } from 'pumpkin-ts-models';

const page = PageJsonConverter.fromJson(jsonString);

// Type-safe iteration
page?.ContentData.ContentBlocks.forEach(block => {
  switch (block.type) {
    case 'Hero':
      if (isBlockOfType(block, 'Hero')) {
        // Full IntelliSense for HeroContent
        const { headline, subheadline, buttonText } = block.content;
        console.log(`Hero: ${headline} - ${buttonText}`);
      }
      break;
      
    case 'CardGrid':
      if (isBlockOfType(block, 'CardGrid')) {
        // Full IntelliSense for CardGridContent
        console.log(`Cards: ${block.content.cards.length}`);
        block.content.cards.forEach(card => {
          console.log(`  - ${card.title}: ${card.description}`);
        });
      }
      break;
  }
});
```

### Handling Unknown Blocks

```typescript
const page = PageJsonConverter.fromJson(jsonString);

page?.ContentData.ContentBlocks.forEach(block => {
  const knownTypes = ['Hero', 'CardGrid', 'FAQ', 'Contact'];
  
  if (knownTypes.includes(block.type)) {
    console.log(`? Known block: ${block.type}`);
  } else {
    // Unknown block - safely handled as GenericHtmlBlock
    console.log(`??  Unknown block: ${block.type}`);
    console.log(`   Content:`, block.content);
  }
});
```

### Validation Before Processing

```typescript
import { PageJsonConverter } from 'pumpkin-ts-models';

// Validate JSON before parsing
if (PageJsonConverter.isValidPageJson(jsonString)) {
  const page = PageJsonConverter.fromJson(jsonString);
  // Safe to use page
} else {
  console.error('Invalid page JSON structure');
}
```

## Error Handling

The converter provides graceful error handling:

### Invalid Block Structure

```typescript
// Input: Block missing 'content' property
{
  "type": "Hero"
  // No content property
}

// Result: Creates GenericBlock with empty content + console warning
console.warn('Invalid content for block type Hero: undefined');
```

### Unknown Block Type

```typescript
// Input: Custom/unknown block type
{
  "type": "CustomWidget",
  "content": { "foo": "bar" }
}

// Result: Creates GenericBlock + console warning
console.warn('Unknown block type: CustomWidget');
```

### Malformed JSON

```typescript
const page = PageJsonConverter.fromJson('invalid json');
// Returns: null
// Logs: 'Failed to parse JSON: ...'
```

## Comparison: .NET vs TypeScript

| Feature | .NET (C#) | TypeScript |
|---------|-----------|------------|
| **Type Discrimination** | ? Via `HtmlBlockBaseJsonConverter` | ? Via `processHtmlBlock()` |
| **Known Types** | ? 14 types | ? 14 types |
| **Unknown Types** | ? `GenericHtmlBlock` | ? `GenericHtmlBlock` |
| **Content Validation** | ? Automatic | ? Manual via `validateBlockContent()` |
| **Type Safety** | ? Strong (concrete classes) | ? Strong (with type guards) |
| **IntelliSense** | ? Full support | ? Full support (with guards) |
| **Runtime Validation** | ? Built-in | ? Custom validation |
| **Error Handling** | ? Exceptions | ? Warnings + fallback |

## Best Practices

### 1. Always Use Type Guards

```typescript
// ? Bad - No type safety
const block = blocks[0];
console.log(block.content.headline); // Error if not Hero

// ? Good - Type-safe
if (isBlockOfType(block, 'Hero')) {
  console.log(block.content.headline); // Safe!
}
```

### 2. Handle Unknown Types

```typescript
// ? Good - Defensive programming
blocks.forEach(block => {
  if (isBlockOfType(block, 'Hero')) {
    // Handle Hero
  } else if (isBlockOfType(block, 'CardGrid')) {
    // Handle CardGrid
  } else {
    // Handle unknown
    console.log(`Unsupported block: ${block.type}`);
  }
});
```

### 3. Validate Before Processing

```typescript
// ? Good - Validate first
if (!PageJsonConverter.isValidPageJson(json)) {
  throw new Error('Invalid page JSON');
}

const page = PageJsonConverter.fromJson(json);
```

## Migration Guide

### Before (No Polymorphism)

```typescript
const page = PageJsonConverter.fromJson(json);
// Blocks were just generic IHtmlBlock with no validation
```

### After (With Polymorphism)

```typescript
const page = PageJsonConverter.fromJson(json);
// Blocks are now validated and typed
// - Known types are recognized
// - Unknown types create GenericBlock
// - Invalid structures log warnings
```

No breaking changes - your existing code will continue to work, but now has better validation and error handling!

## Testing

Run the polymorphism demo:

```bash
cd packages/pumpkin-ts-models
npm run build
ts-node examples/polymorphism-demo.ts
```

Expected output:
```
? Page deserialized successfully!
   Page ID: example-123
   Slug (normalized): test/sample-page
   Blocks: 3

?? Block 1:
   Type: Hero
   ? Hero Block - Headline: "Welcome"
   ? Button: "Click here"

?? Block 2:
   Type: CardGrid
   ? CardGrid - Title: "Features"
   ? Cards: 1

?? Block 3:
   Type: CustomBlock
   ??  Generic/Unknown block type
```

## Summary

? **TypeScript now handles polymorphic HTML blocks similar to .NET**
? **14 known block types recognized and validated**
? **Unknown types safely fall back to GenericBlock**
? **Type guards provide compile-time type safety**
? **Automatic slug normalization to lowercase**
? **Graceful error handling with console warnings**

The TypeScript serialization is now feature-complete and matches the .NET implementation! ??
