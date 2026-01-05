using Microsoft.Extensions.Options;
using pumpkin_net_models.Models;

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

    public void Dispose()
    {
        if (!_disposed)
        {
            // MongoDB client doesn't require explicit disposal
            _disposed = true;
        }
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

    public void Dispose()
    {
        // Nothing to dispose
    }
#endif
}
