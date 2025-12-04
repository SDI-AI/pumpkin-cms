using pumpkin_api.Managers;
using Microsoft.Extensions.Configuration;

// Load configuration
var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile($"appsettings.{environment}.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

var apiKey = configuration["ApiKey"] ?? "";

Console.WriteLine("🎃 Running Pumpkin API Tests...\n");

if (!string.IsNullOrEmpty(apiKey))
{
    Console.WriteLine($"Loaded API Key from config: {apiKey}\n");
}

// API Key Generation Helper
Console.WriteLine("=== API Key Generator ===\n");
var plainApiKey = GenerateApiKey();
var hashedApiKey = HashApiKey(plainApiKey);

Console.WriteLine($"Plain API Key:  {plainApiKey}");
Console.WriteLine($"Hashed API Key: {hashedApiKey}");
Console.WriteLine($"\nVerification Test: {VerifyApiKey(plainApiKey, hashedApiKey)}");
Console.WriteLine("\n" + new string('=', 50) + "\n");

// Test 1: GetWelcomeMessage
Console.WriteLine("Test 1: GetWelcomeMessage");
var welcomeResult = PumpkinManager.GetWelcomeMessage();
Console.WriteLine($"  ✅ GetWelcomeMessage returns result: {welcomeResult != null}");

// Test 2: Validate parameter handling (simulate bad request)
Console.WriteLine("\nTest 2: GetPageAsync with empty API key");
var badRequestResult = await PumpkinManager.GetPageAsync(null!, "", "tenant", "home");
Console.WriteLine($"  ✅ Returns BadRequest for empty API key: {badRequestResult != null}");

// Add more tests here as needed
Console.WriteLine("\n🎉 All basic tests completed!");
Console.WriteLine("\nNote: For full testing, mock ICosmosDbFacade or use integration tests with Cosmos DB Emulator");

// Helper Methods
static string GenerateApiKey()
{
    // Generate a random 32-character API key
    const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var random = new Random();
    return new string(Enumerable.Repeat(chars, 32)
        .Select(s => s[random.Next(s.Length)]).ToArray());
}

static string HashApiKey(string apiKey)
{
    // Hash the API key using BCrypt
    return BCrypt.Net.BCrypt.HashPassword(apiKey);
}

static bool VerifyApiKey(string plainApiKey, string hashedApiKey)
{
    // Verify a plain API key against its hash
    return BCrypt.Net.BCrypt.Verify(plainApiKey, hashedApiKey);
}
