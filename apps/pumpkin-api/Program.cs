using pumpkin_api.Services;
using pumpkin_api.Managers;
using pumpkin_net_models.Models;
using System.Text.Json.Serialization;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// Configure JSON serialization options for handling polymorphic HTML blocks
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new HtmlBlockBaseJsonConverter());
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Add Swagger/OpenAPI services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Pumpkin CMS API",
        Version = "v0.2",
        Description = "A flexible, headless CMS API for managing pages, forms, and content with multi-tenant support",
        Contact = new OpenApiContact
        {
            Name = "Pumpkin CMS",
            Url = new Uri("https://github.com/sdi-ai/pumpkin-cms")
        }
    });

    // Add API Key authentication scheme
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "API Key authorization using the Bearer scheme. Enter your API key in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "API Key"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
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

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("Jwt");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!))
        };
    });

builder.Services.AddAuthorization();

// Register data connection implementations
builder.Services.AddSingleton<CosmosDataConnection>();
builder.Services.AddSingleton<MongoDataConnection>();

// Register the main database service (singleton for connection reuse)
builder.Services.AddSingleton<IDatabaseService, DatabaseService>();

var app = builder.Build();

// Configure authentication and authorization
app.UseAuthentication();
app.UseAuthorization();

// Configure Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Pumpkin CMS API v0.2");
        options.RoutePrefix = "swagger";
        options.DocumentTitle = "Pumpkin CMS API Documentation";
        options.DefaultModelsExpandDepth(2);
        options.DefaultModelExpandDepth(2);
    });
}

// Root endpoint
app.MapGet("/", PumpkinManager.GetWelcomeMessage)
    .WithTags("General")
    .WithSummary("Welcome message")
    .WithDescription("Returns a welcome message for the Pumpkin CMS API");

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
    .WithTags("Pages")
    .WithName("GetPage")
    .WithSummary("Get a published page by slug")
    .WithDescription("Retrieves a published page by its slug for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})");

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
    .WithTags("Pages")
    .WithName("SavePage")
    .WithSummary("Create a new page")
    .WithDescription("Creates a new page for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})");

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
    .WithTags("Pages")
    .WithName("UpdatePage")
    .WithSummary("Update an existing page by slug")
    .WithDescription("Updates an existing page by its slug for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})");

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
    .WithTags("Pages")
    .WithName("DeletePage")
    .WithSummary("Delete a page by slug")
    .WithDescription("Deletes a page by its slug for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})");

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
    .WithTags("Forms")
    .WithName("SaveFormEntry")
    .WithSummary("Submit a form entry")
    .WithDescription("Submits a new form entry for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})");

// Get sitemap pages
app.MapGet("/api/tenant/{tenantId}/sitemap",
    async (IDatabaseService databaseService, string tenantId, HttpContext context) =>
    {
        // Extract API key from Authorization header (Bearer token format)
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        return await PumpkinManager.GetSitemapPagesAsync(databaseService, apiKey, tenantId);
    })
    .WithTags("Sitemap")
    .WithName("GetSitemapPages")
    .WithSummary("Get all published page slugs for sitemap generation")
    .WithDescription("Returns a list of all published page slugs where isPublished=true and includeInSitemap=true. Useful for generating XML sitemaps. Requires API key authentication via Authorization header (Bearer {apiKey})");

// ===== AUTHENTICATION ENDPOINTS =====

// Login endpoint
app.MapPost("/api/auth/login",
    async (IDatabaseService databaseService, LoginRequest request, IConfiguration configuration) =>
    {
        var user = await databaseService.GetUserByEmailAsync(request.Email);
        
        if (user == null || !user.IsActive)
        {
            return Results.Unauthorized();
        }
        
        // Verify password with BCrypt
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Results.Unauthorized();
        }
        
        // Generate JWT token
        var jwtSettings = configuration.GetSection("Jwt");
        var secretKey = new SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
        
        var credentials = new SigningCredentials(secretKey, SecurityAlgorithms.HmacSha256);
        
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("tenantId", user.TenantId)
        };
        
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"]!);
        var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);
        
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );
        
        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        
        // Update last login
        await databaseService.UpdateUserLastLoginAsync(user.Id, user.TenantId);
        
        return Results.Ok(new LoginResponse
        {
            Token = tokenString,
            ExpiresAt = expiresAt,
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                Permissions = user.Permissions
            }
        });
    })
    .WithTags("Authentication")
    .WithName("Login")
    .WithSummary("User login")
    .WithDescription("Authenticates a user with email and password, returns JWT token for subsequent requests")
    .AllowAnonymous();

// ===== ADMIN ENDPOINTS =====

// Admin: Get specific tenant
app.MapGet("/api/admin/tenants/{tenantId}",
    async (IDatabaseService databaseService, string tenantId, HttpContext context) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var adminTenantId = context.Request.Headers["X-Admin-Tenant-Id"].FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        if (string.IsNullOrEmpty(adminTenantId))
        {
            return Results.BadRequest("X-Admin-Tenant-Id header is required");
        }
        
        return await PumpkinManager.GetTenantAsync(databaseService, apiKey, adminTenantId, tenantId);
    })
    .WithTags("Admin")
    .WithName("GetTenant")
    .WithSummary("Get tenant by ID (SuperAdmin only)")
    .WithDescription("Retrieves a specific tenant by ID. Requires SuperAdmin API key via Authorization header and X-Admin-Tenant-Id header.");

