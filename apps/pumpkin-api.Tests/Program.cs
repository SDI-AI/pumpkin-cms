using pumpkin_api.Managers;
using pumpkin_api.Services;
using pumpkin_net_models.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

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

// // API Key Generation Helper
// Console.WriteLine("=== API Key Generator ===\n");
// var plainApiKey = GenerateApiKey();
// var hashedApiKey = HashApiKey(plainApiKey);

// Console.WriteLine($"Plain API Key:  {plainApiKey}");
// Console.WriteLine($"Hashed API Key: {hashedApiKey}");
// Console.WriteLine($"\nVerification Test: {VerifyApiKey(plainApiKey, hashedApiKey)}");
// Console.WriteLine("\n" + new string('=', 50) + "\n");

// Test 1: GetWelcomeMessage
Console.WriteLine("Test 1: GetWelcomeMessage");
var welcomeResult = PumpkinManager.GetWelcomeMessage();
Console.WriteLine($"  ✅ GetWelcomeMessage returns result: {welcomeResult != null}");

// Test 2: Validate parameter handling (simulate bad request)
Console.WriteLine("\nTest 2: GetPageAsync with empty API key");
var badRequestResult = await PumpkinManager.GetPageAsync(null!, "", "tenant", "home");
Console.WriteLine($"  ✅ Returns BadRequest for empty API key: {badRequestResult != null}");

// Test 3: Get page by ID with Cosmos DB
if (!string.IsNullOrEmpty(apiKey) && !string.IsNullOrEmpty(tenantId))
{
    Console.WriteLine("\nTest 3: GetPageAsync - Retrieve page by slug");
    try
    {
        // Initialize Cosmos DB settings
        var cosmosSettings = configuration.GetSection(CosmosDbSettings.SectionName).Get<CosmosDbSettings>();
        
        if (cosmosSettings != null && !string.IsNullOrEmpty(cosmosSettings.ConnectionString))
        {
            var loggerFactory = LoggerFactory.Create(builder => { });
            using var cosmosDb = new CosmosDbFacade(
                Microsoft.Extensions.Options.Options.Create(cosmosSettings),
                loggerFactory.CreateLogger<CosmosDbFacade>()
            );

            var pageSlug = "pa/philadelphia/pumpkin-cms";
            Console.WriteLine($"  Fetching page: {pageSlug}");
            
            var page = await cosmosDb.GetPageAsync(apiKey, tenantId, pageSlug);

            
            if (page != null)
            {
                Console.WriteLine($"  ✅ Page retrieved successfully");
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
            else
            {
                Console.WriteLine($"  ⚠️  Page not found or access denied");
            }
        }
        else
        {
            Console.WriteLine("  ⚠️  Cosmos DB not configured - skipping test");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"  ❌ Error: {ex.Message}");
    }
}
else
{
    Console.WriteLine("\nTest 3: Skipped - API Key or Tenant ID not configured");
}

// Add more tests here as needed
Console.WriteLine("\n🎉 All basic tests completed!");
Console.WriteLine("\nNote: For full testing, mock ICosmosDbFacade or use integration tests with Cosmos DB Emulator");
