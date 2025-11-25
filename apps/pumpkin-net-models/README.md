# Pumpkin .NET Models

A shared class library containing data models for the Pumpkin CMS ecosystem.

## What's Included

- **Page Models**: Complete page structure with metadata, SEO, and content data
- **HTML Block System**: Extensible content block system with 15+ block types
- **JSON Serialization**: Built-in JSON converters and factory patterns

## Usage

Reference this library in your .NET projects:

```xml
<ProjectReference Include="../pumpkin-net-models/pumpkin-net-models.csproj" />
```

Then use the models:

```csharp
using pumpkin_net_models;
using pumpkin_net_models.Models;

// Convert JSON to Page
var page = PageJsonConverter.FromJson(jsonString);

// Create Page manually
var newPage = new Page
{
    PageId = "example",
    ContentData = new ContentData
    {
        ContentBlocks = new List<IHtmlBlock>
        {
            new HeroBlock { /* ... */ }
        }
    }
};
```

## Documentation

See [README-PageModels.md](README-PageModels.md) for detailed documentation.

## Target Framework

- .NET 9.0