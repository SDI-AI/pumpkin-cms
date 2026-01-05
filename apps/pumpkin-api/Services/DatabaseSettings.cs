namespace pumpkin_api.Services;

public class DatabaseSettings
{
    public const string SectionName = "Database";
    
    /// <summary>
    /// Database provider: "CosmosDb" or "MongoDb"
    /// </summary>
    public string Provider { get; set; } = "CosmosDb";
    
    public CosmosDbSettings CosmosDb { get; set; } = new();
    public MongoDbSettings MongoDb { get; set; } = new();
}

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public int MaxConnectionPoolSize { get; set; } = 100;
    public int ConnectTimeoutMs { get; set; } = 30000;
    public int ServerSelectionTimeoutMs { get; set; } = 30000;
}

public class CosmosDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public int MaxRetryAttemptsOnRateLimitedRequests { get; set; } = 9;
    public int MaxRetryWaitTimeOnRateLimitedRequests { get; set; } = 30;
    public string PreferredRegions { get; set; } = string.Empty;
}
