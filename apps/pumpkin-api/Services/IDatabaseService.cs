using pumpkin_net_models.Models;

namespace pumpkin_api.Services;

/// <summary>
/// High-level database service interface.
/// This is the main service interface used by the application.
/// </summary>
public interface IDatabaseService
{
    Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug);
    Task<Page> SavePageAsync(string apiKey, string tenantId, Page page);
    Task<Page> UpdatePageAsync(string apiKey, string tenantId, string pageSlug, Page page);
    Task<bool> DeletePageAsync(string apiKey, string tenantId, string pageSlug);
    Task<FormEntry> SaveFormEntryAsync(string apiKey, string tenantId, FormEntry formEntry);
    Task<List<string>> GetSitemapPagesAsync(string apiKey, string tenantId);
}
