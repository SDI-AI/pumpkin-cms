using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using pumpkin_api.Services;
using pumpkin_net_models;
using pumpkin_net_models.Models;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace pumpkin_api.Tests;

public static class BlockContractBackfill
{
    public static async Task RunAsync(string[] args)
    {
        var apiConfigPath = GetArgumentValue(args, "--api-config")
            ?? Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "apps", "pumpkin-api"));
        var tenantId = GetArgumentValue(args, "--tenant");
        var apply = args.Contains("--apply", StringComparer.OrdinalIgnoreCase);

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiConfigPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var cosmosSettings = configuration
            .GetSection($"{DatabaseSettings.SectionName}:CosmosDb")
            .Get<CosmosDbSettings>();
        if (cosmosSettings == null || string.IsNullOrWhiteSpace(cosmosSettings.ConnectionString))
        {
            throw new InvalidOperationException("Cosmos DB connection string was not found in the API configuration.");
        }

        var defaults = LoadBlockDefaults();
        using var loggerFactory = LoggerFactory.Create(builder => builder.SetMinimumLevel(LogLevel.Warning));
        using var connection = new CosmosDataConnection(
            Options.Create(cosmosSettings),
            loggerFactory.CreateLogger<CosmosDataConnection>());

        var pages = await connection.GetAllPagesAsync(tenantId);
        var changes = new List<PageChange>();
        var unknownTypes = new SortedSet<string>(StringComparer.Ordinal);

        foreach (var page in pages)
        {
            var originalJson = PageJsonConverter.ToJson(page);
            var pageChanges = AuditAndBackfill(page, defaults, unknownTypes);
            if (pageChanges.Count > 0)
            {
                changes.Add(new PageChange(page, pageChanges, originalJson));
            }
        }

        Console.WriteLine($"Block contract audit: {(apply ? "APPLY" : "DRY RUN")}");
        Console.WriteLine($"Scope: {(string.IsNullOrWhiteSpace(tenantId) ? "all tenants" : tenantId)}");
        Console.WriteLine($"Pages scanned: {pages.Count}");
        Console.WriteLine($"Pages requiring updates: {changes.Count}");
        Console.WriteLine($"Blocks requiring updates: {changes.Sum(change => change.Changes.Count)}");

        foreach (var change in changes)
        {
            Console.WriteLine($"- {change.Page.TenantId}/{change.Page.PageSlug} ({change.Page.PageId})");
            foreach (var blockChange in change.Changes)
            {
                Console.WriteLine($"    block[{blockChange.Index}] {blockChange.Type}: {string.Join(", ", blockChange.AddedProperties)}");
            }
        }

        if (unknownTypes.Count > 0)
        {
            Console.WriteLine($"Unknown block types preserved: {string.Join(", ", unknownTypes)}");
        }

        if (!apply)
        {
            Console.WriteLine("No database writes performed. Re-run with --apply after reviewing this report.");
            return;
        }

        if (changes.Count == 0)
        {
            Console.WriteLine("No database writes required.");
            return;
        }

        var backupRoot = GetArgumentValue(args, "--backup-dir")
            ?? Path.Combine(Directory.GetCurrentDirectory(), "artifacts", "block-contract-backups");
        var backupDirectory = Path.Combine(backupRoot, DateTime.UtcNow.ToString("yyyyMMdd-HHmmss"));
        Directory.CreateDirectory(backupDirectory);

        foreach (var change in changes)
        {
            var safeFileName = string.Join("_", new[] { change.Page.TenantId, change.Page.PageId }
                .Select(value => string.Concat(value.Select(character => Path.GetInvalidFileNameChars().Contains(character) ? '_' : character))));
            await File.WriteAllTextAsync(
                Path.Combine(backupDirectory, $"{safeFileName}.json"),
                change.OriginalJson);
        }

        foreach (var change in changes)
        {
            var validationErrors = HtmlBlockContractValidator.ValidatePage(change.Page);
            if (validationErrors.Count > 0)
            {
                throw new InvalidOperationException(
                    $"Backfilled page '{change.Page.TenantId}/{change.Page.PageSlug}' is still invalid: {string.Join("; ", validationErrors)}");
            }

            await connection.UpdatePageAdminAsync(change.Page.TenantId, change.Page.PageSlug, change.Page);
        }

        Console.WriteLine($"Updated pages: {changes.Count}");
        Console.WriteLine($"Backup directory: {backupDirectory}");
    }

    private static Dictionary<string, JsonObject> LoadBlockDefaults()
    {
        var fixturePath = Path.Combine(AppContext.BaseDirectory, "Fixtures", "block-contracts.generated.json");
        var fixtures = JsonNode.Parse(File.ReadAllText(fixturePath))?.AsArray()
            ?? throw new InvalidOperationException("Generated block fixtures are required.");

        return fixtures.ToDictionary(
            fixture => fixture?["type"]?.GetValue<string>()
                ?? throw new InvalidOperationException("Fixture block type is required."),
            fixture => fixture?["content"]?.AsObject()
                ?? throw new InvalidOperationException("Fixture block content is required."),
            StringComparer.Ordinal);
    }

    private static List<BlockChange> AuditAndBackfill(
        Page page,
        IReadOnlyDictionary<string, JsonObject> defaults,
        ISet<string> unknownTypes)
    {
        var changes = new List<BlockChange>();
        for (var index = 0; index < page.ContentData.ContentBlocks.Count; index++)
        {
            var block = page.ContentData.ContentBlocks[index];
            if (!defaults.TryGetValue(block.Type, out var defaultContent))
            {
                unknownTypes.Add(block.Type);
                continue;
            }

            var added = new List<string>();
            var content = ToJsonObject(block.Content, page, index);
            foreach (var property in defaultContent)
            {
                if (content.ContainsKey(property.Key)) continue;

                content[property.Key] = property.Value?.DeepClone();
                added.Add($"content.{property.Key}");
            }

            if (block.SchemaVersion == null)
            {
                block.SchemaVersion = 1;
                added.Add("schemaVersion");
            }

            if (added.Count == 0) continue;

            block.Content = JsonSerializer.Deserialize<JsonElement>(content.ToJsonString());
            changes.Add(new BlockChange(index, block.Type, added));
        }

        return changes;
    }

    private static JsonObject ToJsonObject(object? content, Page page, int blockIndex)
    {
        JsonNode? node = content switch
        {
            null => null,
            JsonElement element => JsonNode.Parse(element.GetRawText()),
            _ => JsonSerializer.SerializeToNode(content, content.GetType()),
        };

        return node as JsonObject
            ?? throw new InvalidOperationException(
                $"Page '{page.TenantId}/{page.PageSlug}' block[{blockIndex}] content is not an object and cannot be backfilled automatically.");
    }

    private static string? GetArgumentValue(string[] args, string name)
    {
        var prefix = $"{name}=";
        return args.FirstOrDefault(arg => arg.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))?[prefix.Length..];
    }

    private sealed record BlockChange(int Index, string Type, IReadOnlyList<string> AddedProperties);
    private sealed record PageChange(Page Page, IReadOnlyList<BlockChange> Changes, string OriginalJson);
}
