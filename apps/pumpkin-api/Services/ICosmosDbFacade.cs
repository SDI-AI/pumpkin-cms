using pumpkin_net_models.Models;

namespace pumpkin_api.Services;

public interface ICosmosDbFacade
{
    Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug);
    Task<Page> SavePageAsync(string apiKey, string tenantId, Page page);
    Task<Page> UpdatePageAsync(string apiKey, string tenantId, string pageId, Page page);
}