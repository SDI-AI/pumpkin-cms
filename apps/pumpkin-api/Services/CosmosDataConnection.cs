using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using pumpkin_net_models.Models;
using System.Net;

namespace pumpkin_api.Services;

/// <summary>
/// Cosmos DB implementation of IDataConnection.
/// Handles all Cosmos DB-specific operations.
/// </summary>
public class CosmosDataConnection : IDataConnection, IDisposable
{
    private readonly CosmosClient _cosmosClient;
    private readonly Database _database;
    private readonly ILogger<CosmosDataConnection> _logger;
    private bool _disposed = false;

    public CosmosDataConnection(IOptions<CosmosDbSettings> settings, ILogger<CosmosDataConnection> logger)
    {
        _logger = logger;
        var cosmosSettings = settings.Value;

        var clientOptions = new CosmosClientOptions
        {
            MaxRetryAttemptsOnRateLimitedRequests = cosmosSettings.MaxRetryAttemptsOnRateLimitedRequests,
            MaxRetryWaitTimeOnRateLimitedRequests = TimeSpan.FromSeconds(cosmosSettings.MaxRetryWaitTimeOnRateLimitedRequests),
            Serializer = new CosmosSystemTextJsonSerializer()
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

        _logger.LogInformation("Cosmos DB Data Connection initialized for database: {DatabaseName}",
            cosmosSettings.DatabaseName);
    }

    public async Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug)
    {
        try
        {
            _logger.LogInformation("GetPageAsync called - TenantId: {TenantId}, PageSlug: '{PageSlug}'", tenantId, pageSlug);
            
            // First, validate the API key against the Tenant container
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                return null;
            }

            // If tenant is valid, proceed to get the page
            var pagesContainer = _database.GetContainer("Page");
            
            // Normalize slug to lowercase to match stored value
            var normalizedSlug = pageSlug.ToLowerInvariant();
            _logger.LogInformation("Querying with normalized slug: '{NormalizedSlug}'", normalizedSlug);
            
            // Query for page by pageSlug and tenantId (partition key)
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.pageSlug = @slug AND c.isPublished = true";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@slug", normalizedSlug)
                .WithParameter("@tenantId", tenantId);

