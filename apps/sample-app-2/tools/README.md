# Menu Builder Tool

A standalone HTML tool for visually building menu structures for your Pumpkin CMS theme.

## Quick Start

1. Open `tools/menu-builder.html` in your browser
2. Add menu items using the form
3. Reorder items with ↑/↓ buttons
4. Copy the generated JSON
5. Paste into your theme file under `"menu": []`
6. Rebuild the app

## Features

- ✅ Visual menu builder with drag controls
- ✅ Support for nested menu items (dropdowns)
- ✅ Real-time JSON preview
- ✅ One-click copy to clipboard
- ✅ No dependencies - works offline

## Usage

### Adding Top-Level Menu Items

1. Fill in the form:
   - **Label**: Display text (e.g., "Features")
   - **URL**: Link destination (e.g., "/features")
   - **Target**: `_self` (same window) or `_blank` (new tab)
   - **Order**: Sort order (use increments of 10)
   - **Visible**: Check to show in menu
   - **Parent**: Leave as "Top Level"

2. Click "Add Menu Item"

### Adding Dropdown Items

1. First add a parent item (e.g., "Guides")
2. Then add child items:
   - Fill in label/URL
   - Select the parent from the "Parent" dropdown
   - Click "Add Menu Item"

3. Child items will appear nested under the parent

### Reordering Items

Use the ↑/↓ buttons to change order within the current level.

### Deleting Items

Click "Delete" to remove an item. **Warning**: Deleting a parent also deletes all its children.

### Copying JSON

1. Review the JSON output in the right panel
2. Click "📋 Copy to Clipboard"
3. Paste into your theme file

## Workflow

### 1. Build Your Menu

```
Open menu-builder.html
Add all your menu items
Organize hierarchy
Review JSON output
```

### 2. Update Theme File

```json
// apps/sample-app/src/data/pumpkin-theme.json
{
  "menu": [
    // PASTE JSON HERE
  ]
}
```

### 3. Rebuild App

```bash
cd apps/sample-app
npm run build
# or
npm run dev
```

### 4. Verify

Visit http://localhost:3001 and check:
- Menu items appear in header
- Dropdown menus work
- Links go to correct destinations

## Example Menu Structure

```json
[
  {
    "label": "Home",
    "url": "/",
    "target": "_self",
    "icon": "",
    "order": 10,
    "isVisible": true,
    "children": []
  },
  {
    "label": "Features",
    "url": "/features",
    "target": "_self",
    "icon": "",
    "order": 20,
    "isVisible": true,
    "children": []
  },
  {
    "label": "Guides",
    "url": "#",
    "target": "_self",
    "icon": "",
    "order": 30,
    "isVisible": true,
    "children": [
      {
        "label": "Getting Started",
        "url": "/guides/getting-started",
        "target": "_self",
        "icon": "",
        "order": 1,
        "isVisible": true,
        "children": []
      },
      {
        "label": "API Integration",
        "url": "/guides/api-integration",
        "target": "_self",
        "icon": "",
        "order": 2,
        "isVisible": true,
        "children": []
      }
    ]
  },
  {
    "label": "GitHub",
    "url": "https://github.com/pumpkin-cms/pumpkin",
    "target": "_blank",
    "icon": "",
    "order": 40,
    "isVisible": true,
    "children": []
  }
]
```

## Tips

### Internal Links

Use relative URLs starting with `/`:
- ✅ `/features`
- ✅ `/docs/getting-started`
- ✅ `/guides/api-integration`

### External Links

Use full URLs:
- ✅ `https://github.com/pumpkin-cms`
- ✅ `https://twitter.com/pumpkincms`

### Dropdown Parents

For dropdown triggers, use `#` as the URL:
```json
{
  "label": "Resources",
  "url": "#",
  "children": [ /* ... */ ]
}
```

### Order Values

Use increments of 10 to leave room for insertions:
- Home: 10
- Features: 20
- Guides: 30
- Contact: 40

This way you can add "Pricing" at order 25 without renumbering everything.

### Hide Items Temporarily

Uncheck "Visible" instead of deleting items you might want later.

## Limitations

- No icon picker yet (icons must be added manually to JSON)
- No drag-and-drop reordering (use ↑/↓ buttons)
- Children are limited to one level (no nested dropdowns)

## Future Enhancements

Potential features:
- Icon picker from lucide-react library
- Drag-and-drop reordering
- Import existing menu JSON
- Preview menu rendering
- Export full theme file

## Troubleshooting

### JSON won't copy
- Try copying manually from the preview panel
- Check browser console for errors
- Ensure clipboard permissions are granted

### Menu doesn't appear after rebuild
- Verify JSON is valid (no trailing commas)
- Check Tailwind is scanning `src/data/*.json`
- Clear Next.js cache: `rm -rf .next`

### Links don't work
- Ensure internal links start with `/`
- Check target is `"_self"` or `"_blank"`
- Verify pages exist in the database or as fallback files

## Support

For issues or questions:
- Check [STATIC-THEME-WORKFLOW.md](../STATIC-THEME-WORKFLOW.md)
- Review the Pumpkin CMS documentation
- Open an issue on GitHub