// Admin: Create new tenant
app.MapPost("/api/admin/tenants",
    async (IDatabaseService databaseService, Tenant tenant, HttpContext context) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var adminTenantId = context.Request.Headers["X-Admin-Tenant-Id"].FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        if (string.IsNullOrEmpty(adminTenantId))
        {
            return Results.BadRequest("X-Admin-Tenant-Id header is required");
        }
        
        return await PumpkinManager.CreateTenantAsync(databaseService, apiKey, adminTenantId, tenant);
    })
    .WithTags("Admin")
    .WithName("CreateTenant")
    .WithSummary("Create new tenant (SuperAdmin only)")
    .WithDescription("Creates a new tenant. Requires SuperAdmin API key via Authorization header and X-Admin-Tenant-Id header.");

// Admin: Get all tenants
app.MapGet("/api/admin/tenants",
    async (IDatabaseService databaseService, HttpContext context) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var adminTenantId = context.Request.Headers["X-Admin-Tenant-Id"].FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        if (string.IsNullOrEmpty(adminTenantId))
        {
            return Results.BadRequest("X-Admin-Tenant-Id header is required");
        }
        
        return await PumpkinManager.GetAllTenantsAsync(databaseService, apiKey, adminTenantId);
    })
    .WithTags("Admin")
    .WithName("GetAllTenants")
    .WithSummary("Get all tenants (SuperAdmin only)")
    .WithDescription("Retrieves all tenants in the system. Requires SuperAdmin API key via Authorization header and X-Admin-Tenant-Id header.");

// Admin: Get all pages (optionally filtered by tenant)
app.MapGet("/api/admin/pages",
    async (IDatabaseService databaseService, HttpContext context, string? tenantId = null) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var adminTenantId = context.Request.Headers["X-Admin-Tenant-Id"].FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        if (string.IsNullOrEmpty(adminTenantId))
        {
            return Results.BadRequest("X-Admin-Tenant-Id header is required");
        }
        
        return await PumpkinManager.GetAllPagesAsync(databaseService, apiKey, adminTenantId, tenantId);
    })
    .WithTags("Admin")
    .WithName("GetAllPages")
    .WithSummary("Get all pages across tenants (SuperAdmin only)")
    .WithDescription("Retrieves all pages, optionally filtered by tenantId query parameter. Requires SuperAdmin API key via Authorization header and X-Admin-Tenant-Id header.");

// Admin: Get hub pages for a tenant
app.MapGet("/api/admin/tenants/{tenantId}/hubs",
    async (IDatabaseService databaseService, string tenantId, HttpContext context) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var adminTenantId = context.Request.Headers["X-Admin-Tenant-Id"].FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        if (string.IsNullOrEmpty(adminTenantId))
        {
            return Results.BadRequest("X-Admin-Tenant-Id header is required");
        }
        
        return await PumpkinManager.GetHubPagesAsync(databaseService, apiKey, adminTenantId, tenantId);
    })
    .WithTags("Admin")
    .WithName("GetHubPages")
    .WithSummary("Get all hub/pillar pages for a tenant (SuperAdmin only)")
    .WithDescription("Retrieves all pages marked as hubs (contentRelationships.isHub = true) for a specific tenant. Requires SuperAdmin API key via Authorization header and X-Admin-Tenant-Id header.");

// Admin: Get spoke pages for a hub
app.MapGet("/api/admin/tenants/{tenantId}/hubs/{hubPageSlug}/spokes",
    async (IDatabaseService databaseService, string tenantId, string hubPageSlug, HttpContext context) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var adminTenantId = context.Request.Headers["X-Admin-Tenant-Id"].FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        if (string.IsNullOrEmpty(adminTenantId))
        {
            return Results.BadRequest("X-Admin-Tenant-Id header is required");
        }
        
        // Decode hubPageSlug in case it's URL encoded
        var decodedHubPageSlug = Uri.UnescapeDataString(hubPageSlug);
        
        return await PumpkinManager.GetSpokePagesAsync(databaseService, apiKey, adminTenantId, tenantId, decodedHubPageSlug);
    })
    .WithTags("Admin")
    .WithName("GetSpokePages")
    .WithSummary("Get all spoke pages for a hub (SuperAdmin only)")
    .WithDescription("Retrieves all spoke/cluster pages linked to a specific hub page, ordered by spokePriority. Requires SuperAdmin API key via Authorization header and X-Admin-Tenant-Id header.");

// Admin: Get complete content hierarchy visualization
app.MapGet("/api/admin/tenants/{tenantId}/content-hierarchy",
    async (IDatabaseService databaseService, string tenantId, HttpContext context) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var adminTenantId = context.Request.Headers["X-Admin-Tenant-Id"].FirstOrDefault();
        var apiKey = string.Empty;
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }
        
        if (string.IsNullOrEmpty(adminTenantId))
        {
            return Results.BadRequest("X-Admin-Tenant-Id header is required");
        }
        
        return await PumpkinManager.GetContentHierarchyAsync(databaseService, apiKey, adminTenantId, tenantId);
    })
    .WithTags("Admin")
    .WithName("GetContentHierarchy")
    .WithSummary("Get complete content hierarchy visualization (SuperAdmin only)")
    .WithDescription("Retrieves a comprehensive view of the content architecture including hubs, spokes, clusters, and orphan pages. Perfect for visualizing internal linking structure. Requires SuperAdmin API key via Authorization header and X-Admin-Tenant-Id header.");

app.Run();
