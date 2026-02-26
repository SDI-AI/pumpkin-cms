using Microsoft.Extensions.Options;
using pumpkin_net_models.Models;
using System.Security.Cryptography;

namespace pumpkin_api.Services;

/// <summary>
/// MongoDB implementation of IDataConnection.
/// Handles all MongoDB-specific operations.
/// Note: Requires MongoDB.Driver NuGet package. Install with: dotnet add package MongoDB.Driver
/// </summary>
public class MongoDataConnection : IDataConnection, IDisposable
{
#if USE_MONGODB
    private readonly IMongoClient _mongoClient;
    private readonly IMongoDatabase _database;
    private readonly ILogger<MongoDataConnection> _logger;
    private bool _disposed = false;

    public MongoDataConnection(IOptions<MongoDbSettings> settings, ILogger<MongoDataConnection> logger)
    {
        _logger = logger;
        var mongoSettings = settings.Value;

        var clientSettings = MongoClientSettings.FromConnectionString(mongoSettings.ConnectionString);
        clientSettings.MaxConnectionPoolSize = mongoSettings.MaxConnectionPoolSize;
        clientSettings.ConnectTimeout = TimeSpan.FromMilliseconds(mongoSettings.ConnectTimeoutMs);
        clientSettings.ServerSelectionTimeout = TimeSpan.FromMilliseconds(mongoSettings.ServerSelectionTimeoutMs);

        _mongoClient = new MongoClient(clientSettings);
        _database = _mongoClient.GetDatabase(mongoSettings.DatabaseName);

        _logger.LogInformation("MongoDB Data Connection initialized for database: {DatabaseName}",
            mongoSettings.DatabaseName);
    }

