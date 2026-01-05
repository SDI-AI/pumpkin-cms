using pumpkin_net_models.Models;

namespace pumpkin_api.Services;

/// <summary>
/// Common interface for database-specific operations.
/// Both Cosmos DB and MongoDB implementations should implement this interface.
/// </summary>
public interface IDataConnection
{
    Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug);
    Task<Page> SavePageAsync(string apiKey, string tenantId, Page page);
    Task<Page> UpdatePageAsync(string apiKey, string tenantId, string pageSlug, Page page);
    Task<bool> DeletePageAsync(string apiKey, string tenantId, string pageSlug);
}
