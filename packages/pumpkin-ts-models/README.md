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

### User Management

```typescript
import { User, UserRole, LoginRequest, LoginResponse, userToUserInfo } from 'pumpkin-ts-models';

// Create a user
const user: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  tenantId: 'tenant-abc',
  email: 'john.doe@example.com',
  username: 'johndoe',
  passwordHash: '$2b$10$...',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.Editor,
  isActive: true,
  createdDate: new Date().toISOString(),
  permissions: ['pages:read', 'pages:write'],
  partitionKey: 'tenant-abc'
};

// Convert to sanitized UserInfo (removes passwordHash)
const userInfo = userToUserInfo(user);

// Handle login
const loginRequest: LoginRequest = {
  email: 'john.doe@example.com',
  password: 'SecurePassword123!'
};

// Role-based access control
if (user.role === UserRole.Editor || user.role === UserRole.TenantAdmin) {
  // User can edit pages
}
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

### Page Slug Normalization

The `pageSlug` field is automatically normalized to ensure proper hyphenation. All slugs are:
- Converted to lowercase
- Spaces, slashes, and backslashes replaced with hyphens
- Consecutive hyphens removed
- Leading/trailing hyphens removed

```typescript
import { PageJsonConverter } from 'pumpkin-ts-models';

// Normalize a slug manually
const slug = PageJsonConverter.normalizeSlug('My Page Title');
// Result: "my-page-title"

// Validate if a slug is properly formatted
const isValid = PageJsonConverter.isValidSlug('my-page-title');
// Result: true

// Slugs are automatically normalized when parsing JSON
const page = PageJsonConverter.fromJson(jsonString);
// page.pageSlug will be properly hyphenated
```

Examples of slug transformations:
- `"My Page Title"` → `"my-page-title"`
- `"about/company/team"` → `"about-company-team"`
- `"contact--us"` → `"contact-us"`
- `"-leading-trailing-"` → `"leading-trailing"`

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