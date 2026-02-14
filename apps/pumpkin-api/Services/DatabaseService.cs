using Microsoft.Extensions.Options;
using pumpkin_net_models.Models;

namespace pumpkin_api.Services;

/// <summary>
/// Database service that routes to the appropriate database implementation (Cosmos DB or MongoDB)
/// based on configuration.
/// </summary>
public class DatabaseService : IDatabaseService, IDisposable
{
    private readonly IDataConnection _dataConnection;
    private readonly ILogger<DatabaseService> _logger;

    public DatabaseService(
        IOptions<DatabaseSettings> settings,
        IServiceProvider serviceProvider,
        ILogger<DatabaseService> logger)
    {
        _logger = logger;
        var databaseSettings = settings.Value;

        _logger.LogInformation("Initializing DatabaseService with provider: {Provider}", databaseSettings.Provider);

        // Route to the appropriate database implementation based on configuration
        _dataConnection = databaseSettings.Provider.ToLowerInvariant() switch
        {
            "cosmosdb" => serviceProvider.GetRequiredService<CosmosDataConnection>(),
            "mongodb" => serviceProvider.GetRequiredService<MongoDataConnection>(),
            _ => throw new InvalidOperationException($"Unsupported database provider: {databaseSettings.Provider}")
        };

        _logger.LogInformation("DatabaseService initialized with {Provider}", databaseSettings.Provider);
    }

    public Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug)
    {
        return _dataConnection.GetPageAsync(apiKey, tenantId, pageSlug);
    }

    public Task<Page> SavePageAsync(string apiKey, string tenantId, Page page)
    {
        return _dataConnection.SavePageAsync(apiKey, tenantId, page);
    }

    public Task<Page> UpdatePageAsync(string apiKey, string tenantId, string pageSlug, Page page)
    {
        return _dataConnection.UpdatePageAsync(apiKey, tenantId, pageSlug, page);
    }

    public Task<bool> DeletePageAsync(string apiKey, string tenantId, string pageSlug)
    {
        return _dataConnection.DeletePageAsync(apiKey, tenantId, pageSlug);
    }

    public Task<FormEntry> SaveFormEntryAsync(string apiKey, string tenantId, FormEntry formEntry)
    {
        return _dataConnection.SaveFormEntryAsync(apiKey, tenantId, formEntry);
    }

    public Task<List<string>> GetSitemapPagesAsync(string apiKey, string tenantId)
    {
        return _dataConnection.GetSitemapPagesAsync(apiKey, tenantId);
    }

    // Admin methods
    public Task<Tenant?> GetTenantAsync(string apiKey, string adminTenantId, string tenantId)
    {
        return _dataConnection.GetTenantAsync(apiKey, adminTenantId, tenantId);
    }

    public Task<Tenant> CreateTenantAsync(string apiKey, string adminTenantId, Tenant tenant)
    {
        return _dataConnection.CreateTenantAsync(apiKey, adminTenantId, tenant);
    }

    public Task<List<Tenant>> GetAllTenantsAsync(string apiKey, string adminTenantId)
    {
        return _dataConnection.GetAllTenantsAsync(apiKey, adminTenantId);
    }

    public Task<List<Page>> GetAllPagesAsync(string apiKey, string adminTenantId, string? tenantId = null)
    {
        return _dataConnection.GetAllPagesAsync(apiKey, adminTenantId, tenantId);
    }

    public Task<List<Page>> GetHubPagesAsync(string apiKey, string adminTenantId, string tenantId)
    {
        return _dataConnection.GetHubPagesAsync(apiKey, adminTenantId, tenantId);
    }

    public Task<List<Page>> GetSpokePagesAsync(string apiKey, string adminTenantId, string tenantId, string hubPageSlug)
    {
        return _dataConnection.GetSpokePagesAsync(apiKey, adminTenantId, tenantId, hubPageSlug);
    }

    public Task<object> GetContentHierarchyAsync(string apiKey, string adminTenantId, string tenantId)
    {
        return _dataConnection.GetContentHierarchyAsync(apiKey, adminTenantId, tenantId);
    }

    public void Dispose()
    {
        if (_dataConnection is IDisposable disposable)
        {
            disposable.Dispose();
        }
    }
}