    public async Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug)
    {
        try
        {
            _logger.LogInformation("GetPageAsync called - TenantId: {TenantId}, PageSlug: '{PageSlug}'", tenantId, pageSlug);
            
            // Validate the API key against the Tenant collection
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                return null;
            }

            // If tenant is valid, proceed to get the page
            var pagesCollection = _database.GetCollection<Page>("Page");
            
            // Normalize slug to lowercase to match stored value
            var normalizedSlug = pageSlug.ToLowerInvariant();
            _logger.LogInformation("Querying with normalized slug: '{NormalizedSlug}'", normalizedSlug);
            
            // Query for page by pageSlug and tenantId
            var filter = Builders<Page>.Filter.And(
                Builders<Page>.Filter.Eq(p => p.TenantId, tenantId),
                Builders<Page>.Filter.Eq(p => p.PageSlug, normalizedSlug),
                Builders<Page>.Filter.Eq(p => p.IsPublished, true)
            );

            var page = await pagesCollection.Find(filter).FirstOrDefaultAsync();
            
            if (page != null)
            {
                _logger.LogInformation("Page retrieved successfully - Slug: {Slug}, PageId: {PageId}, TenantId: {TenantId}", 
                    normalizedSlug, page.PageId, tenantId);
                return page;
            }
            
            _logger.LogInformation("Page not found - Slug: '{Slug}', TenantId: {TenantId}", normalizedSlug, tenantId);
            return null;
        }
        catch (MongoException ex)
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
            // Validate the API key against the Tenant collection
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

            var pagesCollection = _database.GetCollection<Page>("Page");

            // Check if page already exists
            var existingFilter = Builders<Page>.Filter.And(
                Builders<Page>.Filter.Eq(p => p.PageId, page.PageId),
                Builders<Page>.Filter.Eq(p => p.TenantId, tenantId)
            );
            var exists = await pagesCollection.Find(existingFilter).AnyAsync();
            
            if (exists)
            {
                _logger.LogWarning("Page already exists - PageId: {PageId}, TenantId: {TenantId}", page.PageId, tenantId);
                throw new InvalidOperationException($"Page with ID {page.PageId} already exists");
            }

            // Set timestamps
            if (page.MetaData.CreatedAt == default)
            {
                page.MetaData.CreatedAt = DateTime.UtcNow;
            }
            page.MetaData.UpdatedAt = DateTime.UtcNow;

            // Insert the page
            await pagesCollection.InsertOneAsync(page);

            _logger.LogInformation("Page created successfully - PageId: {PageId}, TenantId: {TenantId}",
                page.PageId, tenantId);

            return page;
        }
        catch (MongoException ex)
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
            // Validate the API key against the Tenant collection
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                throw new UnauthorizedAccessException("Invalid API key or tenant ID");
            }

            var pagesCollection = _database.GetCollection<Page>("Page");

            // Normalize slug to lowercase to match stored value
            var normalizedSlug = pageSlug.ToLowerInvariant();

            // Find the existing page by slug
            var findFilter = Builders<Page>.Filter.And(
                Builders<Page>.Filter.Eq(p => p.TenantId, tenantId),
                Builders<Page>.Filter.Eq(p => p.PageSlug, normalizedSlug)
            );

            var existingPage = await pagesCollection.Find(findFilter).FirstOrDefaultAsync();

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
            var replaceFilter = Builders<Page>.Filter.And(
                Builders<Page>.Filter.Eq(p => p.PageId, existingPage.PageId),
                Builders<Page>.Filter.Eq(p => p.TenantId, tenantId)
            );
            
            var result = await pagesCollection.ReplaceOneAsync(replaceFilter, page);

            if (result.ModifiedCount == 0)
            {
                _logger.LogWarning("Page update did not modify any documents - Slug: {Slug}, TenantId: {TenantId}", normalizedSlug, tenantId);
                throw new InvalidOperationException("Page update failed");
            }

            _logger.LogInformation("Page updated successfully - Slug: {Slug}, PageId: {PageId}, TenantId: {TenantId}, Version: {Version}",
                normalizedSlug, existingPage.PageId, tenantId, page.PageVersion);

            return page;
        }
        catch (MongoException ex)
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
            // Validate the API key against the Tenant collection
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

            var pagesCollection = _database.GetCollection<Page>("Page");

            // Normalize slug to lowercase to match stored value
            var normalizedSlug = pageSlug.ToLowerInvariant();

            // Delete the page by slug and tenantId
            var deleteFilter = Builders<Page>.Filter.And(
                Builders<Page>.Filter.Eq(p => p.TenantId, tenantId),
                Builders<Page>.Filter.Eq(p => p.PageSlug, normalizedSlug)
            );

            var result = await pagesCollection.DeleteOneAsync(deleteFilter);

            if (result.DeletedCount == 0)
            {
                _logger.LogWarning("Page not found for deletion - Slug: {Slug}, TenantId: {TenantId}", normalizedSlug, tenantId);
                throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found");
            }

            _logger.LogInformation("Page deleted successfully - Slug: {Slug}, TenantId: {TenantId}",
                normalizedSlug, tenantId);

            return true;
        }
        catch (MongoException ex)
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
            // Validate the API key against the Tenant collection
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

            var formEntryCollection = _database.GetCollection<FormEntry>("FormEntry");

            // Check if form entry already exists
            var existingFilter = Builders<FormEntry>.Filter.And(
                Builders<FormEntry>.Filter.Eq(f => f.Id, formEntry.Id),
                Builders<FormEntry>.Filter.Eq(f => f.TenantId, tenantId)
            );
            var exists = await formEntryCollection.Find(existingFilter).AnyAsync();
            
            if (exists)
            {
                _logger.LogWarning("Form entry already exists - FormEntryId: {FormEntryId}, TenantId: {TenantId}", formEntry.Id, tenantId);
                throw new InvalidOperationException($"Form entry with ID {formEntry.Id} already exists");
            }

            // Set timestamp
            if (formEntry.SubmittedAt == default)
            {
                formEntry.SubmittedAt = DateTime.UtcNow;
            }

            // Insert the form entry
            await formEntryCollection.InsertOneAsync(formEntry);

            _logger.LogInformation("Form entry created successfully - FormEntryId: {FormEntryId}, FormId: {FormId}, TenantId: {TenantId}",
                formEntry.Id, formEntry.FormId, tenantId);

            return formEntry;
        }
        catch (MongoException ex)
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
            
            // Validate the API key against the Tenant collection
            var isValidTenant = await ValidateTenantApiKeyAsync(apiKey, tenantId);
            if (!isValidTenant)
            {
                _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                return new List<SitemapEntry>();
            }

            var pagesCollection = _database.GetCollection<Page>("Page");
            
            // Query for published pages with includeInSitemap = true
            var filter = Builders<Page>.Filter.And(
                Builders<Page>.Filter.Eq(p => p.TenantId, tenantId),
                Builders<Page>.Filter.Eq(p => p.IsPublished, true),
                Builders<Page>.Filter.Eq(p => p.IncludeInSitemap, true)
            );

            // Project necessary fields for sitemap: pageSlug, publishedAt, and updatedAt
            var projection = Builders<Page>.Projection
                .Include(p => p.PageSlug)
                .Include(p => p.PublishedAt)
                .Include("MetaData.updatedAt");
                
            var pages = await pagesCollection.Find(filter).Project<Page>(projection).ToListAsync();
            
            var sitemapEntries = pages.Select(p => new SitemapEntry
            {
                PageSlug = p.PageSlug,
                // Use publishedAt if available, otherwise updatedAt
                LastModified = p.PublishedAt ?? p.MetaData?.UpdatedAt ?? DateTime.UtcNow
            }).ToList();
            
            _logger.LogInformation("Retrieved {Count} sitemap entries for tenant - TenantId: {TenantId}", sitemapEntries.Count, tenantId);
            return sitemapEntries;
        }
        catch (MongoException ex)
        {
            _logger.LogError(ex, "Error retrieving sitemap pages - TenantId: {TenantId}", tenantId);
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
            var tenantCollection = _database.GetCollection<Tenant>("Tenant");
            
            // Find the tenant by tenantId with active status
            var filter = Builders<Tenant>.Filter.And(
                Builders<Tenant>.Filter.Eq(t => t.TenantId, tenantId),
                Builders<Tenant>.Filter.Eq(t => t.Status, "active"),
                Builders<Tenant>.Filter.Eq(t => t.ApiKeyMeta.IsActive, true)
            );

            var tenant = await tenantCollection.Find(filter).FirstOrDefaultAsync();
            
            if (tenant != null)
            {
                // Verify the API key against the stored bcrypt hash
                var isValidKey = BCrypt.Net.BCrypt.Verify(apiKey, tenant.ApiKeyHash);
                
                if (isValidKey)
                {
                    _logger.LogInformation("Tenant validation successful - TenantId: {TenantId}, Name: {Name}, Plan: {Plan}", 
                        tenantId, tenant.Name, tenant.Plan);
                    return true;
                }
                else
                {
                    _logger.LogWarning("Invalid API key for tenant - TenantId: {TenantId}", tenantId);
                }
            }
            
            _logger.LogWarning("Tenant validation failed - TenantId: {TenantId}", tenantId);
            return false;
        }
        catch (MongoException ex)
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

    // Admin methods (JWT authentication required at endpoint level)
    public async Task<Tenant?> GetTenantAsync(string tenantId)
    {
        var tenantCollection = _database.GetCollection<Tenant>("Tenant");
        var filter = Builders<Tenant>.Filter.Eq(t => t.TenantId, tenantId);
        return await tenantCollection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<Tenant> CreateTenantAsync(Tenant tenant)
    {
        var tenantCollection = _database.GetCollection<Tenant>("Tenant");
        
        // Check if tenant exists
        var existing = await GetTenantAsync(tenant.TenantId);
        if (existing != null)
        {
            throw new InvalidOperationException($"Tenant with ID '{tenant.TenantId}' already exists");
        }

        // Generate API key and hash if not provided
        if (string.IsNullOrEmpty(tenant.ApiKey) || string.IsNullOrEmpty(tenant.ApiKeyHash))
        {
            // Generate a new random API key (32 bytes = 44 base64 characters)
            var keyBytes = RandomNumberGenerator.GetBytes(32);
            tenant.ApiKey = Convert.ToBase64String(keyBytes);
            
            // Hash the API key using BCrypt
            tenant.ApiKeyHash = BCrypt.Net.BCrypt.HashPassword(tenant.ApiKey, 12);
            
            _logger.LogInformation("Generated new API key for tenant - TenantId: {TenantId}", tenant.TenantId);
        }

        tenant.CreatedAt = DateTime.UtcNow;
        tenant.UpdatedAt = DateTime.UtcNow;
        tenant.ApiKeyMeta.CreatedAt = DateTime.UtcNow;
        tenant.Id = tenant.TenantId;

        await tenantCollection.InsertOneAsync(tenant);
        _logger.LogInformation("Tenant created - TenantId: {TenantId}", tenant.TenantId);
        
        return tenant;
    }

    public async Task<Tenant> UpdateTenantAsync(string tenantId, Tenant tenant)
    {
        var tenantCollection = _database.GetCollection<Tenant>("Tenant");
        
        // Check if tenant exists
        var filter = Builders<Tenant>.Filter.Eq(t => t.TenantId, tenantId);
        var existing = await tenantCollection.Find(filter).FirstOrDefaultAsync();
        
        if (existing == null)
        {
            throw new InvalidOperationException($"Tenant with ID '{tenantId}' not found");
        }

        tenant.CreatedAt = existing.CreatedAt;
        tenant.UpdatedAt = DateTime.UtcNow;
        tenant.Id = tenantId;
        tenant.TenantId = tenantId;
        
        if (string.IsNullOrEmpty(tenant.ApiKey))
        {
            tenant.ApiKey = existing.ApiKey;
            tenant.ApiKeyHash = existing.ApiKeyHash;
            tenant.ApiKeyMeta = existing.ApiKeyMeta;
        }

        await tenantCollection.ReplaceOneAsync(filter, tenant);
        _logger.LogInformation("Tenant updated - TenantId: {TenantId}", tenantId);
        
        return tenant;
    }

    public async Task<bool> DeleteTenantAsync(string tenantId)
    {
        var tenantCollection = _database.GetCollection<Tenant>("Tenant");
        
        var filter = Builders<Tenant>.Filter.Eq(t => t.TenantId, tenantId);
        var result = await tenantCollection.DeleteOneAsync(filter);
        
        if (result.DeletedCount > 0)
        {
            _logger.LogInformation("Tenant deleted - TenantId: {TenantId}", tenantId);
            return true;
        }
        
        _logger.LogWarning("Attempted to delete non-existent tenant - TenantId: {TenantId}", tenantId);
        return false;
    }

    public async Task<List<Tenant>> GetAllTenantsAsync()
    {
        var tenantCollection = _database.GetCollection<Tenant>("Tenant");
        var sort = Builders<Tenant>.Sort.Descending(t => t.CreatedAt);
        return await tenantCollection.Find(_ => true).Sort(sort).ToListAsync();
    }

    public async Task<List<Page>> GetAllPagesAsync(string? tenantId = null)
    {
        var pageCollection = _database.GetCollection<Page>("Page");
        var filter = string.IsNullOrEmpty(tenantId) 
            ? Builders<Page>.Filter.Empty
            : Builders<Page>.Filter.Eq(p => p.TenantId, tenantId);
        
        var sort = Builders<Page>.Sort.Descending("MetaData.updatedAt");
        return await pageCollection.Find(filter).Sort(sort).ToListAsync();
    }

    // JWT-authenticated admin method: Get pages by tenant (no API key validation)
    public async Task<Page?> GetPageBySlugAsync(string tenantId, string pageSlug)
    {
        var pageCollection = _database.GetCollection<Page>("Page");
        var normalizedSlug = pageSlug.ToLowerInvariant();
        var filter = Builders<Page>.Filter.And(
            Builders<Page>.Filter.Eq(p => p.TenantId, tenantId),
            Builders<Page>.Filter.Eq(p => p.PageSlug, normalizedSlug)
        );
        return await pageCollection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<List<Page>> GetPagesByTenantAsync(string tenantId)
    {
        var pageCollection = _database.GetCollection<Page>("Page");
        var filter = Builders<Page>.Filter.Eq(p => p.TenantId, tenantId);
        var sort = Builders<Page>.Sort.Descending("MetaData.updatedAt");
        return await pageCollection.Find(filter).Sort(sort).ToListAsync();
    }

    // JWT-authenticated: Get tenants for user (SuperAdmin sees all, others see only their own)
    public async Task<List<Tenant>> GetTenantsForUserAsync(string userTenantId, bool isSuperAdmin)
    {
        var tenantCollection = _database.GetCollection<Tenant>("Tenant");
        
        FilterDefinition<Tenant> filter;
        if (isSuperAdmin)
        {
            filter = Builders<Tenant>.Filter.Eq(t => t.Status, "active");
        }
        else
        {
            // Regular users see only their own tenant (no status filter)
            filter = Builders<Tenant>.Filter.Eq(t => t.TenantId, userTenantId);
        }
        
        var sort = Builders<Tenant>.Sort.Ascending(t => t.Name);
        var tenants = await tenantCollection.Find(filter).Sort(sort).ToListAsync();
        
        // If no tenant found for regular user, create a minimal one for display
        if (!isSuperAdmin && tenants.Count == 0)
        {
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
        
        return tenants;
    }

    // JWT-authenticated admin method: Save page (no API key validation)
    public async Task<Page> SavePageAdminAsync(string tenantId, Page page)
    {
        if (string.IsNullOrEmpty(page.PageId))
        {
            throw new ArgumentException("PageId is required", nameof(page));
        }

        var pagesCollection = _database.GetCollection<Page>("Page");

        // Check if page already exists
        var existingFilter = Builders<Page>.Filter.And(
            Builders<Page>.Filter.Eq(p => p.PageId, page.PageId),
            Builders<Page>.Filter.Eq(p => p.TenantId, tenantId)
        );
        var exists = await pagesCollection.Find(existingFilter).AnyAsync();

        if (exists)
        {
            throw new InvalidOperationException($"Page with ID {page.PageId} already exists");
        }

        page.TenantId = tenantId;
        if (page.MetaData.CreatedAt == default)
        {
            page.MetaData.CreatedAt = DateTime.UtcNow;
        }
        page.MetaData.UpdatedAt = DateTime.UtcNow;

        await pagesCollection.InsertOneAsync(page);

        _logger.LogInformation("SavePageAdminAsync - Page created - PageId: {PageId}, TenantId: {TenantId}",
            page.PageId, tenantId);

        return page;
    }

    // JWT-authenticated admin method: Update page (no API key validation)
    public async Task<Page> UpdatePageAdminAsync(string tenantId, string pageSlug, Page page)
    {
        var pagesCollection = _database.GetCollection<Page>("Page");
        var normalizedSlug = pageSlug.ToLowerInvariant();

        var findFilter = Builders<Page>.Filter.And(
            Builders<Page>.Filter.Eq(p => p.TenantId, tenantId),
            Builders<Page>.Filter.Eq(p => p.PageSlug, normalizedSlug)
        );

        var existingPage = await pagesCollection.Find(findFilter).FirstOrDefaultAsync();

        if (existingPage == null)
        {
            throw new KeyNotFoundException($"Page with slug '{pageSlug}' not found");
        }

        page.PageId = existingPage.PageId;
        page.TenantId = tenantId;
        page.MetaData.UpdatedAt = DateTime.UtcNow;
        page.PageVersion++;

        var replaceFilter = Builders<Page>.Filter.And(
            Builders<Page>.Filter.Eq(p => p.PageId, existingPage.PageId),
            Builders<Page>.Filter.Eq(p => p.TenantId, tenantId)
        );

        var result = await pagesCollection.ReplaceOneAsync(replaceFilter, page);
        if (result.ModifiedCount == 0)
        {
            throw new InvalidOperationException("Page update failed");
        }

        _logger.LogInformation("UpdatePageAdminAsync - Page updated - Slug: {Slug}, TenantId: {TenantId}, Version: {Version}",
            normalizedSlug, tenantId, page.PageVersion);

        return page;
    }

    public async Task<List<Page>> GetHubPagesAsync(string tenantId)
    {
        var pageCollection = _database.GetCollection<Page>("Page");
        var filter = Builders<Page>.Filter.And(
            Builders<Page>.Filter.Eq(p => p.TenantId, tenantId),
            Builders<Page>.Filter.Eq("contentRelationships.isHub", true)
        );
        
        var sort = Builders<Page>.Sort.Descending("MetaData.updatedAt");
        return await pageCollection.Find(filter).Sort(sort).ToListAsync();
    }

    public async Task<List<Page>> GetSpokePagesAsync(string tenantId, string hubPageSlug)
    {
        var pageCollection = _database.GetCollection<Page>("Page");
        var filter = Builders<Page>.Filter.And(
            Builders<Page>.Filter.Eq(p => p.TenantId, tenantId),
            Builders<Page>.Filter.Eq("contentRelationships.hubPageSlug", hubPageSlug)
        );
        
        var sort = Builders<Page>.Sort
            .Descending("contentRelationships.spokePriority")
            .Descending("MetaData.updatedAt");
        
        return await pageCollection.Find(filter).Sort(sort).ToListAsync();
    }

    public async Task<object> GetContentHierarchyAsync(string tenantId)
    {
        var pageCollection = _database.GetCollection<Page>("Page");
        var filter = Builders<Page>.Filter.Eq(p => p.TenantId, tenantId);
        var allPages = await pageCollection.Find(filter).ToListAsync();

        // Build hierarchy (same logic as Cosmos)
        var hubs = allPages.Where(p => p.ContentRelationships.IsHub).ToList();
        var orphanPages = allPages.Where(p => !p.ContentRelationships.IsHub && 
                                               string.IsNullOrEmpty(p.ContentRelationships.HubPageSlug)).ToList();
        
        return new
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
                spokes = allPages
                    .Where(p => p.ContentRelationships.HubPageSlug == hub.PageSlug)
                    .OrderByDescending(p => p.ContentRelationships.SpokePriority)
                    .Select(spoke => new
                    {
                        pageSlug = spoke.PageSlug,
                        title = spoke.MetaData.Title,
                        spokePriority = spoke.ContentRelationships.SpokePriority,
                        isPublished = spoke.IsPublished
                    }).ToList()
            }).ToList(),
            orphanPages = orphanPages.Select(p => new
            {
                pageSlug = p.PageSlug,
                title = p.MetaData.Title,
                isPublished = p.IsPublished
            }).ToList()
        };
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            // MongoDB client doesn't require explicit disposal
            _disposed = true;
        }
    }

    // ===== THEME METHODS =====

    // Content serving: Get theme by ID (API key required)
    public async Task<Theme?> GetThemeAsync(string apiKey, string tenantId, string themeId)
    {
        var isValid = await ValidateTenantApiKeyAsync(apiKey, tenantId);
        if (!isValid)
            throw new UnauthorizedAccessException("Invalid API key");

        return await GetThemeAdminAsync(tenantId, themeId);
    }

    // Content serving: Get active theme (API key required)
    public async Task<Theme?> GetActiveThemeAsync(string apiKey, string tenantId)
    {
        var isValid = await ValidateTenantApiKeyAsync(apiKey, tenantId);
        if (!isValid)
            throw new UnauthorizedAccessException("Invalid API key");

        return await GetActiveThemeAdminAsync(tenantId);
    }

    // Admin: Get theme by ID (JWT auth, no API key)
    public async Task<Theme?> GetThemeAdminAsync(string tenantId, string themeId)
    {
        var themeCollection = _database.GetCollection<Theme>("Theme");
        var filter = Builders<Theme>.Filter.And(
            Builders<Theme>.Filter.Eq(t => t.TenantId, tenantId),
            Builders<Theme>.Filter.Eq(t => t.ThemeId, themeId)
        );
        return await themeCollection.Find(filter).FirstOrDefaultAsync();
    }

    // Admin: Get active theme (JWT auth, no API key)
    public async Task<Theme?> GetActiveThemeAdminAsync(string tenantId)
    {
        var themeCollection = _database.GetCollection<Theme>("Theme");
        var filter = Builders<Theme>.Filter.And(
            Builders<Theme>.Filter.Eq(t => t.TenantId, tenantId),
            Builders<Theme>.Filter.Eq(t => t.IsActive, true)
        );
        return await themeCollection.Find(filter).FirstOrDefaultAsync();
    }

    // Admin: Get all themes for a tenant
    public async Task<List<Theme>> GetThemesByTenantAsync(string tenantId)
    {
        var themeCollection = _database.GetCollection<Theme>("Theme");
        var filter = Builders<Theme>.Filter.Eq(t => t.TenantId, tenantId);
        var sort = Builders<Theme>.Sort.Descending(t => t.UpdatedAt);
        return await themeCollection.Find(filter).Sort(sort).ToListAsync();
    }

    // Admin: Create a new theme
    public async Task<Theme> CreateThemeAsync(string tenantId, Theme theme)
    {
        var themeCollection = _database.GetCollection<Theme>("Theme");

        var existing = await GetThemeAdminAsync(tenantId, theme.ThemeId);
        if (existing != null)
            throw new InvalidOperationException($"Theme with ID '{theme.ThemeId}' already exists for tenant '{tenantId}'");

        theme.TenantId = tenantId;
        theme.Id = theme.ThemeId;
        theme.CreatedAt = DateTime.UtcNow;
        theme.UpdatedAt = DateTime.UtcNow;

        await themeCollection.InsertOneAsync(theme);
        _logger.LogInformation("CreateThemeAsync - Theme created - ThemeId: {ThemeId}, TenantId: {TenantId}", theme.ThemeId, tenantId);

        return theme;
    }

    // Admin: Update an existing theme
    public async Task<Theme> UpdateThemeAsync(string tenantId, string themeId, Theme theme)
    {
        var themeCollection = _database.GetCollection<Theme>("Theme");

        var filter = Builders<Theme>.Filter.And(
            Builders<Theme>.Filter.Eq(t => t.TenantId, tenantId),
            Builders<Theme>.Filter.Eq(t => t.ThemeId, themeId)
        );
        var existing = await themeCollection.Find(filter).FirstOrDefaultAsync();

        if (existing == null)
            throw new KeyNotFoundException($"Theme with ID '{themeId}' not found for tenant '{tenantId}'");

        theme.ThemeId = themeId;
        theme.TenantId = tenantId;
        theme.Id = themeId;
        theme.CreatedAt = existing.CreatedAt;
        theme.UpdatedAt = DateTime.UtcNow;

        await themeCollection.ReplaceOneAsync(filter, theme);
        _logger.LogInformation("UpdateThemeAsync - Theme updated - ThemeId: {ThemeId}, TenantId: {TenantId}", themeId, tenantId);

        return theme;
    }

    // Admin: Delete a theme
    public async Task<bool> DeleteThemeAsync(string tenantId, string themeId)
    {
        var themeCollection = _database.GetCollection<Theme>("Theme");
        var filter = Builders<Theme>.Filter.And(
            Builders<Theme>.Filter.Eq(t => t.TenantId, tenantId),
            Builders<Theme>.Filter.Eq(t => t.ThemeId, themeId)
        );

        var result = await themeCollection.DeleteOneAsync(filter);

        if (result.DeletedCount > 0)
        {
            _logger.LogInformation("DeleteThemeAsync - Theme deleted - ThemeId: {ThemeId}, TenantId: {TenantId}", themeId, tenantId);
            return true;
        }

        return false;
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        var collection = _database.GetCollection<User>("User");
        var filter = Builders<User>.Filter.Eq(u => u.Email, email);
        var user = await collection.Find(filter).FirstOrDefaultAsync();
        
        _logger.LogInformation("GetUserByEmail - Email: {Email}, Found: {Found}", 
            email, user != null);
        
        return user;
    }

    public async Task UpdateUserLastLoginAsync(string userId, string tenantId)
    {
        var collection = _database.GetCollection<User>("User");
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.Id, userId),
            Builders<User>.Filter.Eq(u => u.TenantId, tenantId));
        
        var update = Builders<User>.Update.Set(u => u.LastLogin, DateTime.UtcNow);
        await collection.UpdateOneAsync(filter, update);
        
        _logger.LogInformation("UpdateUserLastLogin - UserId: {UserId}, TenantId: {TenantId}", 
            userId, tenantId);
    }
