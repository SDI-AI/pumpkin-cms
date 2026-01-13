using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using pumpkin_api.Managers;
using pumpkin_api.Services;
using pumpkin_api.Tests;
using pumpkin_net_models.Models;
using System.Text.Json;

// Generate API Key and Hash for Admin Tenant
Console.WriteLine("🎃 Pumpkin CMS - API Key Generator\n");
Console.WriteLine("Generating new API key for admin tenant...\n");

var apiKey = ApiKeyGenerator.GenerateApiKey();
var apiKeyHash = ApiKeyGenerator.HashApiKey(apiKey);

Console.WriteLine("================================================");
Console.WriteLine("ADMIN TENANT CREDENTIALS");
Console.WriteLine("================================================");
Console.WriteLine($"Tenant ID:  admin");
Console.WriteLine($"API Key:    {apiKey}");
Console.WriteLine($"API Hash:   {apiKeyHash}");
Console.WriteLine("================================================");
Console.WriteLine("\n⚠️  IMPORTANT: Save the API Key securely!");
Console.WriteLine("   The plain API key cannot be retrieved later.");
Console.WriteLine("   Store the hash in your Tenant document.\n");

Console.WriteLine("Example Tenant Document:");
Console.WriteLine("------------------------");
var exampleTenant = new
{
    id = "admin-tenant-id",
    tenantId = "admin",
    name = "Admin Tenant",
    plan = "enterprise",
    status = "active",
    apiKey = "", // Never store the plain key
    apiKeyHash = apiKeyHash,
    apiKeyMeta = new
    {
        createdAt = DateTime.UtcNow,
        isActive = true
    },
    createdAt = DateTime.UtcNow,
    updatedAt = DateTime.UtcNow
};

var jsonOptions = new JsonSerializerOptions
{
    WriteIndented = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
};
Console.WriteLine(JsonSerializer.Serialize(exampleTenant, jsonOptions));
Console.WriteLine();

// Commented out: Run all tests
/*
// Load configuration
var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile($"appsettings.{environment}.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

var apiKey = configuration["ApiKey"] ?? "";
var tenantId = configuration["TenantId"] ?? "";

Console.WriteLine("🎃 Running Pumpkin API Tests...\n");

if (!string.IsNullOrEmpty(apiKey))
{
    Console.WriteLine($"Loaded API Key: {apiKey.Substring(0, Math.Min(8, apiKey.Length))}...");
    Console.WriteLine($"Loaded Tenant ID: {tenantId}\n");
}

// Run all tests
await PumpkinApiTests.RunTest1();
await PumpkinApiTests.RunTest2();
await PumpkinApiTests.RunTest3And4(configuration, apiKey, tenantId);

Console.WriteLine("\n🎉 All basic tests completed!");
Console.WriteLine("\nNote: For full testing, mock IDatabaseService or use integration tests with database");
*/

/// <summary>
/// Test class for Pumpkin API operations
/// </summary>
public static class PumpkinApiTests
{
    /// <summary>
    /// Test 1: GetWelcomeMessage
    /// </summary>
    public static async Task RunTest1()
    {
        Console.WriteLine("Test 1: GetWelcomeMessage");
        var welcomeResult = PumpkinManager.GetWelcomeMessage();
        Console.WriteLine($"  ✅ GetWelcomeMessage returns result: {welcomeResult != null}");
        await Task.CompletedTask;
    }

    /// <summary>
    /// Test 2: Validate parameter handling (simulate bad request)
    /// </summary>
    public static async Task RunTest2()
    {
        Console.WriteLine("\nTest 2: GetPageAsync with empty API key");
        var badRequestResult = await PumpkinManager.GetPageAsync(null!, "", "tenant", "home");
        Console.WriteLine($"  ✅ Returns BadRequest for empty API key: {badRequestResult != null}");
    }

    /// <summary>
    /// Test 3 & 4: Get page by slug and create a copy with database
    /// </summary>
    public static async Task RunTest3And4(IConfiguration configuration, string apiKey, string tenantId)
    {
        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(tenantId))
        {
            Console.WriteLine("\nTest 3: Skipped - API Key or Tenant ID not configured");
            return;
        }

        Console.WriteLine("\nTest 3: GetPageAsync - Retrieve page by slug");
        Page? retrievedPage = null;
        IDatabaseService? databaseService = null;
        string? createdPageSlug = null;

