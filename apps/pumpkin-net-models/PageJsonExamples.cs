using System.Text.Json;
using pumpkin_net_models.Models;

namespace pumpkin_net_models;

/// <summary>
/// Example usage and utility methods for working with Page JSON conversion
/// </summary>
public static class PageJsonExamples
{
    /// <summary>
    /// Example of converting JSON from sample files to Page objects
    /// </summary>
    public static void BasicUsageExample()
    {
        // Example JSON (simplified)
        var sampleJson = """
        {
            "PageId": "example-page",
            "fullSlug": "example/page",
            "PageVersion": 1,
            "Layout": "default",
            "MetaData": {
                "title": "Example Page",
                "description": "This is an example page",
                "author": "Content Team"
            },
            "ContentData": {
                "ContentBlocks": [
                    {
                        "type": "Hero",
                        "content": {
                            "headline": "Welcome to Our Site",
                            "subheadline": "We're glad you're here",
                            "buttonText": "Get Started",
                            "buttonLink": "/get-started"
                        }
                    }
                ]
            }
        }
        """;

        // Convert JSON to Page object
        var page = PageJsonConverter.FromJson(sampleJson);
        
        if (page != null)
        {
            Console.WriteLine($"Loaded page: {page.PageId}");
            Console.WriteLine($"Title: {page.MetaData.Title}");
            Console.WriteLine($"Content blocks: {page.ContentData.ContentBlocks.Count}");
        }

        // Convert Page object back to JSON
        if (page != null)
        {
            var jsonOutput = PageJsonConverter.ToJson(page);
            Console.WriteLine("JSON Output:");
            Console.WriteLine(jsonOutput);
        }
    }

    /// <summary>
    /// Example of loading a page from a file
    /// </summary>
    public static async Task<Page?> LoadPageFromFile(string filePath)
    {
        var page = await PageJsonConverter.FromJsonFileAsync(filePath);
        
        if (page != null)
        {
            Console.WriteLine($"Successfully loaded page: {page.PageId}");
            return page;
        }
        
        Console.WriteLine($"Failed to load page from: {filePath}");
        return null;
    }

    /// <summary>
    /// Example of saving a page to a file
    /// </summary>
    public static async Task<bool> SavePageToFile(Page page, string filePath)
    {
        var success = await PageJsonConverter.ToJsonFileAsync(page, filePath);
        
        if (success)
        {
            Console.WriteLine($"Successfully saved page to: {filePath}");
        }
        else
        {
            Console.WriteLine($"Failed to save page to: {filePath}");
        }

        return success;
    }

    /// <summary>
    /// Example of validating JSON before conversion
    /// </summary>
    public static bool ValidateAndConvert(string json)
    {
        // First validate
        if (!PageJsonConverter.IsValidPageJson(json))
        {
            Console.WriteLine("Invalid page JSON format");
            return false;
        }

        // Then convert
        var page = PageJsonConverter.FromJson(json);
        if (page != null)
        {
            Console.WriteLine($"Valid page JSON converted successfully: {page.PageId}");
            return true;
        }

        Console.WriteLine("JSON validation passed but conversion failed");
        return false;
    }

    /// <summary>
    /// Example of using custom JSON options
    /// </summary>
    public static void CustomOptionsExample()
    {
        var customOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = false,
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            Converters = { new HtmlBlockJsonConverter() },
            WriteIndented = false
        };

        var sampleJson = """{"PageId": "test", "MetaData": {"title": "Test"}}""";
        
        var page = PageJsonConverter.FromJson(sampleJson, customOptions);
        if (page != null)
        {
            var customJson = PageJsonConverter.ToJson(page, customOptions);
            Console.WriteLine($"Custom format: {customJson}");
        }
    }
}