#else
    private readonly ILogger<MongoDataConnection> _logger;

    public MongoDataConnection(IOptions<MongoDbSettings> settings, ILogger<MongoDataConnection> logger)
    {
        _logger = logger;
        _logger.LogWarning("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Page> SavePageAsync(string apiKey, string tenantId, Page page)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Page> UpdatePageAsync(string apiKey, string tenantId, string pageSlug, Page page)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<bool> DeletePageAsync(string apiKey, string tenantId, string pageSlug)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<FormEntry> SaveFormEntryAsync(string apiKey, string tenantId, FormEntry formEntry)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<List<SitemapEntry>> GetSitemapPagesAsync(string apiKey, string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Tenant?> GetTenantAsync(string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Tenant> CreateTenantAsync(Tenant tenant)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Tenant> UpdateTenantAsync(string tenantId, Tenant tenant)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<bool> DeleteTenantAsync(string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<List<Tenant>> GetAllTenantsAsync()
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<List<Page>> GetAllPagesAsync(string? tenantId = null)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Page?> GetPageBySlugAsync(string tenantId, string pageSlug)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<List<Page>> GetPagesByTenantAsync(string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<List<Tenant>> GetTenantsForUserAsync(string userTenantId, bool isSuperAdmin)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Page> SavePageAdminAsync(string tenantId, Page page)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Page> UpdatePageAdminAsync(string tenantId, string pageSlug, Page page)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<List<Page>> GetHubPagesAsync(string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<List<Page>> GetSpokePagesAsync(string tenantId, string hubPageSlug)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<object> GetContentHierarchyAsync(string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<User?> GetUserByEmailAsync(string email)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task UpdateUserLastLoginAsync(string userId, string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Theme?> GetThemeAsync(string apiKey, string tenantId, string themeId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Theme?> GetActiveThemeAsync(string apiKey, string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Theme?> GetThemeAdminAsync(string tenantId, string themeId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Theme?> GetActiveThemeAdminAsync(string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<List<Theme>> GetThemesByTenantAsync(string tenantId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Theme> CreateThemeAsync(string tenantId, Theme theme)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<Theme> UpdateThemeAsync(string tenantId, string themeId, Theme theme)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public Task<bool> DeleteThemeAsync(string tenantId, string themeId)
    {
        throw new NotSupportedException("MongoDB support is not enabled. Install MongoDB.Driver package and define USE_MONGODB to enable MongoDB support.");
    }

    public void Dispose()
    {
        // Nothing to dispose
    }
#endif
}
