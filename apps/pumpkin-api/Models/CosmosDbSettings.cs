namespace pumpkin_api.Models;

public class CosmosDbSettings
{
    public const string SectionName = "CosmosDb";
    
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public int MaxRetryAttemptsOnRateLimitedRequests { get; set; } = 9;
    public int MaxRetryWaitTimeOnRateLimitedRequests { get; set; } = 30;
    public string PreferredRegions { get; set; } = string.Empty;
}