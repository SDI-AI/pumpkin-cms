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
    Task<List<SitemapEntry>> GetSitemapPagesAsync(string apiKey, string tenantId);
    
    
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
    Task<bool> DeletePageAdminAsync(string tenantId, string pageSlug);
    
    // Theme methods (content serving - API key required)
    Task<Theme?> GetThemeAsync(string apiKey, string tenantId, string themeId);
    Task<Theme?> GetActiveThemeAsync(string apiKey, string tenantId);

    // Theme admin methods (JWT authentication required at endpoint level)
    Task<Theme?> GetThemeAdminAsync(string tenantId, string themeId);
    Task<Theme?> GetActiveThemeAdminAsync(string tenantId);
    Task<List<Theme>> GetThemesByTenantAsync(string tenantId);
    Task<Theme> CreateThemeAsync(string tenantId, Theme theme);
    Task<Theme> UpdateThemeAsync(string tenantId, string themeId, Theme theme);
    Task<bool> DeleteThemeAsync(string tenantId, string themeId);

    // User authentication methods
    Task<User?> GetUserByEmailAsync(string email);
    Task UpdateUserLastLoginAsync(string userId, string tenantId);

    // User admin methods (JWT required)
    Task<List<User>> GetUsersByTenantAsync(string tenantId);
    Task<User?> GetUserAsync(string tenantId, string userId);
    Task<User> CreateUserAsync(string tenantId, User user, string password);
    Task<User> UpdateUserAsync(string tenantId, string userId, User user);
    Task<User> ResetUserPasswordAsync(string tenantId, string userId, string password);
    Task<bool> DeleteUserAsync(string tenantId, string userId);

    // FormDefinition content serving (API key required)
    Task<FormDefinition?> GetFormDefinitionPublicAsync(string apiKey, string tenantId, string type);

    // FormDefinition admin (JWT required)
    Task<FormDefinition?> GetFormDefinitionAsync(string tenantId, string formDefinitionId);
    Task<FormDefinition?> GetFormDefinitionByTypeAsync(string tenantId, string type);
    Task<List<FormDefinition>> GetFormDefinitionsByTenantAsync(string tenantId);
    Task<FormDefinition> CreateFormDefinitionAsync(string tenantId, FormDefinition formDefinition);
    Task<FormDefinition> UpdateFormDefinitionAsync(string tenantId, string formDefinitionId, FormDefinition formDefinition);
    Task<bool> DeleteFormDefinitionAsync(string tenantId, string formDefinitionId);

    // FormEntry admin (JWT required)
    Task<List<FormEntry>> GetFormEntriesByTenantAsync(string tenantId, string? type = null);
    Task<FormEntry?> GetFormEntryAsync(string tenantId, string entryId);
    Task<FormEntry> UpdateFormEntryStatusAsync(string tenantId, string entryId, string status);
}
