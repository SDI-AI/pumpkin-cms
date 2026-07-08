# Compiled Theme Packages

Pumpkin themes can be installed at runtime when the theme package already contains compiled CSS. The running site does not compile Tailwind; it only loads the stylesheet URL stored on the tenant theme document.

## Theme Document

Compiled assets live under `theme.compiledAssets`:

```json
{
  "themeId": "modern-clean",
  "tenantId": "tenant-a",
  "compiledAssets": {
    "mode": "compiled",
    "cssUrl": "https://cdn.example.com/pumpkin-themes/tenants/tenant-a/themes/modern-clean/1/theme.css",
    "cssIntegrity": "sha256-...",
    "assetsBaseUrl": "https://cdn.example.com/pumpkin-themes/tenants/tenant-a/themes/modern-clean/1/assets/",
    "manifestUrl": "https://cdn.example.com/pumpkin-themes/tenants/tenant-a/themes/modern-clean/1/theme-manifest.json",
    "packageUrl": "https://cdn.example.com/pumpkin-themes/tenants/tenant-a/themes/modern-clean/1/theme-package.zip",
    "compiledAt": "2026-07-07T00:00:00Z",
    "compiler": "pumpkin-theme-compiler@1.0.0",
    "contentHash": "..."
  }
}
```

If `compiledAssets.cssUrl` is present, the starter app loads it before falling back to local `/themes/{themeId}.css`.

## Package Layout

```text
theme-package.zip
  theme.json
  theme.css
  theme-manifest.json
  assets/
    fonts/
    images/
```

`theme.css` should be the optimized output from the theme build. Tailwind classes that the theme needs must already be present in that file; the deployed app will not regenerate them.

## Blob Layout

The API is provisioned for tenant-scoped Azure Blob storage with this default path template:

```text
tenants/{tenantId}/themes/{themeId}/{version}
```

For example:

```text
tenants/tenant-a/themes/modern-clean/1/theme.css
tenants/tenant-a/themes/modern-clean/1/theme-manifest.json
tenants/tenant-a/themes/modern-clean/1/theme-package.zip
tenants/tenant-a/themes/modern-clean/1/assets/logo.svg
```

The tenant theme document stores public/CDN URLs, not storage credentials. Azure configuration belongs in the API `AssetStorage` section.

## API Storage Target

The admin API can install a compiled theme package:

```http
POST /api/admin/themes/{tenantId}/install
Content-Type: multipart/form-data

package=<theme-package.zip>
```

The installer validates `theme.json` and `theme.css`, uploads the CSS/assets/package to Blob Storage, computes a CSS hash and subresource integrity value, then creates or updates the tenant theme document with `compiledAssets`.

The admin API can also return the safe target paths for external install flows:

```http
GET /api/admin/themes/{tenantId}/{themeId}/storage-target?version=1
```

The response includes blob paths plus public URLs derived from `AssetStorage:AzureBlob:PublicBaseUrl` or `AssetStorage:AzureBlob:ThemesPublicBaseUrl`. It does not include connection strings or managed identity details.

## Media Storage

Media files use the same storage account with a separate container:

```text
pumpkin-media/
  tenants/{tenantId}/media/{yyyy}/{mm}/{assetId}-{fileName}
```

The admin API can return a media target path for upload flows:

```http
GET /api/admin/media/{tenantId}/storage-target?fileName=hero.jpg
```

Blob Storage holds the file bytes. Cosmos DB should hold media metadata later, such as tenant ID, blob path, public URL, content type, size, alt text, dimensions, folders, tags, and audit fields.
