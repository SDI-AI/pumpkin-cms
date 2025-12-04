using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using pumpkin_api.Models;
using pumpkin_net_models.Models;
using System.Net;

namespace pumpkin_api.Services;

public class CosmosDbFacade : ICosmosDbFacade, IDisposable
{
    private readonly CosmosClient _cosmosClient;
    private readonly Database _database;
    private readonly ILogger<CosmosDbFacade> _logger;
    private bool _disposed = false;

    public CosmosDbFacade(IOptions<CosmosDbSettings> settings, ILogger<CosmosDbFacade> logger)
    {
        _logger = logger;
        var cosmosSettings = settings.Value;

        var clientOptions = new CosmosClientOptions
        {
            MaxRetryAttemptsOnRateLimitedRequests = cosmosSettings.MaxRetryAttemptsOnRateLimitedRequests,
            MaxRetryWaitTimeOnRateLimitedRequests = TimeSpan.FromSeconds(cosmosSettings.MaxRetryWaitTimeOnRateLimitedRequests),
            SerializerOptions = new CosmosSerializationOptions
            {
                PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
            }
        };

        // Add preferred regions if specified
        if (!string.IsNullOrEmpty(cosmosSettings.PreferredRegions))
        {
            var regions = cosmosSettings.PreferredRegions.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(r => r.Trim()).ToList();
            clientOptions.ApplicationPreferredRegions = regions;
        }

        _cosmosClient = new CosmosClient(cosmosSettings.ConnectionString, clientOptions);
        _database = _cosmosClient.GetDatabase(cosmosSettings.DatabaseName);

        _logger.LogInformation("Cosmos DB Facade initialized for database: {DatabaseName}",
            cosmosSettings.DatabaseName);
    }

    public async Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug)
    {
        try
        {
            // First, validate the API key against the Tenant container
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                return null;
            }

            // If tenant is valid, proceed to get the page
            var pagesContainer = _database.GetContainer("Pages");
            
            // Query for page by slug and tenantId (no need to check apiKey again since we validated the tenant)
            var query = "SELECT * FROM c WHERE c.slug = @slug AND c.tenantId = @tenantId AND c.status = 'published'";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@slug", pageSlug)
                .WithParameter("@tenantId", tenantId);

            using var iterator = pagesContainer.GetItemQueryIterator<ContentItem>(queryDefinition);
            
            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                var contentItem = response.FirstOrDefault();
                
                if (contentItem != null)
                {
                    _logger.LogDebug("Page retrieved successfully - Slug: {Slug}, TenantId: {TenantId}, RU Cost: {RequestCharge}", 
                        pageSlug, tenantId, response.RequestCharge);
                    
                    // Convert ContentItem to Page
                    var page = System.Text.Json.JsonSerializer.Deserialize<Page>(contentItem.Content);
                    return page;
                }
                else
                {
                    _logger.LogDebug("Page not found - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
                }
            }
            
            return null;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogDebug("Page not found - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            return null;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving page - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving page - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw;
        }
    }

    public async Task<Page> SavePageAsync(string apiKey, string tenantId, Page page)
    {
        try
        {
            // Validate the API key against the Tenant container
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                throw new UnauthorizedAccessException("Invalid API key or tenant ID");
            }

            // Ensure the page has required fields
            if (string.IsNullOrEmpty(page.PageId))
            {
                throw new ArgumentException("PageId is required", nameof(page));
            }

            var pagesContainer = _database.GetContainer("Pages");

            // Set timestamps
            if (page.MetaData.CreatedAt == default)
            {
                page.MetaData.CreatedAt = DateTime.UtcNow;
            }
            page.MetaData.UpdatedAt = DateTime.UtcNow;

            // Create the page
            var response = await pagesContainer.CreateItemAsync(page, new PartitionKey(tenantId));

            _logger.LogInformation("Page created successfully - PageId: {PageId}, TenantId: {TenantId}, RU Cost: {RequestCharge}",
                page.PageId, tenantId, response.RequestCharge);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.Conflict)
        {
            _logger.LogWarning("Page already exists - PageId: {PageId}, TenantId: {TenantId}", page.PageId, tenantId);
            throw new InvalidOperationException($"Page with ID {page.PageId} already exists", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error creating page - PageId: {PageId}, TenantId: {TenantId}", page.PageId, tenantId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating page - PageId: {PageId}, TenantId: {TenantId}", page.PageId, tenantId);
            throw;
        }
    }

    public async Task<Page> UpdatePageAsync(string apiKey, string tenantId, string pageId, Page page)
    {
        try
        {
            // Validate the API key against the Tenant container
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                throw new UnauthorizedAccessException("Invalid API key or tenant ID");
            }

            var pagesContainer = _database.GetContainer("Pages");

            // Ensure PageId matches
            if (page.PageId != pageId)
            {
                throw new ArgumentException("PageId in the URL must match the PageId in the request body");
            }

            // Update timestamp
            page.MetaData.UpdatedAt = DateTime.UtcNow;

            // Increment version
            page.PageVersion++;

            // Replace the page
            var response = await pagesContainer.ReplaceItemAsync(page, pageId, new PartitionKey(tenantId));

            _logger.LogInformation("Page updated successfully - PageId: {PageId}, TenantId: {TenantId}, Version: {Version}, RU Cost: {RequestCharge}",
                pageId, tenantId, page.PageVersion, response.RequestCharge);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Page not found for update - PageId: {PageId}, TenantId: {TenantId}", pageId, tenantId);
            throw new KeyNotFoundException($"Page with ID {pageId} not found", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error updating page - PageId: {PageId}, TenantId: {TenantId}", pageId, tenantId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating page - PageId: {PageId}, TenantId: {TenantId}", pageId, tenantId);
            throw;
        }
    }

    private async Task<bool> ValidateTenantApiKeyAsync(string apiKey, string tenantId)
    {
        try
        {
            var tenantContainer = _database.GetContainer("Tenant");
            
            // First get the tenant by tenantId to retrieve the stored hash
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = 'active' AND c.apiKeyMeta.isActive = true";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@tenantId", tenantId);

            using var iterator = tenantContainer.GetItemQueryIterator<Tenant>(queryDefinition);
            
            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                var tenant = response.FirstOrDefault();
                
                if (tenant != null)
                {
                    // Verify the API key against the stored bcrypt hash
                    var isValidKey = BCrypt.Net.BCrypt.Verify(apiKey, tenant.ApiKeyHash);
                    
                    if (isValidKey)
                    {
                        _logger.LogDebug("Tenant validation successful - TenantId: {TenantId}, Name: {Name}, Plan: {Plan}, RU Cost: {RequestCharge}", 
                            tenantId, tenant.Name, tenant.Plan, response.RequestCharge);
                        return true;
                    }
                    else
                    {
                        _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                    }
                }
            }
            
            _logger.LogWarning("Tenant validation failed - TenantId: {TenantId}", tenantId);
            return false;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Tenant container or tenant not found - TenantId: {TenantId}", tenantId);
            return false;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error validating tenant - TenantId: {TenantId}", tenantId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error validating tenant - TenantId: {TenantId}", tenantId);
            throw;
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _cosmosClient?.Dispose();
            _disposed = true;
        }
    }
}