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
    Task<FormEntry> SaveFormEntryAsync(string apiKey, string tenantId, FormEntry formEntry);
    Task<List<string>> GetSitemapPagesAsync(string apiKey, string tenantId);
    
    
    // Admin methods (JWT authentication required at endpoint level)
    Task<Tenant?> GetTenantAsync(string tenantId);
    Task<Tenant> CreateTenantAsync(Tenant tenant);
    Task<Tenant> UpdateTenantAsync(string tenantId, Tenant tenant);
    Task<bool> DeleteTenantAsync(string tenantId);
    Task<List<Tenant>> GetAllTenantsAsync();
    Task<List<Page>> GetAllPagesAsync(string? tenantId = null);
    Task<List<Page>> GetHubPagesAsync(string tenantId);
    Task<List<Page>> GetSpokePagesAsync(string tenantId, string hubPageSlug);
    Task<object> GetContentHierarchyAsync(string tenantId);
    
    // JWT-authenticated admin methods (no API key required)
    Task<Page?> GetPageBySlugAsync(string tenantId, string pageSlug);
    Task<List<Page>> GetPagesByTenantAsync(string tenantId);
    Task<List<Tenant>> GetTenantsForUserAsync(string userTenantId, bool isSuperAdmin);
    Task<Page> SavePageAdminAsync(string tenantId, Page page);
    Task<Page> UpdatePageAdminAsync(string tenantId, string pageSlug, Page page);
    
    // User authentication methods
    Task<User?> GetUserByEmailAsync(string email);
    Task UpdateUserLastLoginAsync(string userId, string tenantId);
}