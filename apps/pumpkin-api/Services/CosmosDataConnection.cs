using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using pumpkin_net_models.Models;
using System.Net;
using System.Security.Cryptography;
using CmsUser = pumpkin_net_models.Models.User;

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

            formEntry.TenantId = tenantId;
            formEntry.Status = FormEntryStatuses.New;
            if (string.IsNullOrWhiteSpace(formEntry.Source))
            {
                formEntry.Source = "website_form";
            }

            var formEntryContainer = _database.GetContainer("FormEntry");

            // Set timestamp
            if (formEntry.SubmittedAt == default)
            {
                formEntry.SubmittedAt = DateTime.UtcNow;
            }

            // Create the form entry
            var response = await formEntryContainer.CreateItemAsync(formEntry, new PartitionKey(tenantId));

            _logger.LogInformation("Form entry created successfully - FormEntryId: {FormEntryId}, FormDefinitionId: {FormDefinitionId}, TenantId: {TenantId}, RU Cost: {RequestCharge}",
                formEntry.Id, formEntry.FormDefinitionId, tenantId, response.RequestCharge);

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

    public async Task<List<SitemapEntry>> GetSitemapPagesAsync(string apiKey, string tenantId)
    {
        try
        {
            _logger.LogInformation("GetSitemapPagesAsync called - TenantId: {TenantId}", tenantId);
            
            // Validate the API key against the Tenant container
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                return new List<SitemapEntry>();
            }

            var pagesContainer = _database.GetContainer("Page");
            
            // Query for published pages with includeInSitemap = true, including date fields for lastmod
            var query = "SELECT c.pageSlug, c.publishedAt, c.MetaData.updatedAt FROM c WHERE c.tenantId = @tenantId AND c.isPublished = true AND c.includeInSitemap = true";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@tenantId", tenantId);

            var sitemapEntries = new List<SitemapEntry>();
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
                            // Determine last modified date: use publishedAt if available, otherwise updatedAt
                            DateTime lastModified = DateTime.UtcNow;
                            
                            if (item.TryGetProperty("publishedAt", out var publishedAtProperty) && 
                                publishedAtProperty.ValueKind != System.Text.Json.JsonValueKind.Null)
                            {
                                lastModified = publishedAtProperty.GetDateTime();
                            }
                            else if (item.TryGetProperty("updatedAt", out var updatedAtProperty) && 
                                     updatedAtProperty.ValueKind != System.Text.Json.JsonValueKind.Null)
                            {
                                lastModified = updatedAtProperty.GetDateTime();
                            }
                            
                            sitemapEntries.Add(new SitemapEntry
                            {
                                PageSlug = pageSlug,
                                LastModified = lastModified
                            });
                        }
                    }
                }
                
                _logger.LogInformation("Retrieved {Count} sitemap entries for tenant - TenantId: {TenantId}, RU Cost: {RequestCharge}", 
                    response.Count(), tenantId, response.RequestCharge);
            }
            
            _logger.LogInformation("Total sitemap entries retrieved: {Count} - TenantId: {TenantId}", sitemapEntries.Count, tenantId);
            return sitemapEntries;
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

    public async Task<List<Page>> GetPublishedSpokePagesAsync(string apiKey, string tenantId, string hubPageSlug, int limit)
    {
        try
        {
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for published spokes - TenantId: {TenantId}", tenantId);
                throw new UnauthorizedAccessException("Invalid API key or tenant ID");
            }

            if (string.IsNullOrWhiteSpace(hubPageSlug))
            {
                throw new ArgumentException("Hub page slug is required", nameof(hubPageSlug));
            }

            var safeLimit = Math.Clamp(limit <= 0 ? 12 : limit, 1, 50);
            var normalizedHubSlug = hubPageSlug.Trim().ToLowerInvariant();
            var pagesContainer = _database.GetContainer("Page");
            var query = $"SELECT TOP {safeLimit} * FROM c WHERE c.tenantId = @tenantId AND c.contentRelationships.hubPageSlug = @hubPageSlug AND c.isPublished = true AND (NOT IS_DEFINED(c.contentRelationships.isHub) OR c.contentRelationships.isHub = false) ORDER BY c.contentRelationships.spokePriority DESC, c.MetaData.updatedAt DESC";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@tenantId", tenantId)
                .WithParameter("@hubPageSlug", normalizedHubSlug);

            var spokes = new List<Page>();
            using var iterator = pagesContainer.GetItemQueryIterator<Page>(queryDefinition, requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(tenantId)
            });

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                spokes.AddRange(response);
                _logger.LogInformation("GetPublishedSpokePagesAsync - Retrieved {Count} spokes, TenantId: {TenantId}, Hub: {HubSlug}, RU: {RU}",
                    response.Count, tenantId, normalizedHubSlug, response.RequestCharge);
            }

            return spokes;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "GetPublishedSpokePagesAsync error - TenantId: {TenantId}, Hub: {HubSlug}", tenantId, hubPageSlug);
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

    // Admin: Get tenant by ID (JWT authentication required at endpoint level)
    public async Task<Tenant?> GetTenantAsync(string tenantId)
    {
        try
        {
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

    // Admin: Create new tenant (JWT authentication required at endpoint level)
    public async Task<Tenant> CreateTenantAsync(Tenant tenant)
    {
        try
        {
            var tenantContainer = _database.GetContainer("Tenant");
            
            // Check if tenant already exists
            var existing = await GetTenantAsync(tenant.TenantId);
            if (existing != null)
            {
                throw new InvalidOperationException($"Tenant with ID '{tenant.TenantId}' already exists");
            }

            // Generate a credential for legacy callers when no hash was supplied.
            // Only the hash is persisted; plaintext is returned once to the caller.
            string? generatedApiKey = null;
            if (string.IsNullOrEmpty(tenant.ApiKeyHash))
            {
                var keyBytes = RandomNumberGenerator.GetBytes(32);
                generatedApiKey = Convert.ToBase64String(keyBytes);
                tenant.ApiKeyHash = BCrypt.Net.BCrypt.HashPassword(generatedApiKey, 12);
                
                _logger.LogInformation("Generated new API key for tenant - TenantId: {TenantId}", tenant.TenantId);
            }

            tenant.ApiKey = string.Empty;

            // Set timestamps
            tenant.CreatedAt = DateTime.UtcNow;
            tenant.UpdatedAt = DateTime.UtcNow;
            tenant.ApiKeyMeta.CreatedAt = DateTime.UtcNow;
            
            // Ensure id matches tenantId for Cosmos DB
            tenant.Id = tenant.TenantId;

            var response = await tenantContainer.CreateItemAsync(tenant, new PartitionKey(tenant.TenantId));
            
            _logger.LogInformation("Tenant created - TenantId: {TenantId}, Name: {Name}, Plan: {Plan}, RU Cost: {RequestCharge}",
                tenant.TenantId, tenant.Name, tenant.Plan, response.RequestCharge);
            
            response.Resource.ApiKey = generatedApiKey ?? string.Empty;
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

    // Admin: Update tenant (JWT authentication required at endpoint level)
    public async Task<Tenant> UpdateTenantAsync(string tenantId, Tenant tenant)
    {
        try
        {
            var tenantContainer = _database.GetContainer("Tenant");
            
            // Query to check if tenant exists
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId";
            var queryDefinition = new QueryDefinition(query).WithParameter("@tenantId", tenantId);
            using var iterator = tenantContainer.GetItemQueryIterator<Tenant>(queryDefinition);
            
            Tenant? existing = null;
            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                existing = response.FirstOrDefault();
            }
            
            if (existing == null)
            {
                throw new InvalidOperationException($"Tenant with ID '{tenantId}' not found");
            }

            // Preserve server-owned credential metadata. Plaintext is never persisted.
            tenant.CreatedAt = existing.CreatedAt;
            tenant.UpdatedAt = DateTime.UtcNow;
            if (string.IsNullOrEmpty(tenant.ApiKeyHash))
            {
                tenant.ApiKeyHash = existing.ApiKeyHash;
                tenant.ApiKeyMeta = existing.ApiKeyMeta;
            }
            tenant.ApiKey = string.Empty;
            
            // Ensure id matches tenantId for Cosmos DB
            tenant.Id = tenantId;
            tenant.TenantId = tenantId;

            var replaceResponse = await tenantContainer.ReplaceItemAsync(tenant, tenant.Id, new PartitionKey(tenantId));
            
            _logger.LogInformation("Tenant updated - TenantId: {TenantId}, Name: {Name}, RU Cost: {RequestCharge}",
                tenantId, tenant.Name, replaceResponse.RequestCharge);
            
            return replaceResponse.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            throw new InvalidOperationException($"Tenant with ID '{tenantId}' not found");
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error updating tenant - TenantId: {TenantId}", tenantId);
            throw;
        }
    }

    // Admin: Delete tenant (JWT authentication required at endpoint level)
    public async Task<bool> DeleteTenantAsync(string tenantId)
    {
        try
        {
            var tenantContainer = _database.GetContainer("Tenant");
            
            // Check if tenant exists using query
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId";
            var queryDefinition = new QueryDefinition(query).WithParameter("@tenantId", tenantId);
            using var iterator = tenantContainer.GetItemQueryIterator<Tenant>(queryDefinition);
            
            if (!iterator.HasMoreResults)
            {
                _logger.LogWarning("Attempted to delete non-existent tenant - TenantId: {TenantId}", tenantId);
                return false;
            }
            
            var response = await iterator.ReadNextAsync();
            var existing = response.FirstOrDefault();
            if (existing == null)
            {
                _logger.LogWarning("Attempted to delete non-existent tenant - TenantId: {TenantId}", tenantId);
                return false;
            }

            var deleteResponse = await tenantContainer.DeleteItemAsync<Tenant>(tenantId, new PartitionKey(tenantId));
            
            _logger.LogInformation("Tenant deleted - TenantId: {TenantId}, RU Cost: {RequestCharge}",
                tenantId, deleteResponse.RequestCharge);
            
            return true;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("Tenant not found for deletion - TenantId: {TenantId}", tenantId);
            return false;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error deleting tenant - TenantId: {TenantId}", tenantId);
            throw;
        }
    }

    // Admin: Get all tenants (JWT authentication required at endpoint level)
    public async Task<List<Tenant>> GetAllTenantsAsync()
    {
        try
        {
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

    // JWT-authenticated: Get tenants for user (SuperAdmin sees all, others see only their own)
    public async Task<List<Tenant>> GetTenantsForUserAsync(string userTenantId, bool isSuperAdmin)
    {
        try
        {
            var tenantContainer = _database.GetContainer("Tenant");
            
            string query;
            QueryDefinition queryDefinition;
            
            if (isSuperAdmin)
            {
                // Platform administrators must be able to manage every lifecycle state.
                query = "SELECT * FROM c ORDER BY c.name ASC";
                queryDefinition = new QueryDefinition(query);
            }
            else
            {
                // Regular users see only their own tenant (no status filter to ensure they can see it)
                query = "SELECT * FROM c WHERE c.tenantId = @tenantId";
                queryDefinition = new QueryDefinition(query).WithParameter("@tenantId", userTenantId);
            }

            var tenants = new List<Tenant>();
            using var iterator = tenantContainer.GetItemQueryIterator<Tenant>(queryDefinition);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                tenants.AddRange(response);
                _logger.LogInformation("GetTenantsForUser - Retrieved {Count} tenants, RU Cost: {RequestCharge}", 
                    response.Count, response.RequestCharge);
            }
            
            // If no tenant found for regular user, create a minimal one for display
            if (!isSuperAdmin && tenants.Count == 0)
            {
                _logger.LogWarning("No tenant found for user tenantId: {UserTenantId}, creating minimal tenant info", userTenantId);
                tenants.Add(new Tenant
                {
                    Id = userTenantId,
                    TenantId = userTenantId,
                    Name = $"Tenant {userTenantId}",
                    Status = "active",
                    Plan = "basic",
                    ApiKeyMeta = new ApiKeyMeta { IsActive = true, CreatedAt = DateTime.UtcNow },
                    Settings = new TenantSettings(),
                    Contact = new Contact(),
                    Billing = new Billing()
                });
            }
            
            _logger.LogInformation("GetTenantsForUser - Total tenants: {TotalCount}, UserTenantId: {UserTenantId}, IsSuperAdmin: {IsSuperAdmin}", 
                tenants.Count, userTenantId, isSuperAdmin);
            return tenants;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving tenants for user: {UserTenantId}", userTenantId);
            throw;
        }
    }

    // Admin: Get all pages (optionally filtered by tenant) (JWT authentication required at endpoint level)
    public async Task<List<Page>> GetAllPagesAsync(string? tenantId = null)
    {
        try
        {
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

    // JWT-authenticated admin method: Get pages by tenant (no API key validation)
    public async Task<Page?> GetPageBySlugAsync(string tenantId, string pageSlug)
    {
        try
        {
            var pageContainer = _database.GetContainer("Page");
            var normalizedSlug = pageSlug.ToLowerInvariant();

            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.pageSlug = @slug";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@slug", normalizedSlug)
                .WithParameter("@tenantId", tenantId);

            using var iterator = pageContainer.GetItemQueryIterator<Page>(queryDefinition, requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(tenantId)
            });

            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                var page = response.FirstOrDefault();
                if (page != null)
                {
                    _logger.LogInformation("GetPageBySlugAsync - Found page - Slug: {Slug}, TenantId: {TenantId}, RU: {RU}",
                        normalizedSlug, tenantId, response.RequestCharge);
                    return page;
                }
            }

            _logger.LogInformation("GetPageBySlugAsync - Page not found - Slug: {Slug}, TenantId: {TenantId}", normalizedSlug, tenantId);
            return null;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "GetPageBySlugAsync error - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw;
        }
    }

    public async Task<List<Page>> GetPagesByTenantAsync(string tenantId)
    {
        try
        {
            var pageContainer = _database.GetContainer("Page");
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId ORDER BY c.MetaData.updatedAt DESC";
            var queryDefinition = new QueryDefinition(query).WithParameter("@tenantId", tenantId);

            var pages = new List<Page>();
            using var iterator = pageContainer.GetItemQueryIterator<Page>(queryDefinition);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                pages.AddRange(response);
                _logger.LogInformation("GetPagesByTenant - Retrieved {Count} pages, RU Cost: {RequestCharge}", 
                    response.Count, response.RequestCharge);
            }
            
            _logger.LogInformation("GetPagesByTenant - Total pages: {TotalCount}, TenantId: {TenantId}", 
                pages.Count, tenantId);
            return pages;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving pages by tenant: {TenantId}", tenantId);
            throw;
        }
    }

    // JWT-authenticated admin method: Save page (no API key validation)
    public async Task<Page> SavePageAdminAsync(string tenantId, Page page)
    {
        try
        {
            if (string.IsNullOrEmpty(page.PageId))
            {
                throw new ArgumentException("PageId is required", nameof(page));
            }

            var pagesContainer = _database.GetContainer("Page");

            // Ensure tenantId is set
            page.TenantId = tenantId;

            // Set timestamps
            if (page.MetaData.CreatedAt == default)
            {
                page.MetaData.CreatedAt = DateTime.UtcNow;
            }
            page.MetaData.UpdatedAt = DateTime.UtcNow;

            var response = await pagesContainer.CreateItemAsync(page, new PartitionKey(tenantId));

            _logger.LogInformation("SavePageAdminAsync - Page created - PageId: {PageId}, TenantId: {TenantId}, RU: {RU}",
                page.PageId, tenantId, response.RequestCharge);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.Conflict)
        {
            _logger.LogWarning("SavePageAdminAsync - Page already exists - PageId: {PageId}, TenantId: {TenantId}", page.PageId, tenantId);
            throw new InvalidOperationException($"Page with ID {page.PageId} already exists", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "SavePageAdminAsync error - PageId: {PageId}, TenantId: {TenantId}", page.PageId, tenantId);
            throw;
        }
    }

    // JWT-authenticated admin method: Update page (no API key validation)
    public async Task<Page> UpdatePageAdminAsync(string tenantId, string pageSlug, Page page)
    {
        try
        {
            var pagesContainer = _database.GetContainer("Page");
            var normalizedSlug = pageSlug.ToLowerInvariant();

            // Find existing page by slug
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
                _logger.LogWarning("UpdatePageAdminAsync - Page not found - Slug: {Slug}, TenantId: {TenantId}", normalizedSlug, tenantId);
                throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found");
            }

            // Preserve the PageId from the existing page
            page.PageId = existingPage.PageId;
            page.TenantId = tenantId;

            // Update timestamp
            page.MetaData.UpdatedAt = DateTime.UtcNow;

            // Increment version
            page.PageVersion++;

            // Replace the page
            var updateResponse = await pagesContainer.ReplaceItemAsync(page, existingPage.PageId, new PartitionKey(tenantId));

            _logger.LogInformation("UpdatePageAdminAsync - Page updated - Slug: {Slug}, PageId: {PageId}, TenantId: {TenantId}, Version: {Version}, RU: {RU}",
                normalizedSlug, existingPage.PageId, tenantId, page.PageVersion, updateResponse.RequestCharge);

            return updateResponse.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("UpdatePageAdminAsync - Page not found - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "UpdatePageAdminAsync error - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw;
        }
    }

    // JWT-authenticated admin method: Delete page (no API key validation)
    public async Task<bool> DeletePageAdminAsync(string tenantId, string pageSlug)
    {
        try
        {
            var pagesContainer = _database.GetContainer("Page");
            var normalizedSlug = pageSlug.ToLowerInvariant();
            var existingPage = await GetPageBySlugAsync(tenantId, normalizedSlug);

            if (existingPage == null)
            {
                _logger.LogWarning("DeletePageAdminAsync - Page not found - Slug: {Slug}, TenantId: {TenantId}", normalizedSlug, tenantId);
                throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found");
            }

            var deleteResponse = await pagesContainer.DeleteItemAsync<Page>(existingPage.PageId, new PartitionKey(tenantId));

            _logger.LogInformation("DeletePageAdminAsync - Page deleted - Slug: {Slug}, PageId: {PageId}, TenantId: {TenantId}, RU: {RU}",
                normalizedSlug, existingPage.PageId, tenantId, deleteResponse.RequestCharge);

            return true;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("DeletePageAdminAsync - Page not found - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "DeletePageAdminAsync error - Slug: {Slug}, TenantId: {TenantId}", pageSlug, tenantId);
            throw;
        }
    }

    // Admin: Get hub pages for a tenant (JWT authentication required at endpoint level)
    public async Task<List<Page>> GetHubPagesAsync(string tenantId)
    {
        try
        {
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

    // Admin: Get spoke pages for a specific hub (JWT authentication required at endpoint level)
    public async Task<List<Page>> GetSpokePagesAsync(string tenantId, string hubPageSlug)
    {
        try
        {
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

    // Admin: Get complete content hierarchy visualization (JWT authentication required at endpoint level)
    public async Task<object> GetContentHierarchyAsync(string tenantId)
    {
        try
        {
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

    // ===== THEME METHODS =====

    // Content serving: Get theme by ID (API key required)
    public async Task<Theme?> GetThemeAsync(string apiKey, string tenantId, string themeId)
    {
        try
        {
            // Validate API key
            var isValid = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValid)
            {
                throw new UnauthorizedAccessException("Invalid API key");
            }

            return await GetThemeAdminAsync(tenantId, themeId);
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "GetThemeAsync error - TenantId: {TenantId}, ThemeId: {ThemeId}", tenantId, themeId);
            throw;
        }
    }

    // Content serving: Get the active theme for a tenant (API key required)
    public async Task<Theme?> GetActiveThemeAsync(string apiKey, string tenantId)
    {
        try
        {
            // Validate API key
            var isValid = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValid)
            {
                throw new UnauthorizedAccessException("Invalid API key");
            }

            return await GetActiveThemeAdminAsync(tenantId);
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "GetActiveThemeAsync error - TenantId: {TenantId}", tenantId);
            throw;
        }
    }

    // Admin: Get theme by ID (JWT auth, no API key)
    public async Task<Theme?> GetThemeAdminAsync(string tenantId, string themeId)
    {
        try
        {
            var themeContainer = _database.GetContainer("Theme");
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.themeId = @themeId";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@tenantId", tenantId)
                .WithParameter("@themeId", themeId);

            using var iterator = themeContainer.GetItemQueryIterator<Theme>(queryDefinition, requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(tenantId)
            });

            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                var theme = response.FirstOrDefault();
                if (theme != null)
                {
                    _logger.LogInformation("GetThemeAdminAsync - Found theme - ThemeId: {ThemeId}, TenantId: {TenantId}, RU: {RU}",
                        themeId, tenantId, response.RequestCharge);
                }
                return theme;
            }

            return null;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "GetThemeAdminAsync error - ThemeId: {ThemeId}, TenantId: {TenantId}", themeId, tenantId);
            throw;
        }
    }

    // Admin: Get the active theme for a tenant (JWT auth, no API key)
    public async Task<Theme?> GetActiveThemeAdminAsync(string tenantId)
    {
        try
        {
            var themeContainer = _database.GetContainer("Theme");
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.isActive = true";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@tenantId", tenantId);

            using var iterator = themeContainer.GetItemQueryIterator<Theme>(queryDefinition, requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(tenantId)
            });

            if (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                var theme = response.FirstOrDefault();
                if (theme != null)
                {
                    _logger.LogInformation("GetActiveThemeAdminAsync - Found active theme - ThemeId: {ThemeId}, TenantId: {TenantId}, RU: {RU}",
                        theme.ThemeId, tenantId, response.RequestCharge);
                }
                return theme;
            }

            var tenant = await GetTenantAsync(tenantId);
            if (!string.IsNullOrWhiteSpace(tenant?.Settings?.Theme))
            {
                var configuredTheme = await GetThemeAdminAsync(tenantId, tenant.Settings.Theme);
                if (configuredTheme != null)
                {
                    return configuredTheme;
                }
            }

            return null;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "GetActiveThemeAdminAsync error - TenantId: {TenantId}", tenantId);
            throw;
        }
    }

    // Admin: Get all themes for a tenant
    public async Task<List<Theme>> GetThemesByTenantAsync(string tenantId)
    {
        try
        {
            var themeContainer = _database.GetContainer("Theme");
            var query = "SELECT * FROM c WHERE c.tenantId = @tenantId ORDER BY c.updatedAt DESC";
            var queryDefinition = new QueryDefinition(query)
                .WithParameter("@tenantId", tenantId);

            var themes = new List<Theme>();
            using var iterator = themeContainer.GetItemQueryIterator<Theme>(queryDefinition);

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                themes.AddRange(response);
                _logger.LogInformation("GetThemesByTenant - Retrieved {Count} themes, RU Cost: {RequestCharge}",
                    response.Count, response.RequestCharge);
            }

            _logger.LogInformation("GetThemesByTenant - Total themes: {TotalCount}, TenantId: {TenantId}",
                themes.Count, tenantId);
            return themes;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving themes by tenant: {TenantId}", tenantId);
            throw;
        }
    }

    // Admin: Create a new theme
    public async Task<Theme> CreateThemeAsync(string tenantId, Theme theme)
    {
        try
        {
            var themeContainer = _database.GetContainer("Theme");

            // Check for existing theme with same ID
            var existing = await GetThemeAdminAsync(tenantId, theme.ThemeId);
            if (existing != null)
            {
                throw new InvalidOperationException($"Theme with ID '{theme.ThemeId}' already exists for tenant '{tenantId}'");
            }

            theme.TenantId = tenantId;
            theme.Id = theme.ThemeId;
            ApplyThemeDefaults(theme);
            theme.CreatedAt = DateTime.UtcNow;
            theme.UpdatedAt = DateTime.UtcNow;

            var response = await themeContainer.CreateItemAsync(theme, new PartitionKey(tenantId));
            if (theme.IsActive)
            {
                return await ActivateThemeAsync(tenantId, theme.ThemeId);
            }

            _logger.LogInformation("CreateThemeAsync - Theme created - ThemeId: {ThemeId}, TenantId: {TenantId}, RU: {RU}",
                theme.ThemeId, tenantId, response.RequestCharge);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.Conflict)
        {
            throw new InvalidOperationException($"Theme with ID '{theme.ThemeId}' already exists", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "CreateThemeAsync error - ThemeId: {ThemeId}, TenantId: {TenantId}", theme.ThemeId, tenantId);
            throw;
        }
    }

    // Admin: Update an existing theme
    public async Task<Theme> UpdateThemeAsync(string tenantId, string themeId, Theme theme)
    {
        try
        {
            var themeContainer = _database.GetContainer("Theme");

            var existing = await GetThemeAdminAsync(tenantId, themeId);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Theme with ID '{themeId}' not found for tenant '{tenantId}'");
            }

            theme.ThemeId = themeId;
            theme.TenantId = tenantId;
            theme.Id = themeId;
            ApplyThemeDefaults(theme);
            theme.CreatedAt = existing.CreatedAt;
            theme.UpdatedAt = DateTime.UtcNow;

            var response = await themeContainer.ReplaceItemAsync(theme, themeId, new PartitionKey(tenantId));
            if (theme.IsActive)
            {
                return await ActivateThemeAsync(tenantId, themeId);
            }

            _logger.LogInformation("UpdateThemeAsync - Theme updated - ThemeId: {ThemeId}, TenantId: {TenantId}, RU: {RU}",
                themeId, tenantId, response.RequestCharge);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            throw new KeyNotFoundException($"Theme with ID '{themeId}' not found", ex);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "UpdateThemeAsync error - ThemeId: {ThemeId}, TenantId: {TenantId}", themeId, tenantId);
            throw;
        }
    }

    public async Task<Theme> ActivateThemeAsync(string tenantId, string themeId)
    {
        var themeContainer = _database.GetContainer("Theme");
        var activeTheme = await GetThemeAdminAsync(tenantId, themeId);
        if (activeTheme == null)
        {
            throw new KeyNotFoundException($"Theme with ID '{themeId}' not found for tenant '{tenantId}'");
        }

        var themes = await GetThemesByTenantAsync(tenantId);
        foreach (var theme in themes)
        {
            var shouldBeActive = theme.ThemeId == themeId;
            if (theme.IsActive == shouldBeActive)
            {
                continue;
            }

            theme.IsActive = shouldBeActive;
            theme.UpdatedAt = DateTime.UtcNow;
            await themeContainer.ReplaceItemAsync(theme, theme.ThemeId, new PartitionKey(tenantId));

            if (shouldBeActive)
            {
                activeTheme = theme;
            }
        }

        if (!activeTheme.IsActive)
        {
            activeTheme.IsActive = true;
            activeTheme.UpdatedAt = DateTime.UtcNow;
            var response = await themeContainer.ReplaceItemAsync(activeTheme, activeTheme.ThemeId, new PartitionKey(tenantId));
            activeTheme = response.Resource;
        }

        var tenant = await GetTenantAsync(tenantId);
        if (tenant != null)
        {
            tenant.Settings ??= new TenantSettings();
            tenant.Settings.Theme = themeId;
            tenant.UpdatedAt = DateTime.UtcNow;
            var tenantContainer = _database.GetContainer("Tenant");
            await tenantContainer.ReplaceItemAsync(tenant, tenant.Id, new PartitionKey(tenantId));
        }

        _logger.LogInformation("ActivateThemeAsync - Theme activated - ThemeId: {ThemeId}, TenantId: {TenantId}",
            themeId, tenantId);

        return activeTheme;
    }

    // Admin: Delete a theme
    public async Task<bool> DeleteThemeAsync(string tenantId, string themeId)
    {
        try
        {
            var themeContainer = _database.GetContainer("Theme");

            var existing = await GetThemeAdminAsync(tenantId, themeId);
            if (existing == null)
            {
                return false;
            }

            await themeContainer.DeleteItemAsync<Theme>(themeId, new PartitionKey(tenantId));
            if (existing.IsActive)
            {
                var tenant = await GetTenantAsync(tenantId);
                if (tenant != null && tenant.Settings?.Theme == themeId)
                {
                    tenant.Settings ??= new TenantSettings();
                    tenant.Settings.Theme = string.Empty;
                    tenant.UpdatedAt = DateTime.UtcNow;
                    var tenantContainer = _database.GetContainer("Tenant");
                    await tenantContainer.ReplaceItemAsync(tenant, tenant.Id, new PartitionKey(tenantId));
                }
            }

            _logger.LogInformation("DeleteThemeAsync - Theme deleted - ThemeId: {ThemeId}, TenantId: {TenantId}", themeId, tenantId);
            return true;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("DeleteThemeAsync - Theme not found - ThemeId: {ThemeId}, TenantId: {TenantId}", themeId, tenantId);
            return false;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "DeleteThemeAsync error - ThemeId: {ThemeId}, TenantId: {TenantId}", themeId, tenantId);
            throw;
        }
    }

    private static void ApplyThemeDefaults(Theme theme)
    {
        if (string.IsNullOrWhiteSpace(theme.Label))
        {
            theme.Label = theme.Name;
        }

        if (string.IsNullOrWhiteSpace(theme.Category))
        {
            theme.Category = theme.IsSystem ? "starter" : "custom";
        }

        theme.IsCustom = !theme.IsSystem || theme.IsCustom;

        if (theme.Preview.Palette.Count == 0)
        {
            AddPreviewColor(theme, "--background");
            AddPreviewColor(theme, "--foreground");
            AddPreviewColor(theme, "--primary");
            AddPreviewColor(theme, "--accent");
        }
    }

    private static void AddPreviewColor(Theme theme, string variableName)
    {
        if (theme.CssVariables.TryGetValue(variableName, out var value) && !string.IsNullOrWhiteSpace(value))
        {
            theme.Preview.Palette.Add(value);
        }
    }

    /// <summary>
    /// Get user by email address for authentication
    /// </summary>
    public async Task<pumpkin_net_models.Models.User?> GetUserByEmailAsync(string email)
    {
        try
        {
            var userContainer = _database.GetContainer("User");
            var normalizedEmail = email.Trim().ToLowerInvariant();
            
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.email = @email")
                .WithParameter("@email", normalizedEmail);

            var iterator = userContainer.GetItemQueryIterator<pumpkin_net_models.Models.User>(query);
            var users = new List<pumpkin_net_models.Models.User>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                users.AddRange(response);
            }

            var user = users.FirstOrDefault();
            
            _logger.LogInformation("GetUserByEmail - Email: {Email}, Found: {Found}", 
                normalizedEmail, user != null);
            
            return user;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("User not found - Email: {Email}", email);
            return null;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error retrieving user - Email: {Email}", email);
            throw;
        }
    }

    /// <summary>
    /// Update user's last login timestamp
    /// </summary>
    public async Task UpdateUserLastLoginAsync(string userId, string tenantId)
    {
        try
        {
            var userContainer = _database.GetContainer("User");
            
            // Read the user first
            var user = await userContainer.ReadItemAsync<pumpkin_net_models.Models.User>(
                userId,
                new PartitionKey(tenantId));

            // Update last login
            user.Resource.LastLogin = DateTime.UtcNow;

            // Save back to database
            await userContainer.ReplaceItemAsync(
                user.Resource,
                userId,
                new PartitionKey(tenantId));

            _logger.LogInformation("UpdateUserLastLogin - UserId: {UserId}, TenantId: {TenantId}", 
                userId, tenantId);
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogWarning("User not found for last login update - UserId: {UserId}, TenantId: {TenantId}", 
                userId, tenantId);
            throw;
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error updating user last login - UserId: {UserId}, TenantId: {TenantId}", 
                userId, tenantId);
            throw;
        }
    }

    public async Task<List<CmsUser>> GetUsersByTenantAsync(string tenantId)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.tenantId = @tenantId")
            .WithParameter("@tenantId", tenantId);

        var users = await QueryAllAsync<CmsUser>("User", query, tenantId);
        return users
            .OrderBy(user => user.Email)
            .ToList();
    }

    public async Task<CmsUser?> GetUserAsync(string tenantId, string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID is required", nameof(userId));
        }

        try
        {
            var userContainer = _database.GetContainer("User");
            var response = await userContainer.ReadItemAsync<CmsUser>(userId, new PartitionKey(tenantId));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<CmsUser> CreateUserAsync(string tenantId, CmsUser user, string password)
    {
        if (user == null)
        {
            throw new ArgumentNullException(nameof(user));
        }

        ValidateNewPassword(password);

        user.TenantId = tenantId;
        user.Email = NormalizeEmail(user.Email);
        user.Username = user.Username.Trim();

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            throw new ArgumentException("Email is required", nameof(user));
        }

        if (string.IsNullOrWhiteSpace(user.Username))
        {
            throw new ArgumentException("Username is required", nameof(user));
        }

        if (string.IsNullOrWhiteSpace(user.Id))
        {
            user.Id = Guid.NewGuid().ToString();
        }

        var existingByEmail = await GetUserByEmailAsync(user.Email);
        if (existingByEmail != null)
        {
            throw new InvalidOperationException($"User with email '{user.Email}' already exists");
        }

        var existingByUsername = await GetUserByUsernameAsync(tenantId, user.Username);
        if (existingByUsername != null)
        {
            throw new InvalidOperationException($"User with username '{user.Username}' already exists in tenant '{tenantId}'");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, 12);
        user.CreatedDate = DateTime.UtcNow;
        user.LastLogin = null;

        var userContainer = _database.GetContainer("User");
        var response = await userContainer.CreateItemAsync(user, new PartitionKey(tenantId));

        _logger.LogInformation("CreateUserAsync - User created - UserId: {UserId}, Email: {Email}, TenantId: {TenantId}, Role: {Role}, RU: {RU}",
            user.Id, user.Email, tenantId, user.Role, response.RequestCharge);

        return response.Resource;
    }

    public async Task<CmsUser> UpdateUserAsync(string tenantId, string userId, CmsUser user)
    {
        if (user == null)
        {
            throw new ArgumentNullException(nameof(user));
        }

        var existing = await GetUserAsync(tenantId, userId);
        if (existing == null)
        {
            throw new KeyNotFoundException($"User with ID '{userId}' not found");
        }

        user.Id = existing.Id;
        user.TenantId = tenantId;
        user.Email = NormalizeEmail(user.Email);
        user.Username = user.Username.Trim();
        user.PasswordHash = existing.PasswordHash;
        user.CreatedDate = existing.CreatedDate;
        user.LastLogin = existing.LastLogin;

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            throw new ArgumentException("Email is required", nameof(user));
        }

        if (string.IsNullOrWhiteSpace(user.Username))
        {
            throw new ArgumentException("Username is required", nameof(user));
        }

        var existingByEmail = await GetUserByEmailAsync(user.Email);
        if (existingByEmail != null && existingByEmail.Id != existing.Id)
        {
            throw new InvalidOperationException($"User with email '{user.Email}' already exists");
        }

        var existingByUsername = await GetUserByUsernameAsync(tenantId, user.Username);
        if (existingByUsername != null && existingByUsername.Id != existing.Id)
        {
            throw new InvalidOperationException($"User with username '{user.Username}' already exists in tenant '{tenantId}'");
        }

        var userContainer = _database.GetContainer("User");
        var response = await userContainer.ReplaceItemAsync(user, existing.Id, new PartitionKey(tenantId));

        _logger.LogInformation("UpdateUserAsync - User updated - UserId: {UserId}, Email: {Email}, TenantId: {TenantId}, Role: {Role}, RU: {RU}",
            user.Id, user.Email, tenantId, user.Role, response.RequestCharge);

        return response.Resource;
    }

    public async Task<CmsUser> ResetUserPasswordAsync(string tenantId, string userId, string password)
    {
        ValidateNewPassword(password);

        var existing = await GetUserAsync(tenantId, userId);
        if (existing == null)
        {
            throw new KeyNotFoundException($"User with ID '{userId}' not found");
        }

        existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, 12);

        var userContainer = _database.GetContainer("User");
        var response = await userContainer.ReplaceItemAsync(existing, existing.Id, new PartitionKey(tenantId));

        _logger.LogInformation("ResetUserPasswordAsync - Password reset - UserId: {UserId}, TenantId: {TenantId}, RU: {RU}",
            userId, tenantId, response.RequestCharge);

        return response.Resource;
    }

    public async Task<bool> DeleteUserAsync(string tenantId, string userId)
    {
        var existing = await GetUserAsync(tenantId, userId);
        if (existing == null)
        {
            return false;
        }

        var userContainer = _database.GetContainer("User");
        await userContainer.DeleteItemAsync<CmsUser>(existing.Id, new PartitionKey(tenantId));

        _logger.LogInformation("DeleteUserAsync - User deleted - UserId: {UserId}, TenantId: {TenantId}", userId, tenantId);

        return true;
    }

    private async Task<CmsUser?> GetUserByUsernameAsync(string tenantId, string username)
    {
        var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.username = @username")
            .WithParameter("@tenantId", tenantId)
            .WithParameter("@username", username.Trim());

        return await QuerySingleAsync<CmsUser>("User", query, tenantId);
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static void ValidateNewPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            throw new ArgumentException("Password must be at least 8 characters", nameof(password));
        }
    }

    // ===== FORM DEFINITION — content serving (API key) =====

    public async Task<FormDefinition?> GetFormDefinitionPublicAsync(string apiKey, string tenantId, string type)
    {
        var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
        if (!isValidTenant)
        {
            _logger.LogWarning("Invalid API key for form definition lookup - TenantId: {TenantId}", tenantId);
            throw new UnauthorizedAccessException("Invalid API key or tenant ID");
        }

        if (string.IsNullOrWhiteSpace(type))
        {
            throw new ArgumentException("Form type is required", nameof(type));
        }

        var normalizedType = NormalizeFormType(type);
        var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.type = @type AND c.isActive = true")
            .WithParameter("@tenantId", tenantId)
            .WithParameter("@type", normalizedType);

        return await QuerySingleAsync<FormDefinition>("FormDefinition", query, tenantId);
    }

    // ===== FORM DEFINITION — admin (JWT) =====

    public async Task<FormDefinition?> GetFormDefinitionAsync(string tenantId, string formDefinitionId)
    {
        if (string.IsNullOrWhiteSpace(formDefinitionId))
        {
            throw new ArgumentException("Form definition ID is required", nameof(formDefinitionId));
        }

        var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.tenantId = @tenantId AND (c.formDefinitionId = @formDefinitionId OR c.id = @formDefinitionId)")
            .WithParameter("@tenantId", tenantId)
            .WithParameter("@formDefinitionId", formDefinitionId);

        return await QuerySingleAsync<FormDefinition>("FormDefinition", query, tenantId);
    }

    public async Task<FormDefinition?> GetFormDefinitionByTypeAsync(string tenantId, string type)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            throw new ArgumentException("Form type is required", nameof(type));
        }

        var normalizedType = NormalizeFormType(type);
        var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.type = @type")
            .WithParameter("@tenantId", tenantId)
            .WithParameter("@type", normalizedType);

        return await QuerySingleAsync<FormDefinition>("FormDefinition", query, tenantId);
    }

    public async Task<List<FormDefinition>> GetFormDefinitionsByTenantAsync(string tenantId)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.tenantId = @tenantId")
            .WithParameter("@tenantId", tenantId);

        var definitions = await QueryAllAsync<FormDefinition>("FormDefinition", query, tenantId);
        return definitions
            .OrderByDescending(definition => definition.UpdatedAt)
            .ThenBy(definition => definition.Name)
            .ToList();
    }

    public async Task<FormDefinition> CreateFormDefinitionAsync(string tenantId, FormDefinition formDefinition)
    {
        if (formDefinition == null)
        {
            throw new ArgumentNullException(nameof(formDefinition));
        }

        if (string.IsNullOrWhiteSpace(formDefinition.Type))
        {
            throw new ArgumentException("Form type is required", nameof(formDefinition));
        }

        formDefinition.TenantId = tenantId;
        formDefinition.Type = NormalizeFormType(formDefinition.Type);
        ValidateFormDefinition(formDefinition);

        if (string.IsNullOrWhiteSpace(formDefinition.FormDefinitionId))
        {
            formDefinition.FormDefinitionId = string.IsNullOrWhiteSpace(formDefinition.Id)
                ? Guid.NewGuid().ToString()
                : formDefinition.Id;
        }

        formDefinition.Id = formDefinition.FormDefinitionId;

        var existingById = await GetFormDefinitionAsync(tenantId, formDefinition.FormDefinitionId);
        if (existingById != null)
        {
            throw new InvalidOperationException($"Form definition with ID '{formDefinition.FormDefinitionId}' already exists");
        }

        var existingByType = await GetFormDefinitionByTypeAsync(tenantId, formDefinition.Type);
        if (existingByType != null)
        {
            throw new InvalidOperationException($"Form definition with type '{formDefinition.Type}' already exists");
        }

        if (formDefinition.CreatedAt == default)
        {
            formDefinition.CreatedAt = DateTime.UtcNow;
        }

        formDefinition.UpdatedAt = DateTime.UtcNow;

        var container = _database.GetContainer("FormDefinition");
        var response = await container.CreateItemAsync(formDefinition, new PartitionKey(tenantId));

        _logger.LogInformation("CreateFormDefinitionAsync - Form definition created - FormDefinitionId: {FormDefinitionId}, Type: {Type}, TenantId: {TenantId}, RU: {RU}",
            formDefinition.FormDefinitionId, formDefinition.Type, tenantId, response.RequestCharge);

        return response.Resource;
    }

    public async Task<FormDefinition> UpdateFormDefinitionAsync(string tenantId, string formDefinitionId, FormDefinition formDefinition)
    {
        if (formDefinition == null)
        {
            throw new ArgumentNullException(nameof(formDefinition));
        }

        if (string.IsNullOrWhiteSpace(formDefinition.Type))
        {
            throw new ArgumentException("Form type is required", nameof(formDefinition));
        }

        var existing = await GetFormDefinitionAsync(tenantId, formDefinitionId);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Form definition with ID '{formDefinitionId}' not found");
        }

        var normalizedType = formDefinition.Type.Trim();
        normalizedType = NormalizeFormType(normalizedType);
        formDefinition.Type = normalizedType;
        ValidateFormDefinition(formDefinition);
        var existingByType = await GetFormDefinitionByTypeAsync(tenantId, normalizedType);
        if (existingByType != null && existingByType.FormDefinitionId != existing.FormDefinitionId)
        {
            throw new InvalidOperationException($"Form definition with type '{normalizedType}' already exists");
        }

        formDefinition.Id = existing.Id;
        formDefinition.FormDefinitionId = existing.FormDefinitionId;
        formDefinition.TenantId = tenantId;
        formDefinition.Type = normalizedType;
        formDefinition.CreatedAt = existing.CreatedAt;
        formDefinition.UpdatedAt = DateTime.UtcNow;

        var container = _database.GetContainer("FormDefinition");
        var response = await container.ReplaceItemAsync(formDefinition, existing.Id, new PartitionKey(tenantId));

        _logger.LogInformation("UpdateFormDefinitionAsync - Form definition updated - FormDefinitionId: {FormDefinitionId}, Type: {Type}, TenantId: {TenantId}, RU: {RU}",
            formDefinition.FormDefinitionId, formDefinition.Type, tenantId, response.RequestCharge);

        return response.Resource;
    }

    public async Task<bool> DeleteFormDefinitionAsync(string tenantId, string formDefinitionId)
    {
        var existing = await GetFormDefinitionAsync(tenantId, formDefinitionId);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Form definition with ID '{formDefinitionId}' not found");
        }

        var container = _database.GetContainer("FormDefinition");
        var response = await container.DeleteItemAsync<FormDefinition>(existing.Id, new PartitionKey(tenantId));

        _logger.LogInformation("DeleteFormDefinitionAsync - Form definition deleted - FormDefinitionId: {FormDefinitionId}, TenantId: {TenantId}, RU: {RU}",
            existing.FormDefinitionId, tenantId, response.RequestCharge);

        return true;
    }

    // ===== MEDIA LIBRARY — admin (JWT) =====

    public async Task<List<MediaAsset>> GetMediaAssetsByTenantAsync(string tenantId, string? folder = null, string? contentType = null)
    {
        var queryText = "SELECT * FROM c WHERE c.tenantId = @tenantId";
        if (!string.IsNullOrWhiteSpace(folder))
        {
            queryText += " AND c.folder = @folder";
        }
        if (!string.IsNullOrWhiteSpace(contentType))
        {
            queryText += " AND STARTSWITH(c.contentType, @contentType)";
        }

        var query = new QueryDefinition(queryText)
            .WithParameter("@tenantId", tenantId);

        if (!string.IsNullOrWhiteSpace(folder))
        {
            query.WithParameter("@folder", folder.Trim());
        }
        if (!string.IsNullOrWhiteSpace(contentType))
        {
            query.WithParameter("@contentType", contentType.Trim());
        }

        var assets = await QueryAllAsync<MediaAsset>("MediaAsset", query, tenantId);
        return assets
            .OrderByDescending(asset => asset.UpdatedAt)
            .ThenBy(asset => asset.FileName)
            .ToList();
    }

    public async Task<MediaAsset?> GetMediaAssetAsync(string tenantId, string mediaAssetId)
    {
        if (string.IsNullOrWhiteSpace(mediaAssetId))
        {
            throw new ArgumentException("Media asset ID is required", nameof(mediaAssetId));
        }

        var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.tenantId = @tenantId AND (c.mediaAssetId = @mediaAssetId OR c.id = @mediaAssetId)")
            .WithParameter("@tenantId", tenantId)
            .WithParameter("@mediaAssetId", mediaAssetId);

        return await QuerySingleAsync<MediaAsset>("MediaAsset", query, tenantId);
    }

    public async Task<MediaAsset> CreateMediaAssetAsync(string tenantId, MediaAsset mediaAsset)
    {
        if (mediaAsset == null)
        {
            throw new ArgumentNullException(nameof(mediaAsset));
        }

        ApplyMediaAssetDefaults(mediaAsset, tenantId);

        var existing = await GetMediaAssetAsync(tenantId, mediaAsset.MediaAssetId);
        if (existing != null)
        {
            throw new InvalidOperationException($"Media asset with ID '{mediaAsset.MediaAssetId}' already exists");
        }

        var container = _database.GetContainer("MediaAsset");
        var response = await container.CreateItemAsync(mediaAsset, new PartitionKey(tenantId));

        _logger.LogInformation("CreateMediaAssetAsync - Media asset created - MediaAssetId: {MediaAssetId}, TenantId: {TenantId}, RU: {RU}",
            mediaAsset.MediaAssetId, tenantId, response.RequestCharge);

        return response.Resource;
    }

    public async Task<MediaAsset> UpdateMediaAssetAsync(string tenantId, string mediaAssetId, MediaAsset mediaAsset)
    {
        if (mediaAsset == null)
        {
            throw new ArgumentNullException(nameof(mediaAsset));
        }

        var existing = await GetMediaAssetAsync(tenantId, mediaAssetId);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Media asset with ID '{mediaAssetId}' not found");
        }

        mediaAsset.Id = existing.Id;
        mediaAsset.MediaAssetId = existing.MediaAssetId;
        mediaAsset.TenantId = tenantId;
        mediaAsset.CreatedAt = existing.CreatedAt;
        mediaAsset.CreatedByUserId = existing.CreatedByUserId;
        mediaAsset.UpdatedAt = DateTime.UtcNow;
        NormalizeMediaAssetFields(mediaAsset);

        var container = _database.GetContainer("MediaAsset");
        var response = await container.ReplaceItemAsync(mediaAsset, existing.Id, new PartitionKey(tenantId));

        _logger.LogInformation("UpdateMediaAssetAsync - Media asset updated - MediaAssetId: {MediaAssetId}, TenantId: {TenantId}, RU: {RU}",
            existing.MediaAssetId, tenantId, response.RequestCharge);

        return response.Resource;
    }

    public async Task<bool> DeleteMediaAssetAsync(string tenantId, string mediaAssetId)
    {
        var existing = await GetMediaAssetAsync(tenantId, mediaAssetId);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Media asset with ID '{mediaAssetId}' not found");
        }

        var container = _database.GetContainer("MediaAsset");
        var response = await container.DeleteItemAsync<MediaAsset>(existing.Id, new PartitionKey(tenantId));

        _logger.LogInformation("DeleteMediaAssetAsync - Media asset deleted - MediaAssetId: {MediaAssetId}, TenantId: {TenantId}, RU: {RU}",
            existing.MediaAssetId, tenantId, response.RequestCharge);

        return true;
    }

    // ===== FORM ENTRY — admin (JWT) =====

    public async Task<List<FormEntry>> GetFormEntriesByTenantAsync(string tenantId, string? type = null)
    {
        var queryText = string.IsNullOrWhiteSpace(type)
            ? "SELECT * FROM c WHERE (c.TenantId = @tenantId OR c.tenantId = @tenantId)"
            : "SELECT * FROM c WHERE (c.TenantId = @tenantId OR c.tenantId = @tenantId) AND c.type = @type";

        var query = new QueryDefinition(queryText)
            .WithParameter("@tenantId", tenantId);

        if (!string.IsNullOrWhiteSpace(type))
        {
            query.WithParameter("@type", type.Trim());
        }

        var entries = await QueryAllAsync<FormEntry>("FormEntry", query, tenantId);
        return entries
            .OrderByDescending(entry => entry.SubmittedAt)
            .ToList();
    }

    public async Task<FormEntry?> GetFormEntryAsync(string tenantId, string entryId)
    {
        if (string.IsNullOrWhiteSpace(entryId))
        {
            throw new ArgumentException("Form entry ID is required", nameof(entryId));
        }

        var query = new QueryDefinition(
                "SELECT * FROM c WHERE (c.TenantId = @tenantId OR c.tenantId = @tenantId) AND c.id = @entryId")
            .WithParameter("@tenantId", tenantId)
            .WithParameter("@entryId", entryId);

        return await QuerySingleAsync<FormEntry>("FormEntry", query, tenantId);
    }

    public async Task<FormEntry> UpdateFormEntryStatusAsync(string tenantId, string entryId, string status)
    {
        if (string.IsNullOrWhiteSpace(status) || !FormEntryStatuses.All.Contains(status.Trim()))
        {
            throw new ArgumentException("Status must be one of: new, read, actioned, archived", nameof(status));
        }

        var existing = await GetFormEntryAsync(tenantId, entryId);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Form entry with ID '{entryId}' not found");
        }

        existing.Status = status.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;
        if (existing.Status == FormEntryStatuses.Read && existing.ReadAt == null)
        {
            existing.ReadAt = now;
        }
        else if (existing.Status == FormEntryStatuses.Actioned && existing.ActionedAt == null)
        {
            existing.ActionedAt = now;
        }
        else if (existing.Status == FormEntryStatuses.Archived && existing.ArchivedAt == null)
        {
            existing.ArchivedAt = now;
        }

        var container = _database.GetContainer("FormEntry");
        var response = await container.ReplaceItemAsync(existing, existing.Id, new PartitionKey(tenantId));

        _logger.LogInformation("UpdateFormEntryStatusAsync - Form entry status updated - EntryId: {EntryId}, Status: {Status}, TenantId: {TenantId}, RU: {RU}",
            entryId, existing.Status, tenantId, response.RequestCharge);

        return response.Resource;
    }

    private static string NormalizeFormType(string type)
    {
        return type.Trim().ToLowerInvariant();
    }

    private static void ValidateFormDefinition(FormDefinition formDefinition)
    {
        var duplicateFieldNames = formDefinition.Fields
            .Where(field => !string.IsNullOrWhiteSpace(field.Name))
            .GroupBy(field => field.Name.Trim(), StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateFieldNames.Any())
        {
            throw new ArgumentException($"Duplicate field names are not allowed: {string.Join(", ", duplicateFieldNames)}");
        }

        foreach (var field in formDefinition.Fields)
        {
            field.Name = field.Name.Trim();
            field.Type = string.IsNullOrWhiteSpace(field.Type)
                ? FormFieldTypes.Text
                : field.Type.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(field.Name))
            {
                throw new ArgumentException("Every form field must have a name");
            }

            if ((field.Type == FormFieldTypes.Select || field.Type == FormFieldTypes.Radio) &&
                (field.Options == null || field.Options.Count == 0))
            {
                throw new ArgumentException($"Field '{field.Name}' requires options");
            }
        }
    }

    private static void ApplyMediaAssetDefaults(MediaAsset mediaAsset, string tenantId)
    {
        if (string.IsNullOrWhiteSpace(mediaAsset.MediaAssetId))
        {
            mediaAsset.MediaAssetId = string.IsNullOrWhiteSpace(mediaAsset.Id)
                ? Guid.NewGuid().ToString("N")
                : mediaAsset.Id;
        }

        mediaAsset.Id = mediaAsset.MediaAssetId;
        mediaAsset.TenantId = tenantId;
        NormalizeMediaAssetFields(mediaAsset);

        if (mediaAsset.CreatedAt == default)
        {
            mediaAsset.CreatedAt = DateTime.UtcNow;
        }
        mediaAsset.UpdatedAt = DateTime.UtcNow;
    }

    private static void NormalizeMediaAssetFields(MediaAsset mediaAsset)
    {
        mediaAsset.FileName = (mediaAsset.FileName ?? string.Empty).Trim();
        mediaAsset.OriginalFileName = string.IsNullOrWhiteSpace(mediaAsset.OriginalFileName)
            ? mediaAsset.FileName
            : mediaAsset.OriginalFileName.Trim();
        mediaAsset.BlobPath = (mediaAsset.BlobPath ?? string.Empty).Trim();
        mediaAsset.PublicUrl = (mediaAsset.PublicUrl ?? string.Empty).Trim();
        mediaAsset.ContentType = (mediaAsset.ContentType ?? string.Empty).Trim().ToLowerInvariant();
        mediaAsset.Folder = (mediaAsset.Folder ?? string.Empty).Trim().Trim('/');
        mediaAsset.AltText = mediaAsset.AltText ?? string.Empty;
        mediaAsset.Caption = mediaAsset.Caption ?? string.Empty;
        mediaAsset.Source = string.IsNullOrWhiteSpace(mediaAsset.Source) ? "admin" : mediaAsset.Source.Trim();
        mediaAsset.Tags = NormalizeTags(mediaAsset.Tags);

        if (string.IsNullOrWhiteSpace(mediaAsset.FileName))
        {
            throw new ArgumentException("Media asset fileName is required", nameof(mediaAsset));
        }
        if (string.IsNullOrWhiteSpace(mediaAsset.BlobPath))
        {
            throw new ArgumentException("Media asset blobPath is required", nameof(mediaAsset));
        }
        if (string.IsNullOrWhiteSpace(mediaAsset.PublicUrl))
        {
            throw new ArgumentException("Media asset publicUrl is required", nameof(mediaAsset));
        }
    }

    private static List<string> NormalizeTags(IEnumerable<string>? tags)
    {
        return (tags ?? Enumerable.Empty<string>())
            .Select(tag => tag.Trim())
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(tag => tag)
            .ToList();
    }

    private async Task<T?> QuerySingleAsync<T>(string containerName, QueryDefinition queryDefinition, string tenantId)
    {
        var container = _database.GetContainer(containerName);
        using var iterator = container.GetItemQueryIterator<T>(queryDefinition, requestOptions: new QueryRequestOptions
        {
            PartitionKey = new PartitionKey(tenantId)
        });

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            var item = response.FirstOrDefault();
            if (item != null)
            {
                return item;
            }
        }

        return default;
    }

    private async Task<List<T>> QueryAllAsync<T>(string containerName, QueryDefinition queryDefinition, string tenantId)
    {
        var container = _database.GetContainer(containerName);
        var items = new List<T>();
        using var iterator = container.GetItemQueryIterator<T>(queryDefinition, requestOptions: new QueryRequestOptions
        {
            PartitionKey = new PartitionKey(tenantId)
        });

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            items.AddRange(response);
        }

        return items;
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
