using System.Security.Cryptography;

namespace pumpkin_api.Tests;

/// <summary>
/// Utility class for generating API keys and their hashes
/// </summary>
public static class ApiKeyGenerator
{
    /// <summary>
    /// Generates a new API key and its BCrypt hash
    /// </summary>
    /// <param name="keyLength">Length of the API key in bytes (default 32, resulting in 44 base64 characters)</param>
    /// <returns>A tuple containing the plain API key and its BCrypt hash</returns>
    public static (string ApiKey, string ApiKeyHash) GenerateApiKeyWithHash(int keyLength = 32)
    {
        var apiKey = GenerateApiKey(keyLength);
        var apiKeyHash = HashApiKey(apiKey);
        return (apiKey, apiKeyHash);
    }

    /// <summary>
    /// Generates a new random API key
    /// </summary>
    /// <param name="keyLength">Length of the API key in bytes (default 32, resulting in 44 base64 characters)</param>
    /// <returns>A base64-encoded API key</returns>
    public static string GenerateApiKey(int keyLength = 32)
    {
        var keyBytes = RandomNumberGenerator.GetBytes(keyLength);
        return Convert.ToBase64String(keyBytes);
    }

    /// <summary>
    /// Generates a BCrypt hash for an API key
    /// </summary>
    /// <param name="apiKey">The plain text API key</param>
    /// <param name="workFactor">BCrypt work factor (default 12)</param>
    /// <returns>The BCrypt hash of the API key</returns>
    public static string HashApiKey(string apiKey, int workFactor = 12)
    {
        return BCrypt.Net.BCrypt.HashPassword(apiKey, workFactor);
    }

    /// <summary>
    /// Verifies an API key against a BCrypt hash
    /// </summary>
    /// <param name="apiKey">The plain text API key</param>
    /// <param name="apiKeyHash">The BCrypt hash to verify against</param>
    /// <returns>True if the API key matches the hash, false otherwise</returns>
    public static bool VerifyApiKey(string apiKey, string apiKeyHash)
    {
        return BCrypt.Net.BCrypt.Verify(apiKey, apiKeyHash);
    }

    /// <summary>
    /// Prints API key generation details to the console
    /// </summary>
    public static void PrintGeneratedKey()
    {
        var (apiKey, apiKeyHash) = GenerateApiKeyWithHash();
        
        Console.WriteLine("?? Generated API Key Details:");
        Console.WriteLine($"  API Key:      {apiKey}");
        Console.WriteLine($"  API Key Hash: {apiKeyHash}");
        Console.WriteLine();
        Console.WriteLine("  ??  Store the API Key securely - it cannot be recovered from the hash!");
        Console.WriteLine("  ?? Use the hash value for the 'apiKeyHash' field in the Tenant document.");
    }
}
