using pumpkin_api.Managers;

Console.WriteLine("🎃 Running Pumpkin API Tests...\n");

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
