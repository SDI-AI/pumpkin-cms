using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

public interface IHtmlBlock
{
    [JsonPropertyName("type")]
    string Type { get; set; }

    [JsonPropertyName("content")]
    object Content { get; set; }
}