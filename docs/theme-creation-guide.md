# Pumpkin Theme Creation Guide

This guide covers creating an installable Pumpkin theme package from scratch. A Pumpkin theme package is a portable folder or ZIP that contains a theme document, compiled CSS, a manifest, and optional assets.

The starter app does not compile theme CSS at runtime. Ship production-ready CSS in the package.

## Package Shape

Create a folder under `theme-packages/`:

```text
theme-packages/
  my-theme/
    theme.json
    theme.css
    theme-manifest.json
    assets/
      fonts/
      images/
```

The ZIP root must contain these files directly. Do not wrap them in an extra parent folder.

```text
my-theme.zip
  theme.json
  theme.css
  theme-manifest.json
  assets/
```

## Theme Document

`theme.json` defines the theme identity, header/footer settings, design tokens, block style slots, navigation, and compiled asset metadata.

Start with one of the built-in packages:

- `theme-packages/pumpkin-default`
- `theme-packages/pumpkin-evergreen`

Minimum identity fields:

```json
{
  "themeId": "my-theme",
  "tenantId": "",
  "name": "My Theme",
  "label": "My Theme",
  "description": "A short editor-facing description.",
  "category": "custom",
  "isActive": false,
  "isSystem": false,
  "isCustom": true,
  "version": 1
}
```

Rules:

- Use a stable lowercase `themeId`, usually kebab case.
- Leave `tenantId` empty for reusable packages; the installer binds it to the destination tenant.
- Increment `version` for meaningful package revisions.
- Keep `isActive` false in package source unless intentionally creating a default seed theme.
- Do not store secrets, API keys, private file paths, or unpublished customer data in `theme.json`.

## CSS

`theme.css` is the public stylesheet loaded by the starter app when `theme.compiledAssets.cssUrl` is available.

Rules:

- Write complete CSS. Do not rely on runtime Tailwind compilation.
- Scope selectors to Pumpkin classes, theme classes, or block attributes.
- Avoid global element resets that can leak into embedded widgets or admin surfaces.
- Include hover, focus, active, disabled, and validation states for controls.
- Support responsive breakpoints and long content.
- Respect `prefers-reduced-motion` for animations and scroll effects.
- Use accessible contrast for body text, buttons, navigation, and form fields.

Good selector patterns:

```css
.pk-theme-my-theme .pk-hero-title {
  font-family: var(--font-heading);
}

[data-style-key="fiery-menu"] .pk-menu-card {
  border-color: var(--color-accent);
}
```

Avoid:

```css
body {
  overflow: hidden;
}

section:nth-child(3) {
  margin-top: -120px;
}
```

## Assets

Put package-owned assets under `assets/`.

Supported theme asset types:

```text
.png
.jpg
.jpeg
.gif
.webp
.avif
.woff
.woff2
.ttf
.otf
```

Use relative references from `theme.css`:

```css
@font-face {
  font-family: "Display";
  src: url("./assets/fonts/display.woff2") format("woff2");
}

.pk-hero {
  background-image: url("./assets/images/hero.webp");
}
```

The installer uploads assets to tenant asset storage and rewrites the theme document with public URLs. Content and CSS should treat returned URLs as provider-owned.

## Manifest

`theme-manifest.json` describes the package for humans and tooling.

Example:

```json
{
  "packageId": "my-theme",
  "themeId": "my-theme",
  "name": "My Theme",
  "version": "1.0.0",
  "css": "theme.css",
  "assets": [
    "assets/images/hero.webp",
    "assets/fonts/display.woff2"
  ],
  "createdAt": "2026-08-18T00:00:00Z",
  "compiler": "manual"
}
```

Rules:

- Keep `packageId`, `themeId`, folder name, and ZIP name aligned.
- List every packaged asset with a relative path.
- Use ISO 8601 UTC timestamps.
- Do not include credentials or machine-local paths.

## Header And Footer

Theme header/footer configuration lives in `theme.json`.

Use these for:

- Logo image URL or text fallback
- Navigation links and dropdowns
- Header CTA
- Optional announcement banner
- Footer brand description, columns, copyright, and built-with text

Keep navigation concise and use real public routes. External URLs should use HTTPS.

## Block Slots

`blockStyles` maps block types to renderer slot class strings.

Example:

```json
{
  "blockStyles": {
    "Hero": {
      "root": "pk-theme-my-theme pk-hero",
      "headline": "pk-hero-title",
      "button": "pk-button pk-button-primary"
    },
    "CardGrid": {
      "root": "pk-section pk-card-grid",
      "card": "pk-card",
      "cardTitle": "pk-card-title"
    }
  }
}
```

Only slots exposed by `pumpkin-block-views` have an effect. Check the current rules file before adding or renaming slots.

## Scroll Effects

Scroll effects belong in CSS, not page JSON.

Safe options:

- CSS transitions on already-rendered elements
- `@media (prefers-reduced-motion: reduce)` fallbacks
- subtle sticky headers
- scroll-margin for anchored sections
- progressive enhancement that does not hide content when JavaScript is unavailable

Avoid effects that make content unreachable, overlap sections, or depend on fixed viewport heights.

Example:

```css
.pk-theme-my-theme [data-style-key="reveal"] {
  animation: pk-fade-up 700ms ease both;
  animation-timeline: view();
  animation-range: entry 10% cover 30%;
}

@media (prefers-reduced-motion: reduce) {
  .pk-theme-my-theme [data-style-key="reveal"] {
    animation: none;
  }
}

@keyframes pk-fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Build The ZIP

From the repository root:

```powershell
Compress-Archive -Path theme-packages\my-theme\* -DestinationPath .tmp\my-theme.zip -Force
```

Inspect the ZIP before installing. The root should contain `theme.json`, `theme.css`, `theme-manifest.json`, and `assets/`.

## Install And Activate

Use the starter admin theme installer, or call the API:

```http
POST /api/admin/themes/{tenantId}/install
Content-Type: multipart/form-data

package=<my-theme.zip>
```

The installer:

- validates the package
- uploads CSS, assets, manifest, and package archive
- computes CSS hash and integrity metadata
- creates or updates the tenant theme document
- stores public URLs under `compiledAssets`

Activate the theme only after previewing it.

## Verify

Before shipping:

- Open pages using every supported block type the theme styles.
- Check desktop, tablet, and mobile widths.
- Check long navigation labels and nested dropdowns.
- Check forms, focus states, validation states, and disabled buttons.
- Confirm images and fonts load from public URLs.
- Confirm `theme.css` loads without console errors.
- Confirm reduced-motion behavior.
- Confirm contrast for text and controls.
- Confirm no secrets, local paths, or draft/private assets are in the package.

## Related Docs

- `docs/compiled-theme-packages.md`
- `theme-packages/README.md`
- `sites/PUMPKIN-CONTENT-AND-THEME-RULES.md`
