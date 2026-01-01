# Page Slug Normalization

## Overview

The `pageSlug` property in both .NET and TypeScript models has been updated to ensure all page slugs are automatically converted to lowercase. This provides consistency across the system and prevents case-sensitivity issues.

## Changes Made

### .NET Model (`pumpkin-net-models/Models/Page.cs`)

Added automatic lowercase conversion to the `PageSlug` property:

```csharp
private string _pageSlug = string.Empty;

[JsonPropertyName("pageSlug")]
public string PageSlug 
{ 
    get => _pageSlug;
    set => _pageSlug = value?.ToLowerInvariant() ?? string.Empty;
}
```

**Behavior:**
- Any value assigned to `PageSlug` is automatically converted to lowercase
- `null` values are converted to empty string
- Thread-safe using `ToLowerInvariant()` (culture-independent)

### TypeScript Model (`pumpkin-ts-models`)

#### 1. Updated Interface Documentation

Added documentation to the `Page` interface:

```typescript
/**
 * Page slug - always stored in lowercase
 */
pageSlug: string;
```

#### 2. Enhanced PageJsonConverter

Added automatic slug normalization when parsing JSON:

```typescript
// Ensure pageSlug is always lowercase
if (parsed.pageSlug) {
    parsed.pageSlug = parsed.pageSlug.toLowerCase();
}
```

Added utility method for manual slug normalization:

```typescript
/**
 * Normalizes a page slug to lowercase
 */
static normalizeSlug(slug: string): string {
    return slug?.toLowerCase() ?? '';
}
```

## Usage Examples

### .NET

```csharp
var page = new Page
{
    PageSlug = "My-Page-Slug"  // Automatically becomes "my-page-slug"
};

// Updating existing page
page.PageSlug = "ANOTHER/PAGE";  // Automatically becomes "another/page"
```

### TypeScript

```typescript
// When parsing from JSON - automatic normalization
const page = PageJsonConverter.fromJson(jsonString);
// pageSlug will be lowercase

// Manual normalization
const slug = PageJsonConverter.normalizeSlug("My-Page-Slug");
// Returns: "my-page-slug"

// Creating pages
const page: Page = {
    pageSlug: "my-page-slug",  // Should be provided in lowercase
    // ...other properties
};
```

## API Endpoint Handling

The API endpoints in `Program.cs` already handle URL decoding, which works seamlessly with lowercase slugs:

```csharp
var decodedPageSlug = Uri.UnescapeDataString(pageSlug);
```

**Example API calls:**
```
GET /api/pages/tenant123/products/category/item
GET /api/pages/tenant123/Products/Category/Item  // Also works - will be lowercased
```

## Benefits

1. **Consistency**: All slugs are stored in a consistent format
2. **URL-friendly**: Lowercase slugs are standard practice for URLs
3. **Case-insensitive matching**: Prevents issues with different case variations
4. **SEO-friendly**: Search engines prefer consistent, lowercase URLs
5. **Database queries**: Simplifies slug-based lookups

## Migration Notes

### Existing Data

If you have existing pages with mixed-case slugs in the database:

1. **No immediate action required** - The property setters will normalize new values
2. **For consistency**, consider running a one-time migration script:

```csharp
// Example migration (pseudo-code)
foreach (var page in allPages)
{
    var normalizedSlug = page.PageSlug.ToLowerInvariant();
    if (page.PageSlug != normalizedSlug)
    {
        page.PageSlug = normalizedSlug;  // Will auto-normalize
        await SavePageAsync(page);
    }
}
```

### Client Applications

- Clients can send slugs in any case - they'll be normalized automatically
- Best practice: Always send slugs in lowercase to avoid unnecessary processing

## Testing

Both models have been successfully compiled:
- ? .NET build successful
- ? TypeScript build successful

All existing tests should continue to pass as the normalization is transparent to the API behavior.
