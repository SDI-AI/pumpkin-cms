# Pumpkin .NET Models

This is a shared class library containing Page models and HTML block system for the Pumpkin CMS ecosystem.

## Overview

The Page model represents a complete page structure including metadata, SEO information, search data, and content blocks. Content blocks implement the `IHtmlBlock` interface and represent different types of content sections.

## Project Structure

This library is located at `apps/pumpkin-net-models/` and can be referenced by other .NET projects in the Pumpkin CMS ecosystem.

## Page Model Structure

```csharp
Page
├── PageId (string)
├── FullSlug (string)  
├── PageVersion (int)
├── Layout (string)
├── MetaData (PageMetaData)
├── SearchData (SearchData)
├── ContentData (ContentData)
└── Seo (SeoData)
```

### Key Components

- **PageMetaData**: Contains basic page information like title, description, author, creation/update dates
- **SearchData**: SEO-focused data including tags, content summary, and block types
- **ContentData**: Contains the list of HTML blocks that make up the page content
- **SeoData**: Complete SEO metadata including Open Graph and Twitter Card data

## HTML Block System

Each HTML block type is defined in its own dedicated file for better organization and maintainability.

### File Structure

```
pumpkin-net-models/
├── PageJsonConverter.cs           // JSON conversion utilities
├── PageJsonExamples.cs            // Usage examples
├── Models/
│   ├── IHtmlBlock.cs              // Interface definition
│   ├── HtmlBlockBase.cs           // Base class and GenericHtmlBlock
│   ├── HtmlBlockFactory.cs        // Factory and JSON converter
│   ├── Page.cs                    // Page model and related classes
├── BreadcrumbsBlock.cs        // Breadcrumbs block
├── CardGridBlock.cs           // Card grid block
├── ContactBlock.cs            // Contact block
├── FaqBlock.cs                // FAQ block
├── GalleryBlock.cs            // Gallery block
├── HeroBlock.cs               // Hero block
├── HeroSecondaryBlock.cs      // Secondary hero block
├── HeroTertiaryBlock.cs       // Tertiary hero block
├── HowItWorksBlock.cs         // How it works block
├── LocalProTipsBlock.cs       // Local pro tips block
├── PrimaryCtaBlock.cs         // Primary CTA block
├── SecondaryCtaBlock.cs       // Secondary CTA block
├── ServiceAreaMapBlock.cs     // Service area map block
├── TestimonialsBlock.cs       // Testimonials block
└── TrustBarBlock.cs           // Trust bar block
```

### Supported Block Types

| Block Type | Description | Content Type | File |
|------------|-------------|-------------|------|
| `Hero` | Main hero section | `HeroContent` | `HeroBlock.cs` |
| `HeroSecondary` | Secondary hero section | `HeroSecondaryContent` | `HeroSecondaryBlock.cs` |
| `HeroTertiary` | Tertiary hero section | `HeroTertiaryContent` | `HeroTertiaryBlock.cs` |
| `PrimaryCTA` | Primary call-to-action | `PrimaryCtaContent` | `PrimaryCtaBlock.cs` |
| `SecondaryCTA` | Secondary call-to-action | `SecondaryCtaContent` | `SecondaryCtaBlock.cs` |
| `CardGrid` | Grid of cards | `CardGridContent` | `CardGridBlock.cs` |
| `FAQ` | Frequently asked questions | `FaqContent` | `FaqBlock.cs` |
| `Breadcrumbs` | Navigation breadcrumbs | `BreadcrumbsContent` | `BreadcrumbsBlock.cs` |
| `TrustBar` | Trust indicators bar | `TrustBarContent` | `TrustBarBlock.cs` |
| `HowItWorks` | Step-by-step process | `HowItWorksContent` | `HowItWorksBlock.cs` |
| `ServiceAreaMap` | Geographic service area | `ServiceAreaMapContent` | `ServiceAreaMapBlock.cs` |
| `LocalProTips` | Local tips and advice | `LocalProTipsContent` | `LocalProTipsBlock.cs` |
| `Gallery` | Image gallery | `GalleryContent` | `GalleryBlock.cs` |
| `Testimonials` | Customer testimonials | `TestimonialsContent` | `TestimonialsBlock.cs` |
| `Contact` | Contact form and info | `ContactContent` | `ContactBlock.cs` |

## JSON Conversion

### PageJsonConverter

The `PageJsonConverter` class provides utilities for converting between JSON and Page objects:

```csharp
using pumpkin_net_models;
using pumpkin_net_models.Models;

// Convert JSON string to Page object
var page = PageJsonConverter.FromJson(jsonString);

// Convert Page object to JSON string  
var json = PageJsonConverter.ToJson(page);

// Load page from JSON file
var page = await PageJsonConverter.FromJsonFileAsync("page.json");

// Save page to JSON file
await PageJsonConverter.ToJsonFileAsync(page, "output.json");

// Validate JSON format
bool isValid = PageJsonConverter.IsValidPageJson(jsonString);
```

### Usage Examples

#### Creating a Page with HTML Blocks

```csharp
var page = new Page
{
    PageId = "example-page",
    FullSlug = "example/page",
    PageVersion = 1,
    Layout = "default",
    MetaData = new PageMetaData
    {
        Title = "Example Page",
        Description = "This is an example page",
        Author = "Content Team"
    },
    ContentData = new ContentData
    {
        ContentBlocks = new List<IHtmlBlock>
        {
            new HeroBlock
            {
                Content = new HeroContent
                {
                    Headline = "Welcome to Our Site",
                    Subheadline = "We're glad you're here",
                    ButtonText = "Get Started",
                    ButtonLink = "/get-started"
                }
            },
            new CardGridBlock
            {
                Content = new CardGridContent
                {
                    Title = "Our Features",
                    Cards = new List<Card>
                    {
                        new Card
                        {
                            Title = "Feature 1",
                            Description = "Description of feature 1",
                            Icon = "star"
                        }
                    }
                }
            }
        }
    }
};
```

#### Converting JSON to Page Objects

```csharp
// Load from sample JSON files
var page = await PageJsonConverter.FromJsonFileAsync("DataSample/page.json");

// Convert JSON string directly
string jsonString = """
{
    "PageId": "example",
    "ContentData": {
        "ContentBlocks": [
            {
                "type": "Hero",
                "content": {
                    "headline": "Welcome",
                    "subheadline": "Get started today"
                }
            }
        ]
    }
}
""";

var page = PageJsonConverter.FromJson(jsonString);

// Validate before converting
if (PageJsonConverter.IsValidPageJson(jsonString))
{
    var validPage = PageJsonConverter.FromJson(jsonString);
}
```

#### Using the HTML Block Factory

```csharp
// Create blocks from JSON
string jsonBlock = @"{
    ""type"": ""Hero"",
    ""content"": {
        ""headline"": ""Welcome"",
        ""subheadline"": ""Get started today""
    }
}";

var block = HtmlBlockFactory.CreateBlock(jsonBlock);

// Get supported block types
var supportedTypes = HtmlBlockFactory.GetSupportedBlockTypes();
```

### Custom JSON Serialization

For proper JSON serialization of the `IHtmlBlock` interface, use the provided converter:

```csharp
var options = new JsonSerializerOptions
{
    Converters = { new HtmlBlockJsonConverter() },
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
};

// Serialize page to JSON
var json = JsonSerializer.Serialize(page, options);

// Deserialize page from JSON
var deserializedPage = JsonSerializer.Deserialize<Page>(json, options);
```

## Extending the System

### Adding New Block Types

1. Create a new file in the Models folder (e.g., `CustomBlock.cs`)
2. Create a new block class inheriting from `HtmlBlockBase`
3. Create a corresponding content class with the block's properties
4. Add the mapping to `HtmlBlockFactory.BlockTypeMap`

Example (`CustomBlock.cs`):

```csharp
using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

public class CustomBlock : HtmlBlockBase
{
    public override string Type { get; set; } = "Custom";
    
    [JsonPropertyName("content")]
    public override object Content { get; set; } = new CustomContent();
}

public class CustomContent
{
    [JsonPropertyName("customProperty")]
    public string CustomProperty { get; set; } = string.Empty;
}
```

Then add to the factory in `HtmlBlockFactory.cs`:

```csharp
{ "Custom", typeof(CustomBlock) }
```

## JSON Structure Examples

### Complete Page JSON Structure

```json
{
  "PageId": "example-page",
  "fullSlug": "example/page",
  "PageVersion": 1,
  "Layout": "default",
  "MetaData": {
    "title": "Example Page",
    "description": "Page description",
    "author": "Author Name",
    "createdAt": "2025-11-20T00:00:00Z",
    "updatedAt": "2025-11-20T00:00:00Z"
  },
  "ContentData": {
    "ContentBlocks": [
      {
        "type": "Hero",
        "content": {
          "headline": "Welcome",
          "subheadline": "Get started today",
          "buttonText": "Learn More",
          "buttonLink": "/learn-more"
        }
      }
    ]
  }
}
```

This structure matches the sample JSON files in the `DataSample` folder and provides a flexible, extensible system for managing page content.