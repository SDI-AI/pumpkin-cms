using System.Text.Json;
using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

/// <summary>
/// Factory class for creating HTML blocks from JSON data
/// </summary>
public static class HtmlBlockFactory
{
    private static readonly Dictionary<string, Type> BlockTypeMap = new()
    {
        { "Hero", typeof(HeroBlock) },
        { "PrimaryCTA", typeof(PrimaryCtaBlock) },
        { "SecondaryCTA", typeof(SecondaryCtaBlock) },
        { "CardGrid", typeof(CardGridBlock) },
        { "FAQ", typeof(FaqBlock) },
        { "Breadcrumbs", typeof(BreadcrumbsBlock) },
        { "TrustBar", typeof(TrustBarBlock) },
        { "HowItWorks", typeof(HowItWorksBlock) },
        { "ServiceAreaMap", typeof(ServiceAreaMapBlock) },
        { "LocalProTips", typeof(LocalProTipsBlock) },
        { "Gallery", typeof(GalleryBlock) },
        { "Testimonials", typeof(TestimonialsBlock) },
        { "Contact", typeof(ContactBlock) },
        { "Blog", typeof(BlogBlock) }
    };

    /// <summary>
    /// Creates an HTML block from a JsonElement
    /// </summary>
    public static IHtmlBlock? CreateBlock(JsonElement blockElement)
    {
        if (!blockElement.TryGetProperty("type", out var typeProperty))
        {
            return null;
        }

        var blockType = typeProperty.GetString();
        if (string.IsNullOrEmpty(blockType) || !BlockTypeMap.TryGetValue(blockType, out var type))
        {
            // Return a generic block for unknown types
            return new GenericHtmlBlock
            {
                Type = blockType ?? "Unknown",
                Content = JsonSerializer.Deserialize<Dictionary<string, object>>(blockElement.GetProperty("content").GetRawText()) ?? new()
            };
        }

        return (IHtmlBlock?)JsonSerializer.Deserialize(blockElement.GetRawText(), type);
    }

    /// <summary>
    /// Creates an HTML block from JSON string
    /// </summary>
    public static IHtmlBlock? CreateBlock(string jsonString)
    {
        var element = JsonSerializer.Deserialize<JsonElement>(jsonString);
        return CreateBlock(element);
    }

    /// <summary>
    /// Gets all supported block types
    /// </summary>
    public static IEnumerable<string> GetSupportedBlockTypes()
    {
        return BlockTypeMap.Keys;
    }
}



/// <summary>
/// Custom JSON converter for IHtmlBlock interface
/// </summary>
public class HtmlBlockJsonConverter : JsonConverter<IHtmlBlock>
{
    public override IHtmlBlock? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var element = JsonDocument.ParseValue(ref reader).RootElement;
        return HtmlBlockFactory.CreateBlock(element);
    }

    public override void Write(Utf8JsonWriter writer, IHtmlBlock value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, value, value.GetType(), options);
    }
}

/// <summary>
/// Custom JSON converter for HtmlBlockBase abstract class
/// </summary>
public class HtmlBlockBaseJsonConverter : JsonConverter<HtmlBlockBase>
{
    public override HtmlBlockBase? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var element = JsonDocument.ParseValue(ref reader).RootElement;
        var block = HtmlBlockFactory.CreateBlock(element);
        return block as HtmlBlockBase;
    }

    public override void Write(Utf8JsonWriter writer, HtmlBlockBase value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, value, value.GetType(), options);
    }
}