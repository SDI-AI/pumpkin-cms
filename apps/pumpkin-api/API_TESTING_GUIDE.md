# API Testing Guide - Polymorphic JSON Deserialization Fix

## Issue Fixed

The API was failing to deserialize `Page` objects with `ContentData.ContentBlocks` because `System.Text.Json` cannot deserialize abstract types (`HtmlBlockBase`) by default.

### Error Before Fix
```
System.NotSupportedException: Deserialization of interface or abstract types is not supported. 
Type 'pumpkin_net_models.Models.HtmlBlockBase'. 
Path: $.ContentData.ContentBlocks[0]
```

## Solution Applied

Added `HtmlBlockBaseJsonConverter` to the ASP.NET Core JSON configuration in `Program.cs`:

```csharp
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new HtmlBlockBaseJsonConverter());
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
```

This converter:
1. Reads the `type` property from each block
2. Maps it to the correct concrete type (HeroBlock, CardGridBlock, etc.)
3. Deserializes the JSON to the appropriate type
4. Falls back to `GenericHtmlBlock` for unknown types

## Testing the Fix

### Prerequisites
1. Azure Cosmos DB Emulator running OR Azure Cosmos DB instance configured
2. Valid tenant with API key in the Tenant container
3. API running locally or deployed

### Test 1: Create a New Page (POST)

**Endpoint:** `POST /api/pages/{tenantId}`

**Example using cURL:**
```bash
curl -X POST "http://localhost:5000/api/pages/theia" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @TEST_PAGE_SAMPLE.json
```

**Example using PowerShell:**
```powershell
$apiKey = "YOUR_API_KEY"
$tenantId = "theia"
$body = Get-Content -Path "TEST_PAGE_SAMPLE.json" -Raw

Invoke-RestMethod -Uri "http://localhost:5000/api/pages/$tenantId" `
  -Method Post `
  -Headers @{ "Authorization" = "Bearer $apiKey" } `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:** `201 Created` with the created page object

### Test 2: Get Page by Slug (GET)

**Endpoint:** `GET /api/pages/{tenantId}/{pageSlug}`

**Example:**
```bash
curl -X GET "http://localhost:5000/api/pages/theia/test/sample-page" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/pages/theia/test/sample-page" `
  -Method Get `
  -Headers @{ "Authorization" = "Bearer $apiKey" }
```

**Expected Response:** `200 OK` with the page object including properly deserialized ContentBlocks

### Test 3: Update Page (PUT)

**Endpoint:** `PUT /api/pages/{tenantId}/{pageSlug}`

**Example:**
```bash
# Modify TEST_PAGE_SAMPLE.json and then:
curl -X PUT "http://localhost:5000/api/pages/theia/test/sample-page" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @TEST_PAGE_SAMPLE.json
```

**Expected Response:** `200 OK` with the updated page object

### Test 4: Delete Page (DELETE)

**Endpoint:** `DELETE /api/pages/{tenantId}/{pageSlug}`

**Example:**
```bash
curl -X DELETE "http://localhost:5000/api/pages/theia/test/sample-page" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Expected Response:** `204 No Content`

## Supported Block Types

The converter supports the following block types out of the box:

| Block Type | Class | Description |
|------------|-------|-------------|
| `Hero` | `HeroBlock` | Main hero section |
| `PrimaryCTA` | `PrimaryCtaBlock` | Primary call-to-action |
| `SecondaryCTA` | `SecondaryCtaBlock` | Secondary call-to-action |
| `CardGrid` | `CardGridBlock` | Grid of cards |
| `FAQ` | `FaqBlock` | Frequently asked questions |
| `Breadcrumbs` | `BreadcrumbsBlock` | Navigation breadcrumbs |
| `TrustBar` | `TrustBarBlock` | Trust indicators |
| `HowItWorks` | `HowItWorksBlock` | Step-by-step process |
| `ServiceAreaMap` | `ServiceAreaMapBlock` | Geographic service area |
| `LocalProTips` | `LocalProTipsBlock` | Local tips and advice |
| `Gallery` | `GalleryBlock` | Image gallery |
| `Testimonials` | `TestimonialsBlock` | Customer testimonials |
| `Contact` | `ContactBlock` | Contact form |
| `Blog` | `BlogBlock` | Blog post content |

## Custom Block Types

If you send a block with an unknown `type`, the converter automatically creates a `GenericHtmlBlock`:

```json
{
  "type": "CustomBlock",
  "content": {
    "customProperty": "value"
  }
}
```

This will be deserialized as a `GenericHtmlBlock` with a dictionary of properties.

## Troubleshooting

### Issue: Still getting deserialization errors

**Check:**
1. Verify the JSON structure matches the expected format
2. Ensure all blocks have a `type` property
3. Verify the `content` property exists for each block
4. Check that the API is using the updated `Program.cs` with the converter configuration

### Issue: Unknown block types cause errors

**Solution:** The converter automatically handles unknown types by creating `GenericHtmlBlock` instances. This is expected behavior and should not cause errors.

### Issue: Blocks are null after deserialization

**Check:**
1. Verify the block's `content` structure matches the expected model (e.g., `HeroContent` for Hero blocks)
2. Check for typos in property names (JSON is case-sensitive in property mapping)
3. Review the specific block model to ensure all required properties are provided

## Additional Notes

- The `pageSlug` property is automatically converted to lowercase
- URL-encoded slugs (with `%2F` for `/`) are automatically decoded
- The Cosmos DB serializer also uses the same converters for consistency
- Null values are ignored in serialization (`JsonIgnoreCondition.WhenWritingNull`)

## Verification Commands

### Check if API is running:
```bash
curl http://localhost:5000/
```

**Expected:** `"?? Welcome to Pumpkin CMS v0.1 ??"`

### Verify tenant exists:
Use Azure Portal or Cosmos DB Emulator Data Explorer to query:
```sql
SELECT * FROM c WHERE c.tenantId = 'theia'
```

### Check page was created:
```sql
SELECT * FROM c WHERE c.tenantId = 'theia' AND c.pageSlug = 'test/sample-page'
```

## Success Indicators

? POST endpoint accepts page JSON without deserialization errors
? ContentBlocks are properly typed (not generic objects)
? GET endpoint returns pages with correctly typed blocks
? PUT endpoint can update pages with block modifications
? All block types deserialize to their specific classes

## Files Modified

1. **Program.cs** - Added `HtmlBlockBaseJsonConverter` to HTTP JSON options
2. No changes to models or converters needed (already existed)

## Existing Infrastructure

The fix leverages existing infrastructure:
- `HtmlBlockBaseJsonConverter` (already in `HtmlBlockFactory.cs`)
- `HtmlBlockFactory.CreateBlock()` (handles type resolution)
- `CosmosSystemTextJsonSerializer` (already configured with converters)
