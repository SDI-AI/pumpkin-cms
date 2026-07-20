using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

public interface IHtmlBlock
{
    [JsonPropertyName("id")]
    string? Id { get; set; }

    [JsonPropertyName("name")]
    string? Name { get; set; }

    [JsonPropertyName("styleKey")]
    string? StyleKey { get; set; }

    [JsonPropertyName("enabled")]
    bool Enabled { get; set; }

    [JsonPropertyName("schemaVersion")]
    int? SchemaVersion { get; set; }

    [JsonPropertyName("type")]
    string Type { get; set; }

    [JsonPropertyName("content")]
    object Content { get; set; }
}
