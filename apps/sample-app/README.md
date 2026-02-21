# Pumpkin CMS — Sample App

The open-source sales & demo site for **Pumpkin CMS**. This Next.js 14 app showcases all 14 content block types rendered with the `pumpkin-block-views` component library and a custom Tailwind CSS theme.

## What This Demonstrates

| Capability | How It's Used |
|---|---|
| **All 14 Block Types** | The sample home page includes every block: Hero, Breadcrumbs, TrustBar, CardGrid, HowItWorks, PrimaryCTA, FAQ, Testimonials, Gallery, LocalProTips, ServiceAreaMap, Blog, SecondaryCTA, Contact |
| **SEO / Metadata** | `buildMetadata()` in `lib/metadata.ts` maps the Page's `seo` object → Next.js `Metadata` (OpenGraph, Twitter Card, JSON-LD, canonical, robots) |
| **Tailwind Theming** | `styles/pumpkin-theme.ts` provides branded classNames overrides for all 14 blocks using `pumpkin`, `bark`, and `vine` colour scales |
| **API Integration** | `lib/api.ts` fetches pages from the Pumpkin CMS content API with Bearer auth and ISR caching |
| **Fallback to Sample Data** | When no API key is configured, the app renders the embedded sample page at `data/sample-page.ts` |
| **Dynamic Routing** | `[...slug]/page.tsx` catches all slugs and fetches the corresponding page from the API |

## Quick Start

```bash
# From the monorepo root
cd apps/sample-app

# Install dependencies
npm install

# Run in development mode (port 3001)
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to see all 14 content blocks in action.

## Connect to the Pumpkin CMS API

1. Copy `.env.example` → `.env`
2. Set your values:

```env
NEXT_PUBLIC_API_URL=https://localhost:7211
PUMPKIN_API_KEY=your-api-key-here
PUMPKIN_TENANT_ID=your-tenant-id-here
```

3. Restart the dev server — the app will now fetch live content from the API.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with header, footer, and Inter font
│   ├── page.tsx            # Home page — fetchPage('home') || sampleHomePage
│   ├── [...slug]/page.tsx  # Dynamic catch-all route for any page slug
│   ├── not-found.tsx       # Custom 404 page
│   └── globals.css         # Tailwind base + prose overrides
├── components/
│   ├── PageRenderer.tsx    # Renders all blocks via BlockViewRenderer
│   └── StructuredData.tsx  # JSON-LD structured data component
├── data/
│   └── sample-page.ts     # Embedded sample Page with all 14 blocks
├── lib/
│   ├── api.ts              # Pumpkin CMS API client (fetch + ISR)
│   └── metadata.ts         # Page.seo → Next.js Metadata mapper
└── styles/
    └── pumpkin-theme.ts    # Branded Tailwind classNames for all 14 blocks
```

## Customising the Theme

The `pumpkin-theme.ts` file exports a `BlockClassNamesMap` object with Tailwind class overrides for every style slot of every block type. The strategy is **full replace** — each key you provide completely replaces the default class string for that slot.

```tsx
// Example: Override just the Hero headline
import { pumpkinTheme } from '@/styles/pumpkin-theme';

const myTheme = {
  ...pumpkinTheme,
  Hero: {
    ...pumpkinTheme.Hero,
    headline: 'text-6xl font-black text-blue-900',
  },
};
```

See the `pumpkin-block-views` package README for the full list of slot keys per block type.

## Tailwind Config

The custom colour scales defined in `tailwind.config.js`:

- **`pumpkin`** (50–900) — Warm orange tones for primary brand elements
- **`bark`** (50–900) — Earthy brown tones for secondary elements
- **`vine`** (50–900) — Green tones for accent/success states

Custom gradients: `bg-gradient-pumpkin`, `bg-gradient-hero`, `bg-gradient-dark`

## Dependencies

| Package | Purpose |
|---|---|
| `next` | App framework (v14, App Router) |
| `react` / `react-dom` | React 18 |
| `pumpkin-ts-models` | TypeScript interfaces for Page, all block types |
| `pumpkin-block-views` | React view components + BlockViewRenderer factory |
| `tailwindcss` | Utility-first CSS |