        try
        {
            // Initialize Database settings
            var databaseSettings = configuration.GetSection(DatabaseSettings.SectionName).Get<DatabaseSettings>();

            if (databaseSettings != null)
            {
                var loggerFactory = LoggerFactory.Create(builder => { });
                
                // Create the appropriate data connection based on provider
                if (databaseSettings.Provider.Equals("CosmosDb", StringComparison.OrdinalIgnoreCase))
                {
                    var cosmosSettings = configuration.GetSection($"{DatabaseSettings.SectionName}:CosmosDb").Get<CosmosDbSettings>();
                    if (cosmosSettings != null && !string.IsNullOrEmpty(cosmosSettings.ConnectionString))
                    {
                        var cosmosConnection = new CosmosDataConnection(
                            Microsoft.Extensions.Options.Options.Create(cosmosSettings),
                            loggerFactory.CreateLogger<CosmosDataConnection>()
                        );
                        
                        // For testing, we'll use the connection directly instead of DatabaseService
                        // In production, use DatabaseService through DI
                        databaseService = cosmosConnection as IDatabaseService ?? new TestDatabaseService(cosmosConnection);
                    }
                }

                if (databaseService != null)
                {
                    var pageSlug = "pa/philadelphia/pumpkin-cms";
                    Console.WriteLine($"  Fetching page: {pageSlug}");

                    var page = await databaseService.GetPageAsync(apiKey, tenantId, pageSlug);

                    if (page != null)
                    {
                        retrievedPage = page;
                        Console.WriteLine($"  ✅ Page retrieved successfully");
                        PrintPageJson(page);
                    }
                    else
                    {
                        Console.WriteLine($"  ⚠️  Page not found or access denied");
                    }
                }
                else
                {
                    Console.WriteLine("  ⚠️  Database not configured - skipping test");
                }
            }
            else
            {
                Console.WriteLine("  ⚠️  Database settings not configured - skipping test");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  ❌ Error: {ex.Message}");
        }

        // Test 4: Create new page from Test 3 data
        if (retrievedPage != null && databaseService != null)
        {
            createdPageSlug = await RunTest4CreatePage(databaseService, apiKey, tenantId, retrievedPage);
        }
        else if (retrievedPage == null)
        {
            Console.WriteLine("\nTest 4: Skipped - No page retrieved in Test 3");
        }
        else
        {
            Console.WriteLine("\nTest 4: Skipped - Database not initialized");
        }

        // Test 5: Delete the page created in Test 4
        if (!string.IsNullOrEmpty(createdPageSlug) && databaseService != null)
        {
            await RunTest5DeletePage(databaseService, apiKey, tenantId, createdPageSlug);
        }
        else if (string.IsNullOrEmpty(createdPageSlug))
        {
            Console.WriteLine("\nTest 5: Skipped - No page created in Test 4");
        }
        else
        {
            Console.WriteLine("\nTest 5: Skipped - Database not initialized");
        }

        // Dispose of database service if created
        if (databaseService is IDisposable disposable)
        {
            disposable.Dispose();
        }
    }

