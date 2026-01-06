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

// Configure Database settings
builder.Services.Configure<DatabaseSettings>(
    builder.Configuration.GetSection(DatabaseSettings.SectionName));

// Configure Cosmos DB settings
builder.Services.Configure<CosmosDbSettings>(
    builder.Configuration.GetSection($"{DatabaseSettings.SectionName}:CosmosDb"));

// Configure MongoDB settings
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection($"{DatabaseSettings.SectionName}:MongoDb"));

// Register data connection implementations
builder.Services.AddSingleton<CosmosDataConnection>();
builder.Services.AddSingleton<MongoDataConnection>();

// Register the main database service (singleton for connection reuse)
builder.Services.AddSingleton<IDatabaseService, DatabaseService>();

var app = builder.Build();

// Root endpoint
app.MapGet("/", PumpkinManager.GetWelcomeMessage);

// Main API endpoint - Get page by slug with API key authentication via Authorization header
app.MapGet("/api/pages/{tenantId}/{**pageSlug}",
    async (IDatabaseService databaseService, string tenantId, string pageSlug, HttpContext context, ILogger<Program> logger) =>
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

        return await PumpkinManager.GetPageAsync(databaseService, apiKey, tenantId, decodedPageSlug, logger);
    })
    .WithName("GetPage")
    .WithSummary("Get a published page by slug with API key authentication via Authorization header")
    .WithDescription("Use Authorization: Bearer {apiKey} header for authentication");

// Save a new page
app.MapPost("/api/pages/{tenantId}",
    async (IDatabaseService databaseService, string tenantId, pumpkin_net_models.Models.Page page, HttpContext context) =>
    {
        // Extract API key from Authorization header (Bearer token format)
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        return await PumpkinManager.SavePageAsync(databaseService, apiKey, tenantId, page);
    })
    .WithName("SavePage")
    .WithSummary("Create a new page with API key authentication via Authorization header")
    .WithDescription("Use Authorization: Bearer {apiKey} header for authentication");

// Update an existing page
app.MapPut("/api/pages/{tenantId}/{**pageSlug}",
    async (IDatabaseService databaseService, string tenantId, string pageSlug, pumpkin_net_models.Models.Page page, HttpContext context) =>
    {
        // Extract API key from Authorization header (Bearer token format)
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }

        return await PumpkinManager.UpdatePageAsync(databaseService, apiKey, tenantId, pageSlug, page);
    })
    .WithName("UpdatePage")
    .WithSummary("Update an existing page by slug with API key authentication via Authorization header")
    .WithDescription("Use Authorization: Bearer {apiKey} header for authentication");

// Delete a page
app.MapDelete("/api/pages/{tenantId}/{**pageSlug}",
    async (IDatabaseService databaseService, string tenantId, string pageSlug, HttpContext context) =>
    {
        // Extract API key from Authorization header (Bearer token format)
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }

        return await PumpkinManager.DeletePageAsync(databaseService, apiKey, tenantId, pageSlug);
    })
    .WithName("DeletePage")
    .WithSummary("Delete a page by slug with API key authentication via Authorization header")
    .WithDescription("Use Authorization: Bearer {apiKey} header for authentication");

// Save a form entry
app.MapPost("/api/forms/{tenantId}/entries",
    async (IDatabaseService databaseService, string tenantId, FormEntry formEntry, HttpContext context) =>
    {
        // Extract API key from Authorization header (Bearer token format)
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        return await PumpkinManager.SaveFormEntryAsync(databaseService, apiKey, tenantId, formEntry);
    })
    .WithName("SaveFormEntry")
    .WithSummary("Submit a form entry with API key authentication via Authorization header")
    .WithDescription("Use Authorization: Bearer {apiKey} header for authentication");

app.Run();
