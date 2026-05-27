# Static Theme Workflow

Pumpkin CMS Sample App uses a **static theme system** where themes are loaded from JSON files at build time. This ensures all Tailwind CSS classes are properly scanned and included in the production bundle.

## Why Static Themes?

1. **No Purged Classes** - Tailwind scans theme JSON files at build time, ensuring all classes are included
2. **Build-Time Optimization** - Theme is baked into the bundle, no API calls needed
3. **Version Control** - Theme changes tracked in Git alongside code
4. **Predictable Performance** - No runtime theme fetching or parsing

## Theme File Structure

```
apps/sample-app/src/data/
├── pumpkin-theme.json      # Default theme (Pumpkin branded)
├── custom-theme.json       # Your custom theme (optional)
└── fallback-theme.ts       # Loader that imports the JSON
```

## Workflow: Updating Your Theme

### 1. Edit the Theme JSON

Edit `src/data/pumpkin-theme.json` directly:

```json
{
  "header": {
    "logoUrl": "🎃",
    "logoAlt": "Pumpkin CMS",
    "ctaText": "Get Started",
    "ctaUrl": "/docs/getting-started"
  },
  "menu": [
    {
      "label": "Features",
      "url": "/features",
      "target": "_self",
      "icon": "",
      "order": 1,
      "isVisible": true,
      "children": []
    }
  ]
}
```

### 2. Rebuild the App

```bash
cd apps/sample-app
npm run build
# or for dev:
npm run dev
```

Tailwind will scan the JSON file and include all referenced classes.

### 3. Test Locally

Visit `http://localhost:3001` and verify:
- Header/footer render correctly
- Menu items appear in correct order
- Internal links work (relative URLs like `/features`)
- External links open in correct target

## Menu Structure

Each menu item supports:

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Display text |
| `url` | string | Link destination (relative or absolute) |
| `target` | string | `"_self"` or `"_blank"` |
| `icon` | string | Icon name (optional, from lucide-react) |
| `order` | number | Sort order (lower = first) |
| `isVisible` | boolean | Show/hide menu item |
| `children` | array | Sub-menu items (nested) |

### Internal Links

Use relative URLs starting with `/`:

```json
{ "label": "Docs", "url": "/docs", "target": "_self" }
```

### External Links

Use full URLs:

```json
{ "label": "GitHub", "url": "https://github.com/pumpkin-cms", "target": "_blank" }
```

### Dropdown Menus

Add nested items via `children`:

```json
{
  "label": "Guides",
  "url": "#",
  "target": "_self",
  "order": 2,
  "isVisible": true,
  "children": [
    { "label": "Getting Started", "url": "/guides/getting-started", "order": 1, "isVisible": true },
    { "label": "API Integration", "url": "/guides/api-integration", "order": 2, "isVisible": true }
  ]
}
```

## Using a Different Theme File

Set the environment variable:

```env
# .env.local
PUMPKIN_THEME_FILE=my-custom-theme.json
```

Make sure the file exists in `src/data/` and rebuild.

## Best Practices

### 1. Keep Classes in Theme JSON

Store all Tailwind classes in the theme JSON file so they're scanned at build time:

```json
{
  "blockStyles": {
    "Hero": {
      "headline": "text-5xl font-bold text-white"
    }
  }
}
```

### 2. Version Control

Commit theme JSON files to Git:

```bash
git add src/data/pumpkin-theme.json
git commit -m "Update menu structure"
```

### 3. Preview Locally

Always test theme changes locally before deploying:

```bash
npm run dev
# Visit http://localhost:3001
```

### 4. Menu Order

Use increments of 10 for order values (10, 20, 30...) to leave room for insertions:

```json
{ "label": "Home", "order": 10 },
{ "label": "Features", "order": 20 },
{ "label": "Docs", "order": 30 }
```

## Dynamic Pages with Static Theme

Your menu is static, but **pages can be added dynamically**:

- Menu links can point to pages that don't exist yet (they'll 404 until created)
- Add new pages via the Admin UI or API
- Update menu JSON and redeploy when you want to expose them

## Sitemap Generation

The app fetches published pages from the API at runtime for sitemap:

```typescript
// Already implemented in lib/api.ts
const pages = await fetchSitemapData();
// Returns all published pages regardless of menu
```

This means:
- ✅ Menu = static (in theme JSON)
- ✅ Content = dynamic (from API)
- ✅ Sitemap = dynamic (from API)

## Menu Builder Tool

For easier menu editing, see `tools/menu-builder.html` - a standalone HTML tool that:
1. Provides a visual interface for adding/reordering menu items
2. Outputs formatted JSON
3. You copy the JSON into your theme file
4. Rebuild the app

## Future: Hybrid Approach

If you want menu updates without rebuilding:

1. Keep theme in JSON for build-time Tailwind scanning
2. Fetch menu separately at runtime via API
3. Merge API menu with static theme
4. Use ISR with long revalidation (3600s = 1 hour)

For now, static is simpler and more reliable.
