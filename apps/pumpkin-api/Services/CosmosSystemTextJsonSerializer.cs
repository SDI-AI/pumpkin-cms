using Microsoft.Azure.Cosmos;
using System.Text.Json;
using System.Text.Json.Serialization;
using pumpkin_net_models.Models;

namespace pumpkin_api.Services;

/// <summary>
/// Custom Cosmos DB serializer using System.Text.Json with HTML block converters
/// </summary>
public class CosmosSystemTextJsonSerializer : CosmosSerializer
{
    private readonly JsonSerializerOptions _jsonSerializerOptions;

    public CosmosSystemTextJsonSerializer()
    {
        _jsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.Never,
            Converters =
            {
                new HtmlBlockJsonConverter(),
                new HtmlBlockBaseJsonConverter()
            }
        };
    }

    public CosmosSystemTextJsonSerializer(JsonSerializerOptions options)
    {
        _jsonSerializerOptions = options;
    }

    public override T FromStream<T>(Stream stream)
    {
        if (stream == null || stream.Length == 0)
        {
            return default!;
        }

        using (stream)
        {
            return JsonSerializer.Deserialize<T>(stream, _jsonSerializerOptions)!;
        }
    }

    public override Stream ToStream<T>(T input)
    {
        var stream = new MemoryStream();
        JsonSerializer.Serialize(stream, input, _jsonSerializerOptions);
        stream.Position = 0;
        return stream;
    }
}
