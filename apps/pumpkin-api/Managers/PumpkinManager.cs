using pumpkin_api.Services;
using pumpkin_net_models.Models;

namespace pumpkin_api.Managers;

public static class PumpkinManager
{
    public static IResult GetWelcomeMessage()
    {
        return Results.Ok("🎃 Welcome to Pumpkin CMS v0.1 🎃");
    }

    public static async Task<IResult> GetPageAsync(ICosmosDbFacade cosmosDb, string apiKey, string tenantId, string pageSlug)
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

            // For bcrypt validation, we need to pass the plain API key and let the facade handle verification
            // The apiKeyHash in the database is a bcrypt hash that needs to be verified against the plain key
            var page = await cosmosDb.GetPageAsync(apiKey, tenantId, pageSlug);
            
            if (page == null)
            {
                // Could be either invalid tenant/API key or page not found
                // The facade handles tenant validation internally
                return Results.NotFound("Page not found or access denied");
            }
            
            return Results.Ok(page);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving page: {ex.Message}");
        }
    }

    public static async Task<IResult> SavePageAsync(ICosmosDbFacade cosmosDb, string apiKey, string tenantId, Page page)
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

            var savedPage = await cosmosDb.SavePageAsync(apiKey, tenantId, page);
            
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

    public static async Task<IResult> UpdatePageAsync(ICosmosDbFacade cosmosDb, string apiKey, string tenantId, string pageSlug, Page page)
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

            var updatedPage = await cosmosDb.UpdatePageAsync(apiKey, tenantId, pageSlug, page);
            
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

    public static async Task<IResult> DeletePageAsync(ICosmosDbFacade cosmosDb, string apiKey, string tenantId, string pageSlug)
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

            var deleted = await cosmosDb.DeletePageAsync(apiKey, tenantId, pageSlug);
            
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
}