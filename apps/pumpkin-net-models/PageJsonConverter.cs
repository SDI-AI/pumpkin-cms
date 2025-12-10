using System.Text.Json;
using System.Text.Json.Serialization;
using pumpkin_net_models.Models;

namespace pumpkin_net_models;

/// <summary>
/// Utility class for converting JSON to Page objects and vice versa
/// </summary>
public static class PageJsonConverter
{
    private static readonly JsonSerializerOptions DefaultOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new HtmlBlockJsonConverter(), new HtmlBlockBaseJsonConverter() },
        WriteIndented = true
    };

    /// <summary>
    /// Converts a JSON string to a Page object
    /// </summary>
    /// <param name="json">JSON string representing a page</param>
    /// <returns>Page object or null if conversion fails</returns>
    public static Page? FromJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<Page>(json, DefaultOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>
    /// Converts a JSON string to a Page object with custom options
    /// </summary>
    /// <param name="json">JSON string representing a page</param>
    /// <param name="options">Custom JSON serializer options</param>
    /// <returns>Page object or null if conversion fails</returns>
    public static Page? FromJson(string json, JsonSerializerOptions options)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<Page>(json, options);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>
    /// Converts a Page object to JSON string
    /// </summary>
    /// <param name="page">Page object to convert</param>
    /// <returns>JSON string representation of the page</returns>
    public static string ToJson(Page page)
    {
        if (page == null)
            return string.Empty;

        try
        {
            return JsonSerializer.Serialize(page, DefaultOptions);
        }
        catch (JsonException)
        {
            return string.Empty;
        }
    }

    /// <summary>
    /// Converts a Page object to JSON string with custom options
    /// </summary>
    /// <param name="page">Page object to convert</param>
    /// <param name="options">Custom JSON serializer options</param>
    /// <returns>JSON string representation of the page</returns>
    public static string ToJson(Page page, JsonSerializerOptions options)
    {
        if (page == null)
            return string.Empty;

        try
        {
            return JsonSerializer.Serialize(page, options);
        }
        catch (JsonException)
        {
            return string.Empty;
        }
    }

    /// <summary>
    /// Validates if a JSON string can be converted to a Page object
    /// </summary>
    /// <param name="json">JSON string to validate</param>
    /// <returns>True if the JSON can be converted to a Page object</returns>
    public static bool IsValidPageJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return false;

        try
        {
            var page = JsonSerializer.Deserialize<Page>(json, DefaultOptions);
            return page != null;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    /// <summary>
    /// Converts a JSON file to a Page object
    /// </summary>
    /// <param name="filePath">Path to the JSON file</param>
    /// <returns>Page object or null if conversion fails</returns>
    public static async Task<Page?> FromJsonFileAsync(string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            return null;

        try
        {
            var json = await File.ReadAllTextAsync(filePath);
            return FromJson(json);
        }
        catch (Exception)
        {
            return null;
        }
    }

    /// <summary>
    /// Saves a Page object to a JSON file
    /// </summary>
    /// <param name="page">Page object to save</param>
    /// <param name="filePath">Path where to save the JSON file</param>
    /// <returns>True if the file was saved successfully</returns>
    public static async Task<bool> ToJsonFileAsync(Page page, string filePath)
    {
        if (page == null || string.IsNullOrWhiteSpace(filePath))
            return false;

        try
        {
            var json = ToJson(page);
            if (string.IsNullOrEmpty(json))
                return false;

            var directory = Path.GetDirectoryName(filePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            await File.WriteAllTextAsync(filePath, json);
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    /// <summary>
    /// Gets default JSON serializer options used by this converter
    /// </summary>
    /// <returns>JsonSerializerOptions with HTML block converter included</returns>
    public static JsonSerializerOptions GetDefaultOptions()
    {
        return new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new HtmlBlockJsonConverter(), new HtmlBlockBaseJsonConverter() },
            WriteIndented = true
        };
    }
}