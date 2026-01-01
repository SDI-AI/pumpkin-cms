using pumpkin_api.Services;
using pumpkin_api.Managers;
using pumpkin_net_models.Models;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configure JSON serialization options for handling polymorphic HTML blocks
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new HtmlBlockBaseJsonConverter());
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Configure Cosmos DB
builder.Services.Configure<CosmosDbSettings>(
    builder.Configuration.GetSection(CosmosDbSettings.SectionName));

// Register Cosmos DB Facade as singleton for connection reuse
builder.Services.AddSingleton<ICosmosDbFacade, CosmosDbFacade>();

var app = builder.Build();

// Root endpoint
app.MapGet("/", PumpkinManager.GetWelcomeMessage);

// Main API endpoint - Get page by slug with API key authentication via Authorization header
app.MapGet("/api/pages/{tenantId}/{pageSlug}", 
    (ICosmosDbFacade cosmosDb, string tenantId, string pageSlug, HttpContext context) =>
    {
        // Extract API key from Authorization header (Bearer token format)
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }

        // Decode the pageSlug in case it's URL encoded
        var decodedPageSlug = Uri.UnescapeDataString(pageSlug);

        return PumpkinManager.GetPageAsync(cosmosDb, apiKey, tenantId, decodedPageSlug);
    })
    .WithName("GetPage")
    .WithSummary("Get a published page by slug with API key authentication via Authorization header")
    .WithDescription("Use Authorization: Bearer {apiKey} header for authentication");

// Save a new page
app.MapPost("/api/pages/{tenantId}",
    (ICosmosDbFacade cosmosDb, string tenantId, pumpkin_net_models.Models.Page page, HttpContext context) =>
    {
        // Extract API key from Authorization header (Bearer token format)
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        return PumpkinManager.SavePageAsync(cosmosDb, apiKey, tenantId, page);
    })
    .WithName("SavePage")
    .WithSummary("Create a new page with API key authentication via Authorization header")
    .WithDescription("Use Authorization: Bearer {apiKey} header for authentication");

// Update an existing page
app.MapPut("/api/pages/{tenantId}/{pageSlug}",
    (ICosmosDbFacade cosmosDb, string tenantId, string pageSlug, pumpkin_net_models.Models.Page page, HttpContext context) =>
    {
        // Extract API key from Authorization header (Bearer token format)
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        var decodedPageSlug = Uri.UnescapeDataString(pageSlug);
        return PumpkinManager.UpdatePageAsync(cosmosDb, apiKey, tenantId, decodedPageSlug, page);
    })
    .WithName("UpdatePage")
    .WithSummary("Update an existing page by slug with API key authentication via Authorization header")
    .WithDescription("Use Authorization: Bearer {apiKey} header for authentication");

// Delete a page
app.MapDelete("/api/pages/{tenantId}/{pageSlug}",
    (ICosmosDbFacade cosmosDb, string tenantId, string pageSlug, HttpContext context) =>
    {
        // Extract API key from Authorization header (Bearer token format)
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        var decodedPageSlug = Uri.UnescapeDataString(pageSlug);
        return PumpkinManager.DeletePageAsync(cosmosDb, apiKey, tenantId, decodedPageSlug);
    })
    .WithName("DeletePage")
    .WithSummary("Delete a page by slug with API key authentication via Authorization header")
    .WithDescription("Use Authorization: Bearer {apiKey} header for authentication");

app.Run();
