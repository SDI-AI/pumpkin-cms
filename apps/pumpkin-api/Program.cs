using pumpkin_api.Services;
using pumpkin_api.Managers;
using pumpkin_net_models.Models;
using System.Text.Json.Serialization;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Cors.Infrastructure;

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

// Configure CORS
// Admin/auth routes use the "AllowAll" policy (access is controlled by JWT).
// Content routes use the "TenantCors" policy, which resolves per-tenant allowed origins from the database.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});
builder.Services.AddSingleton<ICorsPolicyProvider, TenantCorsPolicyProvider>();

// Register data connection implementations
builder.Services.AddSingleton<CosmosDataConnection>();
builder.Services.AddSingleton<MongoDataConnection>();

// Register the main database service (singleton for connection reuse)
builder.Services.AddSingleton<IDatabaseService, DatabaseService>();

var app = builder.Build();

// Configure CORS (must be before authentication/authorization).
// "AllowAll" is the default for admin/auth routes; content routes override with "TenantCors".
app.UseCors("AllowAll");

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
    .WithDescription("Retrieves a published page by its slug for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

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
    .WithDescription("Creates a new page for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

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
    .WithDescription("Updates an existing page by its slug for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

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
    .WithDescription("Deletes a page by its slug for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

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
    .WithDescription("Submits a new form entry for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

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
    .WithDescription("Returns a list of all published page slugs where isPublished=true and includeInSitemap=true. Useful for generating XML sitemaps. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

// ===== CONTENT SERVING: THEME ENDPOINTS =====

// Get the active theme for a tenant (public, API key required)
app.MapGet("/api/themes/{tenantId}",
    async (IDatabaseService databaseService, string tenantId, HttpContext context, ILogger<Program> logger) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }

        return await PumpkinManager.GetActiveThemeAsync(databaseService, apiKey, tenantId, logger);
    })
    .WithTags("Themes")
    .WithName("GetActiveTheme")
    .WithSummary("Get the active theme for a tenant")
    .WithDescription("Retrieves the active theme including header blocks, footer blocks, block styles, and navigation menu. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

// Get a specific theme by ID (public, API key required)
app.MapGet("/api/themes/{tenantId}/{themeId}",
    async (IDatabaseService databaseService, string tenantId, string themeId, HttpContext context, ILogger<Program> logger) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            apiKey = authHeader.Substring("Bearer ".Length).Trim();
        }

        return await PumpkinManager.GetThemeAsync(databaseService, apiKey, tenantId, themeId, logger);
    })
    .WithTags("Themes")
    .WithName("GetTheme")
    .WithSummary("Get a specific theme by ID")
    .WithDescription("Retrieves a specific theme by its ID for a tenant. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

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
        
        Console.WriteLine($"[Login] User: {user.Username}, Role enum value: {user.Role}, Role as string: {user.Role.ToString()}");
        
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
                TenantId = user.TenantId,
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
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Extract user info from JWT claims
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        // Only SuperAdmins can get any tenant
        if (userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }
        
        return await PumpkinManager.GetTenantAsync(databaseService, tenantId);
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("GetTenant")
    .WithSummary("Get tenant by ID (SuperAdmin only)")
    .WithDescription("Retrieves a specific tenant by ID. Requires SuperAdmin role and JWT authentication via Bearer token.");

// Admin: Create new tenant
app.MapPost("/api/admin/tenants",
    async (IDatabaseService databaseService, HttpContext context, Tenant tenant) =>
    {
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Debug: Log all claims
        Console.WriteLine("[CreateTenant] All claims:");
        foreach (var claim in context.User.Claims)
        {
            Console.WriteLine($"  {claim.Type}: {claim.Value}");
        }
        
        // Extract user info from JWT claims
        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        Console.WriteLine($"[CreateTenant] User TenantId: {userTenantId}, Role: {userRole}");
        Console.WriteLine($"[CreateTenant] ClaimTypes.Role constant: {ClaimTypes.Role}");
        
        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }
        
        // Only SuperAdmins can create tenants
        if (userRole != "SuperAdmin")
        {
            Console.WriteLine($"[CreateTenant] Access denied. Required: SuperAdmin, Got: {userRole}");
            return Results.Json(
                new { error = "Forbidden", message = $"This action requires SuperAdmin role. Your role: {userRole ?? "none"}" },
                statusCode: 403
            );
        }
        
        try
        {
            var createdTenant = await PumpkinManager.CreateTenantAsync(databaseService, tenant);
            return Results.Ok(createdTenant);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Forbid();
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error creating tenant: {ex.Message}");
        }
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("CreateTenant")
    .WithSummary("Create new tenant (SuperAdmin only)")
    .WithDescription("Creates a new tenant. Requires SuperAdmin role and JWT authentication.");

// Admin: Get all tenants
// Admin: Get tenants (JWT-authenticated)
app.MapGet("/api/admin/tenants",
    async (IDatabaseService databaseService, HttpContext context) =>
    {
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Extract user info from JWT claims
        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }
        
        try
        {
            // If SuperAdmin, return all tenants; otherwise just return the user's tenant
            var tenants = await databaseService.GetTenantsForUserAsync(userTenantId, userRole == "SuperAdmin");
            return Results.Ok(new { tenants, count = tenants.Count });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving tenants: {ex.Message}");
        }
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("GetAllTenants")
    .WithSummary("Get tenants for authenticated user")
    .WithDescription("Retrieves tenants accessible to the authenticated user. SuperAdmins see all tenants, others see only their own. Requires JWT authentication via Bearer token.");

// Admin: Update tenant (JWT-authenticated)
app.MapPut("/api/admin/tenants/{tenantId}",
    async (IDatabaseService databaseService, HttpContext context, string tenantId, Tenant tenant) =>
    {
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Extract user info from JWT claims
        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }
        
        // Only SuperAdmins can update tenants
        if (userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }
        
        try
        {
            var updatedTenant = await databaseService.UpdateTenantAsync(tenantId, tenant);
            return Results.Ok(updatedTenant);
        }
        catch (InvalidOperationException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Forbid();
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error updating tenant: {ex.Message}");
        }
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("UpdateTenant")
    .WithSummary("Update tenant (SuperAdmin only)")
    .WithDescription("Updates an existing tenant. Requires SuperAdmin role and JWT authentication via Bearer token.");
// Admin: Regenerate tenant API key (JWT-authenticated)
app.MapPost("/api/admin/tenants/{tenantId}/regenerate-api-key",
    async (IDatabaseService databaseService, HttpContext context, string tenantId) =>
    {
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Extract user info from JWT claims
        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }
        
        // Only SuperAdmins can regenerate API keys
        if (userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }
        
        try
        {
            // Get the tenant first
            var tenant = await databaseService.GetTenantAsync(tenantId);
            if (tenant == null)
            {
                return Results.NotFound($"Tenant {tenantId} not found");
            }
            
            // Generate new API key
            var keyBytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(32);
            var newApiKey = Convert.ToBase64String(keyBytes);
            var newApiKeyHash = BCrypt.Net.BCrypt.HashPassword(newApiKey, 12);
            
            // Update tenant with new API key
            tenant.ApiKey = newApiKey;
            tenant.ApiKeyHash = newApiKeyHash;
            tenant.ApiKeyMeta = new ApiKeyMeta
            {
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
            tenant.UpdatedAt = DateTime.UtcNow;
            
            // Save updated tenant
            var updatedTenant = await databaseService.UpdateTenantAsync(tenantId, tenant);
            
            // Return the plain-text API key (one-time view)
            return Results.Ok(new 
            { 
                tenant = updatedTenant,
                apiKey = newApiKey  // Plain-text key for one-time display
            });
        }
        catch (InvalidOperationException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Forbid();
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error regenerating API key: {ex.Message}");
        }
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("RegenerateTenantApiKey")
    .WithSummary("Regenerate tenant API key (SuperAdmin only)")
    .WithDescription("Generates a new API key for an existing tenant. The plain-text key is returned once for immediate capture. Requires SuperAdmin role and JWT authentication.");
// Admin: Delete tenant (JWT-authenticated)
app.MapDelete("/api/admin/tenants/{tenantId}",
    async (IDatabaseService databaseService, HttpContext context, string tenantId) =>
    {
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Extract user info from JWT claims
        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }
        
        // Only SuperAdmins can delete tenants
        if (userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }
        
        // Prevent deleting their own tenant
        if (tenantId == userTenantId)
        {
            return Results.BadRequest("Cannot delete your own tenant");
        }
        
        try
        {
            var deleted = await databaseService.DeleteTenantAsync(tenantId);
            if (deleted)
            {
                return Results.Ok(new { message = "Tenant deleted successfully", tenantId });
            }
            return Results.NotFound("Tenant not found");
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Forbid();
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error deleting tenant: {ex.Message}");
        }
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("DeleteTenant")
    .WithSummary("Delete tenant (SuperAdmin only)")
    .WithDescription("Deletes a tenant. Requires SuperAdmin role and JWT authentication via Bearer token. Cannot delete own tenant.");

// Admin: Get all pages (optionally filtered by tenant)
app.MapGet("/api/admin/pages",
    async (IDatabaseService databaseService, HttpContext context, string? tenantId = null) =>
    {
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Extract user info from JWT claims
        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }
        
        // Determine which tenant's pages to retrieve
        // If tenantId query param is provided, use that (requires SuperAdmin)
        // Otherwise, use the user's tenantId from the JWT
        var targetTenantId = tenantId ?? userTenantId;
        
        // If requesting different tenant data, verify SuperAdmin role
        if (targetTenantId != userTenantId && userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }
        
        try
        {
            var pages = await databaseService.GetPagesByTenantAsync(targetTenantId);
            return Results.Ok(new { pages, count = pages.Count, tenantId = targetTenantId });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving pages: {ex.Message}");
        }
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("GetAllPages")
    .WithSummary("Get all pages for authenticated user's tenant")
    .WithDescription("Retrieves pages for the authenticated user's tenant. Requires JWT authentication via Bearer token.");

// Admin: Get a single page by slug (JWT, no API key, includes drafts)
app.MapGet("/api/admin/pages/{tenantId}/{**pageSlug}",
    async (IDatabaseService databaseService, string tenantId, string pageSlug, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }

        if (tenantId != userTenantId && userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }

        var decodedSlug = Uri.UnescapeDataString(pageSlug);
        var page = await databaseService.GetPageBySlugAsync(tenantId, decodedSlug);

        if (page == null)
        {
            return Results.NotFound("Page not found");
        }

        return Results.Ok(page);
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("GetPageBySlug")
    .WithSummary("Get a single page by slug for editing")
    .WithDescription("Retrieves a page by slug for a specific tenant. Returns both published and draft pages. Requires JWT authentication.");

// Admin: Create a new page (JWT auth, no API key)
app.MapPost("/api/admin/pages/{tenantId}",
    async (IDatabaseService databaseService, string tenantId, pumpkin_net_models.Models.Page page, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }

        if (tenantId != userTenantId && userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }

        try
        {
            if (page == null)
                return Results.BadRequest("Page data is required");
            if (string.IsNullOrEmpty(page.PageId))
                return Results.BadRequest("Page ID is required");

            var savedPage = await databaseService.SavePageAdminAsync(tenantId, page);
            return Results.Created($"/api/admin/pages/{tenantId}/{savedPage.PageSlug}", savedPage);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error creating page: {ex.Message}");
        }
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("AdminCreatePage")
    .WithSummary("Create a new page (admin)")
    .WithDescription("Creates a new page for a specific tenant. Requires JWT authentication.");

// Admin: Update an existing page (JWT auth, no API key)
app.MapPut("/api/admin/pages/{tenantId}/{**pageSlug}",
    async (IDatabaseService databaseService, string tenantId, string pageSlug, pumpkin_net_models.Models.Page page, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }

        if (tenantId != userTenantId && userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }

        try
        {
            if (page == null)
                return Results.BadRequest("Page data is required");

            var decodedSlug = Uri.UnescapeDataString(pageSlug);
            var updatedPage = await databaseService.UpdatePageAdminAsync(tenantId, decodedSlug, page);
            return Results.Ok(updatedPage);
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
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("AdminUpdatePage")
    .WithSummary("Update an existing page (admin)")
    .WithDescription("Updates a page by slug for a specific tenant. Requires JWT authentication.");

// Admin: Get hub pages for a tenant
app.MapGet("/api/admin/tenants/{tenantId}/hubs",
    async (IDatabaseService databaseService, string tenantId, HttpContext context) =>
    {
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Extract user info from JWT claims
        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }
        
        // If requesting different tenant data, verify SuperAdmin role
        if (tenantId != userTenantId && userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }
        
        return await PumpkinManager.GetHubPagesAsync(databaseService, tenantId);
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("GetHubPages")
    .WithSummary("Get all hub/pillar pages for a tenant")
    .WithDescription("Retrieves all pages marked as hubs (contentRelationships.isHub = true) for a specific tenant. Requires JWT authentication via Bearer token.");

// Admin: Get spoke pages for a hub
app.MapGet("/api/admin/tenants/{tenantId}/hubs/{hubPageSlug}/spokes",
    async (IDatabaseService databaseService, string tenantId, string hubPageSlug, HttpContext context) =>
    {
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Extract user info from JWT claims
        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }
        
        // If requesting different tenant data, verify SuperAdmin role
        if (tenantId != userTenantId && userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }
        
        // Decode hubPageSlug in case it's URL encoded
        var decodedHubPageSlug = Uri.UnescapeDataString(hubPageSlug);
        
        return await PumpkinManager.GetSpokePagesAsync(databaseService, tenantId, decodedHubPageSlug);
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("GetSpokePages")
    .WithSummary("Get all spoke pages for a hub")
    .WithDescription("Retrieves all spoke/cluster pages linked to a specific hub page, ordered by spokePriority. Requires JWT authentication via Bearer token.");

// Admin: Get complete content hierarchy visualization
app.MapGet("/api/admin/tenants/{tenantId}/content-hierarchy",
    async (IDatabaseService databaseService, string tenantId, HttpContext context) =>
    {
        // Validate JWT authentication
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }
        
        // Extract user info from JWT claims
        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        
        if (string.IsNullOrEmpty(userTenantId))
        {
            return Results.BadRequest("User tenant ID not found in token");
        }
        
        // If requesting different tenant data, verify SuperAdmin role
        if (tenantId != userTenantId && userRole != "SuperAdmin")
        {
            return Results.Forbid();
        }
        
        return await PumpkinManager.GetContentHierarchyAsync(databaseService, tenantId);
    })
    .RequireAuthorization()
    .WithTags("Admin")
    .WithName("GetContentHierarchy")
    .WithSummary("Get complete content hierarchy visualization")
    .WithDescription("Retrieves a comprehensive view of the content architecture including hubs, spokes, clusters, and orphan pages. Perfect for visualizing internal linking structure. Requires JWT authentication via Bearer token.");

// ===== ADMIN: THEME ENDPOINTS =====

// Admin: Get all themes for a tenant
app.MapGet("/api/admin/themes/{tenantId}",
    async (IDatabaseService databaseService, string tenantId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.GetThemesByTenantAsync(databaseService, tenantId);
    })
    .RequireAuthorization()
    .WithTags("Admin - Themes")
    .WithName("GetThemesByTenant")
    .WithSummary("Get all themes for a tenant")
    .WithDescription("Retrieves all themes for a specific tenant. Requires JWT authentication.");

// Admin: Get the active theme for a tenant
app.MapGet("/api/admin/themes/{tenantId}/active",
    async (IDatabaseService databaseService, string tenantId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.GetActiveThemeAdminAsync(databaseService, tenantId);
    })
    .RequireAuthorization()
    .WithTags("Admin - Themes")
    .WithName("GetActiveThemeAdmin")
    .WithSummary("Get the active theme for a tenant (admin)")
    .WithDescription("Retrieves the active theme for a tenant. Requires JWT authentication.");

// Admin: Get a specific theme by ID
app.MapGet("/api/admin/themes/{tenantId}/{themeId}",
    async (IDatabaseService databaseService, string tenantId, string themeId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.GetThemeAdminAsync(databaseService, tenantId, themeId);
    })
    .RequireAuthorization()
    .WithTags("Admin - Themes")
    .WithName("GetThemeAdmin")
    .WithSummary("Get a specific theme by ID (admin)")
    .WithDescription("Retrieves a specific theme by its ID. Returns full theme including header, footer, block styles, and menu. Requires JWT authentication.");

// Admin: Create a new theme
app.MapPost("/api/admin/themes/{tenantId}",
    async (IDatabaseService databaseService, string tenantId, Theme theme, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.CreateThemeAsync(databaseService, tenantId, theme);
    })
    .RequireAuthorization()
    .WithTags("Admin - Themes")
    .WithName("CreateTheme")
    .WithSummary("Create a new theme")
    .WithDescription("Creates a new theme for a specific tenant. Requires JWT authentication.");

// Admin: Update an existing theme
app.MapPut("/api/admin/themes/{tenantId}/{themeId}",
    async (IDatabaseService databaseService, string tenantId, string themeId, Theme theme, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.UpdateThemeAsync(databaseService, tenantId, themeId, theme);
    })
    .RequireAuthorization()
    .WithTags("Admin - Themes")
    .WithName("UpdateTheme")
    .WithSummary("Update an existing theme")
    .WithDescription("Updates a theme by ID for a specific tenant. Requires JWT authentication.");

// Admin: Delete a theme
app.MapDelete("/api/admin/themes/{tenantId}/{themeId}",
    async (IDatabaseService databaseService, string tenantId, string themeId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.DeleteThemeAsync(databaseService, tenantId, themeId);
    })
    .RequireAuthorization()
    .WithTags("Admin - Themes")
    .WithName("DeleteTheme")
    .WithSummary("Delete a theme")
    .WithDescription("Deletes a theme by ID for a specific tenant. Requires JWT authentication.");

app.Run();
