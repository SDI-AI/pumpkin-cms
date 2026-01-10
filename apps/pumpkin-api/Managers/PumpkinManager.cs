using pumpkin_api.Services;
using pumpkin_net_models.Models;

namespace pumpkin_api.Managers;

public static class PumpkinManager
{
    public static IResult GetWelcomeMessage()
    {
        return Results.Ok("🎃 Welcome to Pumpkin CMS v0.2 🎃");
    }

    public static async Task<IResult> GetPageAsync(IDatabaseService databaseService, string apiKey, string tenantId, string pageSlug, ILogger? logger = null)
    {
        try
        {
            logger?.LogInformation("GetPageAsync called - TenantId: {TenantId}, PageSlug: {PageSlug}", tenantId, pageSlug);

            // Validate required parameters
            if (string.IsNullOrEmpty(apiKey))
            {
                logger?.LogWarning("GetPageAsync - Missing API key - TenantId: {TenantId}, PageSlug: {PageSlug}", tenantId, pageSlug);
                return Results.BadRequest("API key is required");
            }

            if (string.IsNullOrEmpty(tenantId))
            {
                logger?.LogWarning("GetPageAsync - Missing Tenant ID - PageSlug: {PageSlug}", pageSlug);
                return Results.BadRequest("Tenant ID is required");
            }

            if (string.IsNullOrEmpty(pageSlug))
            {
                logger?.LogWarning("GetPageAsync - Missing Page Slug - TenantId: {TenantId}", tenantId);
                return Results.BadRequest("Page slug is required");
            }

            logger?.LogInformation("Fetching page from database - TenantId: {TenantId}, PageSlug: {PageSlug}", tenantId, pageSlug);

            var page = await databaseService.GetPageAsync(apiKey, tenantId, pageSlug);

            if (page == null)
            {
                logger?.LogWarning("GetPageAsync - Page not found or access denied - TenantId: {TenantId}, PageSlug: {PageSlug}", tenantId, pageSlug);
                return Results.NotFound("Page not found or access denied");
            }

            logger?.LogInformation("GetPageAsync - Success - TenantId: {TenantId}, PageSlug: {PageSlug}, PageId: {PageId}, Title: {Title}",
                tenantId, pageSlug, page.PageId, page.MetaData.Title);

            return Results.Ok(page);
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "GetPageAsync - Error retrieving page - TenantId: {TenantId}, PageSlug: {PageSlug}", tenantId, pageSlug);
            return Results.Problem($"Error retrieving page: {ex.Message}");
        }
    }

    public static async Task<IResult> SavePageAsync(IDatabaseService databaseService, string apiKey, string tenantId, Page page)
    {
        try
        {
            // Validate required parameters
            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");
            
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            
            if (page == null)
                return Results.BadRequest("Page data is required");
            
            if (string.IsNullOrEmpty(page.PageId))
                return Results.BadRequest("Page ID is required");

            var savedPage = await databaseService.SavePageAsync(apiKey, tenantId, page);
            
            return Results.Created($"/api/pages/{tenantId}/{savedPage.PageId}", savedPage);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error saving page: {ex.Message}");
        }
    }

    public static async Task<IResult> UpdatePageAsync(IDatabaseService databaseService, string apiKey, string tenantId, string pageSlug, Page page)
    {
        try
        {
            // Validate required parameters
            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");
            
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            
            if (string.IsNullOrEmpty(pageSlug))
                return Results.BadRequest("Page slug is required");
            
            if (page == null)
                return Results.BadRequest("Page data is required");

            var updatedPage = await databaseService.UpdatePageAsync(apiKey, tenantId, pageSlug, page);
            
            return Results.Ok(updatedPage);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error updating page: {ex.Message}");
        }
    }

    public static async Task<IResult> DeletePageAsync(IDatabaseService databaseService, string apiKey, string tenantId, string pageSlug)
    {
        try
        {
            // Validate required parameters
            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");
            
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            
            if (string.IsNullOrEmpty(pageSlug))
                return Results.BadRequest("Page slug is required");

            var deleted = await databaseService.DeletePageAsync(apiKey, tenantId, pageSlug);
            
            return Results.NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error deleting page: {ex.Message}");
        }
    }

    public static async Task<IResult> SaveFormEntryAsync(IDatabaseService databaseService, string apiKey, string tenantId, FormEntry formEntry)
    {
        try
        {
            // Validate required parameters
            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");
            
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            
            if (formEntry == null)
                return Results.BadRequest("Form entry data is required");
            
            if (string.IsNullOrEmpty(formEntry.FormId))
                return Results.BadRequest("Form ID is required");

            var savedFormEntry = await databaseService.SaveFormEntryAsync(apiKey, tenantId, formEntry);
            
            return Results.Created($"/api/forms/{tenantId}/entries/{savedFormEntry.Id}", savedFormEntry);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error saving form entry: {ex.Message}");
        }
    }

    public static async Task<IResult> GetSitemapPagesAsync(IDatabaseService databaseService, string apiKey, string tenantId)
    {
        try
        {
            // Validate required parameters
            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");
            
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            var pageSlugs = await databaseService.GetSitemapPagesAsync(apiKey, tenantId);
            
            return Results.Ok(new { tenantId, pages = pageSlugs, count = pageSlugs.Count });
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving sitemap pages: {ex.Message}");
        }
    }
}