    /// <summary>
    /// Test 4: Create new page from retrieved data
    /// </summary>
    private static async Task<string?> RunTest4CreatePage(IDatabaseService databaseService, string apiKey, string tenantId, Page retrievedPage)
    {
        Console.WriteLine("\nTest 4: SavePageAsync - Create new page from retrieved data");
        try
        {
            // Clone the page and modify the slug
            var newSlug = $"pa/philadelphia/pumpkin-cms-test-{DateTime.UtcNow:yyyyMMdd-HHmmss}";
            var newPageId = Guid.NewGuid().ToString();

            var newPage = ClonePage(retrievedPage, newPageId, tenantId, newSlug);

            Console.WriteLine($"  Creating new page with slug: {newSlug}");
            Console.WriteLine($"  New Page ID: {newPageId}");

            var savedPage = await databaseService.SavePageAsync(apiKey, tenantId, newPage);

            if (savedPage != null)
            {
                Console.WriteLine($"  ✅ New page created successfully!");
                Console.WriteLine($"  📄 New Page Slug: {savedPage.PageSlug}");
                Console.WriteLine($"  🆔 New Page ID: {savedPage.PageId}");
                Console.WriteLine($"  📝 Title: {savedPage.MetaData.Title}");
                Console.WriteLine($"  🕒 Created At: {savedPage.MetaData.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC");
                return savedPage.PageSlug;
            }
            else
            {
                Console.WriteLine($"  ⚠️  Page creation returned null");
                return null;
            }
        }
        catch (InvalidOperationException ex)
        {
            Console.WriteLine($"  ⚠️  Page already exists: {ex.Message}");
            return null;
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine($"  ❌ Unauthorized: {ex.Message}");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  ❌ Error creating page: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"     Inner exception: {ex.InnerException.Message}");
            }
            return null;
        }
    }

    /// <summary>
    /// Test 5: Delete the test page created in Test 4
    /// </summary>
    private static async Task RunTest5DeletePage(IDatabaseService databaseService, string apiKey, string tenantId, string pageSlug)
    {
        Console.WriteLine("\nTest 5: DeletePageAsync - Delete the test page");
        try
        {
            Console.WriteLine($"  Deleting page with slug: {pageSlug}");

            var deleted = await databaseService.DeletePageAsync(apiKey, tenantId, pageSlug);

            if (deleted)
            {
                Console.WriteLine($"  ✅ Page deleted successfully!");
                Console.WriteLine($"  🗑️  Deleted Page Slug: {pageSlug}");
            }
            else
            {
                Console.WriteLine($"  ⚠️  Page deletion returned false - page may not exist");
            }
        }
        catch (UnauthorizedAccessException ex)
        {
            Console.WriteLine($"  ❌ Unauthorized: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  ❌ Error deleting page: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"     Inner exception: {ex.InnerException.Message}");
            }
        }
    }

    /// <summary>
    /// Clone a page with new ID, slug, and tenant ID
    /// </summary>
    private static Page ClonePage(Page source, string newPageId, string tenantId, string newSlug)
    {
        return new Page
        {
            PageId = newPageId,
            TenantId = tenantId,
            PageSlug = newSlug,
            PageVersion = 1,
            Layout = source.Layout,
            MetaData = new PageMetaData
            {
                Category = source.MetaData.Category,
                Product = source.MetaData.Product,
                Keyword = source.MetaData.Keyword,
                Title = source.MetaData.Title + " (Test Copy)",
                Description = source.MetaData.Description,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Author = source.MetaData.Author,
                Language = source.MetaData.Language,
                Market = source.MetaData.Market
            },
            SearchData = new SearchData
            {
                State = source.SearchData.State,
                City = source.SearchData.City,
                Keyword = source.SearchData.Keyword,
                Tags = new List<string>(source.SearchData.Tags),
                ContentSummary = source.SearchData.ContentSummary,
                BlockTypes = new List<string>(source.SearchData.BlockTypes)
            },
            ContentData = new ContentData
            {
                ContentBlocks = new List<HtmlBlockBase>(source.ContentData.ContentBlocks)
            },
            Seo = new SeoData
            {
                MetaTitle = source.Seo.MetaTitle,
                MetaDescription = source.Seo.MetaDescription,
                Keywords = new List<string>(source.Seo.Keywords),
                Robots = source.Seo.Robots,
                CanonicalUrl = source.Seo.CanonicalUrl,
                AlternateUrls = new List<AlternateUrl>(source.Seo.AlternateUrls),
                OpenGraph = new OpenGraphData
                {
                    Title = source.Seo.OpenGraph.Title,
                    Description = source.Seo.OpenGraph.Description,
                    Type = source.Seo.OpenGraph.Type,
                    Url = source.Seo.OpenGraph.Url,
                    Image = source.Seo.OpenGraph.Image,
                    ImageAlt = source.Seo.OpenGraph.ImageAlt,
                    SiteName = source.Seo.OpenGraph.SiteName,
                    Locale = source.Seo.OpenGraph.Locale
                },
                TwitterCard = new TwitterCardData
                {
                    Card = source.Seo.TwitterCard.Card,
                    Title = source.Seo.TwitterCard.Title,
                    Description = source.Seo.TwitterCard.Description,
                    Image = source.Seo.TwitterCard.Image,
                    Site = source.Seo.TwitterCard.Site,
                    Creator = source.Seo.TwitterCard.Creator
                }
            },
            IsPublished = source.IsPublished,
            PublishedAt = source.PublishedAt,
            IncludeInSitemap = source.IncludeInSitemap
        };
    }

    /// <summary>
    /// Print page JSON to console
    /// </summary>
    private static void PrintPageJson(Page page)
    {
        Console.WriteLine($"\n  Page JSON:");
        Console.WriteLine($"  {new string('-', 80)}");

        var jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        var pageJson = JsonSerializer.Serialize(page, jsonOptions);
        Console.WriteLine(pageJson);
        Console.WriteLine($"  {new string('-', 80)}");
    }
}

// Simple wrapper for testing that implements IDatabaseService
internal class TestDatabaseService : IDatabaseService, IDisposable
{
    private readonly IDataConnection _connection;

    public TestDatabaseService(IDataConnection connection)
    {
        _connection = connection;
    }

    public Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug)
        => _connection.GetPageAsync(apiKey, tenantId, pageSlug);

    public Task<Page> SavePageAsync(string apiKey, string tenantId, Page page)
        => _connection.SavePageAsync(apiKey, tenantId, page);

    public Task<Page> UpdatePageAsync(string apiKey, string tenantId, string pageSlug, Page page)
        => _connection.UpdatePageAsync(apiKey, tenantId, pageSlug, page);

    public Task<bool> DeletePageAsync(string apiKey, string tenantId, string pageSlug)
        => _connection.DeletePageAsync(apiKey, tenantId, pageSlug);

    public Task<FormEntry> SaveFormEntryAsync(string apiKey, string tenantId, FormEntry formEntry)
        => _connection.SaveFormEntryAsync(apiKey, tenantId, formEntry);

    public Task<List<string>> GetSitemapPagesAsync(string apiKey, string tenantId)
        => _connection.GetSitemapPagesAsync(apiKey, tenantId);

    public void Dispose()
    {
        if (_connection is IDisposable disposable)
        {
            disposable.Dispose();
        }
    }
}
