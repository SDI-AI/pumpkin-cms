using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

// Base abstract class for common properties
public abstract class HtmlBlockBase : IHtmlBlock
{
    [JsonPropertyName("id")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Name { get; set; }

    [JsonPropertyName("enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("schemaVersion")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? SchemaVersion { get; set; }

    [JsonPropertyName("type")]
    public virtual string Type { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public abstract object Content { get; set; }
}

/// <summary>
/// Generic HTML block for unknown or custom block types
/// </summary>
public class GenericHtmlBlock : HtmlBlockBase
{
    [JsonPropertyName("content")]
    public override object Content { get; set; } = new Dictionary<string, object>();
}