            using var iterator = pagesContainer.GetItemQueryIterator<Page>(queryDefinition, requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(tenantId)
            });
            
            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                var page = response.FirstOrDefault();
                
                if (page != null)
                {
                    _logger.LogInformation("Page retrieved successfully - Slug: {Slug}, PageId: {PageId}, TenantId: {TenantId}, RU Cost: {RequestCharge}", 
                        normalizedSlug, page.PageId, tenantId, response.RequestCharge);
                    
                    return page;
                }
                else
                {
                    _logger.LogInformation("Page not found in results - Slug: '{Slug}', TenantId: {TenantId}, Results count: {Count}", 
                        normalizedSlug, tenantId, response.Count());
                }
            }
            
            _logger.LogInformation("No results from iterator - Slug: '{Slug}', TenantId: {TenantId}", normalizedSlug, tenantId);
            return null;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogInformation("Page not found (404) - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            return null;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving page - Slug: {Slug}, TenantId: {TenantId}, StatusCode: {StatusCode}", 
                pageSlug, tenantId, ex.StatusCode);
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

            var pagesContainer = _database.GetContainer("Page");

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

    public async Task<Page> UpdatePageAsync(string apiKey, string tenantId, string pageSlug, Page page)
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

            var pagesContainer = _database.GetContainer("Page");

            // Normalize slug to lowercase to match stored value
            var normalizedSlug = pageSlug.ToLowerInvariant();

            // First, query to find the page by slug to get the PageId
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.pageSlug = @slug";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@slug", normalizedSlug)
                .WithParameter("@tenantId", tenantId);

            using var iterator = pagesContainer.GetItemQueryIterator<Page>(queryDefinition, requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(tenantId)
            });

            Page? existingPage = null;
            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                existingPage = response.FirstOrDefault();
            }

            if (existingPage == null)
            {
                _logger.LogWarning("Page not found for update - Slug: {Slug}, TenantId: {TenantId}", normalizedSlug, tenantId);
                throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found");
            }

            // Ensure the pageSlug matches (after normalization)
            var normalizedInputSlug = page.PageSlug.ToLowerInvariant();
            if (normalizedInputSlug != normalizedSlug)
            {
                throw new ArgumentException("PageSlug in the URL must match the PageSlug in the request body");
            }

            // Preserve the PageId from the existing page
            page.PageId = existingPage.PageId;

            // Update timestamp
            page.MetaData.UpdatedAt = DateTime.UtcNow;

            // Increment version
            page.PageVersion++;

            // Replace the page
            var updateResponse = await pagesContainer.ReplaceItemAsync(page, existingPage.PageId, new PartitionKey(tenantId));

            _logger.LogInformation("Page updated successfully - Slug: {Slug}, PageId: {PageId}, TenantId: {TenantId}, Version: {Version}, RU Cost: {RequestCharge}",
                normalizedSlug, existingPage.PageId, tenantId, page.PageVersion, updateResponse.RequestCharge);

            return updateResponse.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Page not found for update - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error updating page - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating page - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw;
        }
    }

    public async Task<bool> DeletePageAsync(string apiKey, string tenantId, string pageSlug)
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

            // Ensure the pageSlug is provided
            if (string.IsNullOrEmpty(pageSlug))
            {
                throw new ArgumentException("PageSlug is required", nameof(pageSlug));
            }

            var pagesContainer = _database.GetContainer("Page");

            // Normalize slug to lowercase to match stored value
            var normalizedSlug = pageSlug.ToLowerInvariant();

            // First, query to find the page by slug to get the PageId
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.pageSlug = @slug";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@slug", normalizedSlug)
                .WithParameter("@tenantId", tenantId);

            using var iterator = pagesContainer.GetItemQueryIterator<Page>(queryDefinition, requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(tenantId)
            });

            Page? existingPage = null;
            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                existingPage = response.FirstOrDefault();
            }

            if (existingPage == null)
            {
                _logger.LogWarning("Page not found for deletion - Slug: {Slug}, TenantId: {TenantId}", normalizedSlug, tenantId);
                throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found");
            }

            // Delete the page using the PageId
            var deleteResponse = await pagesContainer.DeleteItemAsync<Page>(existingPage.PageId, new PartitionKey(tenantId));

            _logger.LogInformation("Page deleted successfully - Slug: {Slug}, PageId: {PageId}, TenantId: {TenantId}, RU Cost: {RequestCharge}",
                normalizedSlug, existingPage.PageId, tenantId, deleteResponse.RequestCharge);

            return true;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Page not found for deletion - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error deleting page - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting page - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw;
        }
    }

    public async Task<FormEntry> SaveFormEntryAsync(string apiKey, string tenantId, FormEntry formEntry)
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

            // Ensure the form entry has required fields
            if (string.IsNullOrEmpty(formEntry.Id))
            {
                formEntry.Id = Guid.NewGuid().ToString();
            }

            // Set tenant ID if not already set
            if (string.IsNullOrEmpty(formEntry.TenantId))
            {
                formEntry.TenantId = tenantId;
            }

            var formEntryContainer = _database.GetContainer("FormEntry");

            // Set timestamp
            if (formEntry.SubmittedAt == default)
            {
                formEntry.SubmittedAt = DateTime.UtcNow;
            }

            // Create the form entry
            var response = await formEntryContainer.CreateItemAsync(formEntry, new PartitionKey(tenantId));

            _logger.LogInformation("Form entry created successfully - FormEntryId: {FormEntryId}, FormId: {FormId}, TenantId: {TenantId}, RU Cost: {RequestCharge}",
                formEntry.Id, formEntry.FormId, tenantId, response.RequestCharge);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.Conflict)
        {
            _logger.LogWarning("Form entry already exists - FormEntryId: {FormEntryId}, TenantId: {TenantId}", formEntry.Id, tenantId);
            throw new InvalidOperationException($"Form entry with ID {formEntry.Id} already exists", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error creating form entry - FormEntryId: {FormEntryId}, TenantId: {TenantId}", formEntry.Id, tenantId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating form entry - FormEntryId: {FormEntryId}, TenantId: {TenantId}", formEntry.Id, tenantId);
            throw;
        }
    }

    public async Task<List<string>> GetSitemapPagesAsync(string apiKey, string tenantId)
    {
        try
        {
            _logger.LogInformation("GetSitemapPagesAsync called - TenantId: {TenantId}", tenantId);
            
            // Validate the API key against the Tenant container
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                return new List<string>();
            }

            var pagesContainer = _database.GetContainer("Page");
            
            // Query for published pages with includeInSitemap = true
            var query = "SELECT c.pageSlug FROM c WHERE c.tenantId = @tenantId AND c.isPublished = true AND c.includeInSitemap = true";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@tenantId", tenantId);

            var pageSlugs = new List<string>();
            using var iterator = pagesContainer.GetItemQueryIterator<System.Text.Json.JsonElement>(queryDefinition, requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(tenantId)
            });
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                foreach (var item in response)
                {
                    if (item.TryGetProperty("pageSlug", out var pageSlugProperty))
                    {
                        var pageSlug = pageSlugProperty.GetString();
                        if (!string.IsNullOrEmpty(pageSlug))
                        {
                            pageSlugs.Add(pageSlug);
                        }
                    }
                }
                
                _logger.LogInformation("Retrieved {Count} sitemap pages for tenant - TenantId: {TenantId}, RU Cost: {RequestCharge}", 
                    response.Count(), tenantId, response.RequestCharge);
            }
            
            _logger.LogInformation("Total sitemap pages retrieved: {Count} - TenantId: {TenantId}", pageSlugs.Count, tenantId);
            return pageSlugs;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving sitemap pages - TenantId: {TenantId}, StatusCode: {StatusCode}", 
                tenantId, ex.StatusCode);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving sitemap pages - TenantId: {TenantId}", tenantId);
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
                        _logger.LogInformation("Tenant validation successful - TenantId: {TenantId}, Name: {Name}, Plan: {Plan}, RU Cost: {RequestCharge}", 
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

    // Admin: Get tenant by ID
    public async Task<Tenant?> GetTenantAsync(string apiKey, string adminTenantId, string tenantId)
    {
        try
        {
            // Validate admin permissions
            if (!await ValidateTenantApiKeyAsync(apiKey, adminTenantId))
            {
                throw new UnauthorizedAccessException("Invalid admin credentials");
            }

            var tenantContainer = _database.GetContainer("Tenant");
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId";
            var queryDefinition = new QueryDefinition(query).WithParameter("@tenantId", tenantId);

            using var iterator = tenantContainer.GetItemQueryIterator<Tenant>(queryDefinition);
            
            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                _logger.LogInformation("GetTenant - TenantId: {TenantId}, RU Cost: {RequestCharge}", 
                    tenantId, response.RequestCharge);
                return response.FirstOrDefault();
            }
            
            return null;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving tenant - TenantId: {TenantId}", tenantId);
            throw;
        }
    }

    // Admin: Create new tenant
    public async Task<Tenant> CreateTenantAsync(string apiKey, string adminTenantId, Tenant tenant)
    {
        try
        {
            // Validate admin permissions
            if (!await ValidateTenantApiKeyAsync(apiKey, adminTenantId))
            {
                throw new UnauthorizedAccessException("Invalid admin credentials");
            }

            var tenantContainer = _database.GetContainer("Tenant");
            
            // Check if tenant already exists
            var existing = await GetTenantAsync(apiKey, adminTenantId, tenant.TenantId);
            if (existing != null)
            {
                throw new InvalidOperationException($"Tenant with ID '{tenant.TenantId}' already exists");
            }

            // Set timestamps
            tenant.CreatedAt = DateTime.UtcNow;
            tenant.UpdatedAt = DateTime.UtcNow;
            tenant.ApiKeyMeta.CreatedAt = DateTime.UtcNow;
            
            // Ensure id matches tenantId for Cosmos DB
            tenant.Id = tenant.TenantId;

            var response = await tenantContainer.CreateItemAsync(tenant, new PartitionKey(tenant.TenantId));
            
            _logger.LogInformation("Tenant created - TenantId: {TenantId}, Name: {Name}, Plan: {Plan}, RU Cost: {RequestCharge}",
                tenant.TenantId, tenant.Name, tenant.Plan, response.RequestCharge);
            
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.Conflict)
        {
            throw new InvalidOperationException($"Tenant with ID '{tenant.TenantId}' already exists");
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error creating tenant - TenantId: {TenantId}", tenant.TenantId);
            throw;
        }
    }

    // Admin: Get all tenants
    public async Task<List<Tenant>> GetAllTenantsAsync(string apiKey, string adminTenantId)
    {
        try
        {
            // Validate admin permissions
            if (!await ValidateTenantApiKeyAsync(apiKey, adminTenantId))
            {
                throw new UnauthorizedAccessException("Invalid admin credentials");
            }

            var tenantContainer = _database.GetContainer("Tenant");
            var query = "SELECT * FROM c ORDER BY c.createdAt DESC";
            var queryDefinition = new QueryDefinition(query);

            var tenants = new List<Tenant>();
            using var iterator = tenantContainer.GetItemQueryIterator<Tenant>(queryDefinition);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                tenants.AddRange(response);
                _logger.LogInformation("GetAllTenants - Retrieved {Count} tenants, RU Cost: {RequestCharge}", 
                    response.Count, response.RequestCharge);
            }
            
            _logger.LogInformation("GetAllTenants - Total tenants: {TotalCount}", tenants.Count);
            return tenants;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving all tenants");
            throw;
        }
    }

    // Admin: Get all pages (optionally filtered by tenant)
    public async Task<List<Page>> GetAllPagesAsync(string apiKey, string adminTenantId, string? tenantId = null)
    {
        try
        {
            // Validate admin permissions
            if (!await ValidateTenantApiKeyAsync(apiKey, adminTenantId))
            {
                throw new UnauthorizedAccessException("Invalid admin credentials");
            }

            var pageContainer = _database.GetContainer("Page");
            var query = string.IsNullOrEmpty(tenantId) 
                ? "SELECT * FROM c ORDER BY c.MetaData.updatedAt DESC"
                : "SELECT * FROM c WHERE c.tenantId = @tenantId ORDER BY c.MetaData.updatedAt DESC";
            
            var queryDefinition = new QueryDefinition(query);
            if (!string.IsNullOrEmpty(tenantId))
            {
                queryDefinition = queryDefinition.WithParameter("@tenantId", tenantId);
            }

            var pages = new List<Page>();
            using var iterator = pageContainer.GetItemQueryIterator<Page>(queryDefinition);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                pages.AddRange(response);
                _logger.LogInformation("GetAllPages - Retrieved {Count} pages, RU Cost: {RequestCharge}", 
                    response.Count, response.RequestCharge);
            }
            
            _logger.LogInformation("GetAllPages - Total pages: {TotalCount}, TenantFilter: {TenantId}", 
                pages.Count, tenantId ?? "all");
            return pages;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving all pages");
            throw;
        }
    }

    // Admin: Get hub pages for a tenant
    public async Task<List<Page>> GetHubPagesAsync(string apiKey, string adminTenantId, string tenantId)
    {
        try
        {
            // Validate admin permissions
            if (!await ValidateTenantApiKeyAsync(apiKey, adminTenantId))
            {
                throw new UnauthorizedAccessException("Invalid admin credentials");
            }

            var pageContainer = _database.GetContainer("Page");
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.contentRelationships.isHub = true ORDER BY c.MetaData.updatedAt DESC";
            var queryDefinition = new QueryDefinition(query).WithParameter("@tenantId", tenantId);

            var hubPages = new List<Page>();
            using var iterator = pageContainer.GetItemQueryIterator<Page>(queryDefinition);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                hubPages.AddRange(response);
                _logger.LogInformation("GetHubPages - Retrieved {Count} hub pages, RU Cost: {RequestCharge}", 
                    response.Count, response.RequestCharge);
            }
            
            _logger.LogInformation("GetHubPages - TenantId: {TenantId}, Total hubs: {TotalCount}", 
                tenantId, hubPages.Count);
            return hubPages;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving hub pages - TenantId: {TenantId}", tenantId);
            throw;
        }
    }

    // Admin: Get spoke pages for a specific hub
    public async Task<List<Page>> GetSpokePagesAsync(string apiKey, string adminTenantId, string tenantId, string hubPageSlug)
    {
        try
        {
            // Validate admin permissions
            if (!await ValidateTenantApiKeyAsync(apiKey, adminTenantId))
            {
                throw new UnauthorizedAccessException("Invalid admin credentials");
            }

            var pageContainer = _database.GetContainer("Page");
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.contentRelationships.hubPageSlug = @hubPageSlug ORDER BY c.contentRelationships.spokePriority DESC, c.MetaData.updatedAt DESC";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@tenantId", tenantId)
                .WithParameter("@hubPageSlug", hubPageSlug);

            var spokePages = new List<Page>();
            using var iterator = pageContainer.GetItemQueryIterator<Page>(queryDefinition);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                spokePages.AddRange(response);
                _logger.LogInformation("GetSpokePages - Retrieved {Count} spoke pages, RU Cost: {RequestCharge}", 
                    response.Count, response.RequestCharge);
            }
            
            _logger.LogInformation("GetSpokePages - TenantId: {TenantId}, Hub: {HubSlug}, Total spokes: {TotalCount}", 
                tenantId, hubPageSlug, spokePages.Count);
            return spokePages;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving spoke pages - TenantId: {TenantId}, Hub: {HubSlug}", tenantId, hubPageSlug);
            throw;
        }
    }

    // Admin: Get complete content hierarchy visualization
    public async Task<object> GetContentHierarchyAsync(string apiKey, string adminTenantId, string tenantId)
    {
        try
        {
            // Validate admin permissions
            if (!await ValidateTenantApiKeyAsync(apiKey, adminTenantId))
            {
                throw new UnauthorizedAccessException("Invalid admin credentials");
            }

            var pageContainer = _database.GetContainer("Page");
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId";
            var queryDefinition = new QueryDefinition(query).WithParameter("@tenantId", tenantId);

            var allPages = new List<Page>();
            using var iterator = pageContainer.GetItemQueryIterator<Page>(queryDefinition);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                allPages.AddRange(response);
            }

            // Build hierarchy structure
            var hubs = allPages.Where(p => p.ContentRelationships.IsHub).ToList();
            var orphanPages = allPages.Where(p => !p.ContentRelationships.IsHub && 
                                                   string.IsNullOrEmpty(p.ContentRelationships.HubPageSlug)).ToList();
            
            var hierarchy = new
            {
                tenantId,
                totalPages = allPages.Count,
                hubs = hubs.Select(hub => new
                {
                    pageSlug = hub.PageSlug,
                    title = hub.MetaData.Title,
                    pageType = hub.MetaData.PageType,
                    topicCluster = hub.ContentRelationships.TopicCluster,
                    isPublished = hub.IsPublished,
                    publishedAt = hub.PublishedAt,
                    spokes = allPages
                        .Where(p => p.ContentRelationships.HubPageSlug == hub.PageSlug)
                        .OrderByDescending(p => p.ContentRelationships.SpokePriority)
                        .ThenByDescending(p => p.MetaData.UpdatedAt)
                        .Select(spoke => new
                        {
                            pageSlug = spoke.PageSlug,
                            title = spoke.MetaData.Title,
                            pageType = spoke.MetaData.PageType,
                            spokePriority = spoke.ContentRelationships.SpokePriority,
                            isPublished = spoke.IsPublished,
                            publishedAt = spoke.PublishedAt,
                            city = spoke.SearchData.City,
                            metro = spoke.SearchData.Metro
                        }).ToList()
                }).ToList(),
                orphanPages = orphanPages.Select(p => new
                {
                    pageSlug = p.PageSlug,
                    title = p.MetaData.Title,
                    pageType = p.MetaData.PageType,
                    isPublished = p.IsPublished
                }).ToList(),
                clusters = allPages
                    .Where(p => !string.IsNullOrEmpty(p.ContentRelationships.TopicCluster))
                    .GroupBy(p => p.ContentRelationships.TopicCluster)
                    .Select(g => new
                    {
                        clusterName = g.Key,
                        pageCount = g.Count(),
                        hubCount = g.Count(p => p.ContentRelationships.IsHub),
                        spokeCount = g.Count(p => !p.ContentRelationships.IsHub)
                    }).ToList()
            };

            _logger.LogInformation("GetContentHierarchy - TenantId: {TenantId}, Hubs: {HubCount}, Orphans: {OrphanCount}, Clusters: {ClusterCount}",
                tenantId, hierarchy.hubs.Count, hierarchy.orphanPages.Count, hierarchy.clusters.Count);

            return hierarchy;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving content hierarchy - TenantId: {TenantId}", tenantId);
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
