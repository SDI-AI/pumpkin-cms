# 🎃 Pumpkin CMS

A modern, headless CMS built with .NET 9.0 and Azure Cosmos DB, designed for multi-tenant content management with flexible HTML block-based pages.

## Overview

Pumpkin CMS is a lightweight, API-first content management system that provides:

- **Multi-tenant architecture** with API key authentication
- **Flexible content modeling** using composable HTML blocks
- **Azure Cosmos DB** for global distribution and low-latency access
- **TypeScript & .NET models** for type-safe development across the stack
- **RESTful API** for seamless integration with any frontend

## Architecture

```
pumpkin-cms/
├── apps/
│   ├── pumpkin-api/          # .NET 9.0 Web API
│   └── pumpkin-net-models/   # Shared .NET models library
├── packages/
│   └── pumpkin-ts-models/    # TypeScript models (NPM package)
└── docs/                     # Documentation
```

## Features

### Content Management
- **Page-based content** with metadata, SEO, and search optimization
- **15+ HTML block types**: Hero, CTA, Card Grid, FAQ, Breadcrumbs, Gallery, Testimonials, and more
- **Version control** with automatic version incrementing
- **Publishing workflow** with `isPublished` status and `publishedAt` timestamps

### Security & Multi-tenancy
- **API key authentication** using BCrypt hashing
- **Tenant isolation** at the database level
- **Active tenant validation** for all operations

### Developer Experience
- **Strongly-typed models** in both .NET and TypeScript
- **JSON serialization** utilities with validation
- **Comprehensive error handling** and logging
- **RU cost tracking** for Cosmos DB operations

## HTML Block Types

Pumpkin CMS supports a rich set of composable content blocks:

- **Hero Blocks**: Main, Secondary, Tertiary variants
- **CTA Blocks**: Primary, Secondary, Banner, Inline variants
- **Content Blocks**: Card Grid, FAQ, Rich Text
- **Navigation**: Breadcrumbs, Tabs
- **Interactive**: Accordion, Gallery, Testimonials, Contact Forms
- **Engagement**: Trust Bar, Countdown Timer, Progress Tracker
- **Media**: Video Embed, Image with Caption

## API Endpoints

### Pages
- `GET /api/pages/{tenantId}/{pageSlug}` - Get published page by slug
- `POST /api/pages/{tenantId}` - Create a new page
- `PUT /api/pages/{tenantId}/{pageId}` - Update an existing page

All endpoints require Bearer token authentication via the `Authorization` header.

## Getting Started

### Prerequisites
- .NET 9.0 SDK
- Node.js 18+ (for TypeScript models)
- Azure Cosmos DB account or local emulator

### Configuration

1. Update `appsettings.json` with your Cosmos DB settings:

```json
{
  "CosmosDb": {
    "AccountEndpoint": "https://your-account.documents.azure.com:443/",
    "AccountKey": "your-key-here",
    "DatabaseName": "PumpkinCMS"
  }
}
```

2. Ensure the following containers exist in your database:
   - `Tenant` (partition key: `/tenantId`)
   - `Pages` (partition key: `/tenantId`)

### Running the API

```bash
cd apps/pumpkin-api
dotnet run
```

The API will be available at `https://localhost:5001` (or the port specified in `launchSettings.json`).

### Building TypeScript Models

```bash
cd packages/pumpkin-ts-models
npm install
npm run build
```

## Development

### .NET Models
The `pumpkin-net-models` library contains all data models and is referenced by the API project. Models include:

- `Page` - Main page entity with metadata, SEO, and content blocks
- `IHtmlBlock` - Interface for all HTML block types
- Individual block implementations (e.g., `HeroBlock`, `CtaBlock`)
- `PageJsonConverter` - Utilities for JSON serialization

### TypeScript Models
The `pumpkin-ts-models` package provides TypeScript equivalents of all .NET models for frontend integration. Install via:

```bash
npm install ./packages/pumpkin-ts-models
```

## Data Modeling Best Practices

- **Partition key**: All pages use `tenantId` as the partition key for tenant isolation
- **Hierarchical keys**: Consider using hierarchical partition keys for large tenants
- **Embedding vs. referencing**: HTML blocks are embedded within pages for atomic reads
- **Version tracking**: Each update increments `PageVersion` for audit trails

## Roadmap

See the [Admin UI Roadmap](apps/admin/README.md) for upcoming features including:

- Next.js-based admin interface
- Visual block editor
- Media management
- Role-based access control
- Analytics and insights

## License

Copyright © 2025 Innov8now

## Support

For issues and questions, please open an issue on the GitHub repository.
