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
using Microsoft.Extensions.Options;

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
        Version = "v1",
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

// Configure tenant-scoped theme and media asset storage
builder.Services.Configure<AssetStorageSettings>(
    builder.Configuration.GetSection(AssetStorageSettings.SectionName));

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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("TenantContentReader", policy =>
        policy.RequireRole("SuperAdmin", "TenantAdmin", "Editor", "Viewer"));
    options.AddPolicy("TenantContentEditor", policy =>
        policy.RequireRole("SuperAdmin", "TenantAdmin", "Editor"));
    options.AddPolicy("TenantContentOwner", policy =>
        policy.RequireRole("SuperAdmin", "TenantAdmin"));
});

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
builder.Services.AddScoped<ThemePackageInstaller>();
builder.Services.AddScoped<MediaAssetUploader>();

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
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Pumpkin CMS API v.9");
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

// Save a form entry (low-level — full FormEntry body required)
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
    .WithSummary("Submit a form entry (low-level)")
    .WithDescription("Submits a new form entry for a specific tenant. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

// Get form definition by type (for frontend dynamic form rendering)
app.MapGet("/api/forms/{tenantId}/definitions/{type}",
    async (IDatabaseService databaseService, string tenantId, string type, HttpContext context) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            apiKey = authHeader.Substring("Bearer ".Length).Trim();

        return await PumpkinManager.GetFormDefinitionPublicAsync(databaseService, apiKey, tenantId, type);
    })
    .WithTags("Forms")
    .WithName("GetFormDefinition")
    .WithSummary("Get form definition by type")
    .WithDescription("Returns the form schema for the given type so the frontend can render the form dynamically. Requires API key authentication via Authorization header (Bearer {apiKey})")
    .RequireCors("TenantCors");

// Submit a form using a flat field dictionary (ergonomic frontend endpoint)
app.MapPost("/api/forms/{tenantId}/submit/{type}",
    async (IDatabaseService databaseService, string tenantId, string type,
           Dictionary<string, object?> formData, HttpContext context) =>
    {
        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        var apiKey = string.Empty;
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            apiKey = authHeader.Substring("Bearer ".Length).Trim();

        return await PumpkinManager.SubmitFormAsync(databaseService, apiKey, tenantId, type, formData, context);
    })
    .WithTags("Forms")
    .WithName("SubmitForm")
    .WithSummary("Submit a filled form by type")
    .WithDescription("Accepts a flat field dictionary, validates required fields against the FormDefinition, and saves a FormEntry. Server sets ipAddress, userAgent, submittedAt, status, and source automatically. Requires API key authentication via Authorization header (Bearer {apiKey})")
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

// Verify current JWT and return the authenticated user
app.MapGet("/api/auth/verify",
    async (IDatabaseService databaseService, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }

        var email = context.User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrWhiteSpace(email))
        {
            return Results.Unauthorized();
        }

        var user = await databaseService.GetUserByEmailAsync(email);
        if (user == null || !user.IsActive)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new UserInfo
        {
            Id = user.Id,
            TenantId = user.TenantId,
            Email = user.Email,
            Username = user.Username,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            Permissions = user.Permissions
        });
    })
    .RequireAuthorization()
    .WithTags("Authentication")
    .WithName("VerifyToken")
    .WithSummary("Verify JWT")
    .WithDescription("Validates the current JWT and returns the active user profile.");

// Stateless JWT logout endpoint for clients that clear their local token
app.MapPost("/api/auth/logout",
    (HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new { message = "Logged out" });
    })
    .RequireAuthorization()
    .WithTags("Authentication")
    .WithName("Logout")
    .WithSummary("Logout")
    .WithDescription("Completes client logout for stateless JWT authentication. Clients should discard their token.");

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

// ===== ADMIN: USER ENDPOINTS =====

// Admin: List users for a tenant
app.MapGet("/api/admin/users/{tenantId}",
    async (IDatabaseService databaseService, HttpContext context, string tenantId) =>
    {
        var authError = AuthorizeUserAdmin(context, tenantId);
        if (authError != null)
        {
            return authError;
        }

        try
        {
            var users = await databaseService.GetUsersByTenantAsync(tenantId);
            return Results.Ok(new
            {
                users = users.Select(ToAdminUserInfo),
                count = users.Count,
                tenantId
            });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving users: {ex.Message}");
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Users")
    .WithName("GetUsersByTenant")
    .WithSummary("List users for a tenant")
    .WithDescription("Lists users for a tenant. SuperAdmins can list any tenant; TenantAdmins can list their own tenant.");

// Admin: Get a single user
app.MapGet("/api/admin/users/{tenantId}/{userId}",
    async (IDatabaseService databaseService, HttpContext context, string tenantId, string userId) =>
    {
        var authError = AuthorizeUserAdmin(context, tenantId);
        if (authError != null)
        {
            return authError;
        }

        var user = await databaseService.GetUserAsync(tenantId, userId);
        return user == null ? Results.NotFound("User not found") : Results.Ok(ToAdminUserInfo(user));
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Users")
    .WithName("GetAdminUser")
    .WithSummary("Get user by ID")
    .WithDescription("Gets a sanitized user profile by ID.");

// Admin: Create a user
app.MapPost("/api/admin/users/{tenantId}",
    async (IDatabaseService databaseService, HttpContext context, string tenantId, CreateAdminUserRequest request) =>
    {
        var authError = AuthorizeUserAdmin(context, tenantId);
        if (authError != null)
        {
            return authError;
        }

        if (!TryParseUserRole(request.Role, out var role))
        {
            return Results.BadRequest("Invalid role");
        }

        var currentRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        if (currentRole != "SuperAdmin" && role == UserRole.SuperAdmin)
        {
            return Results.Forbid();
        }

        try
        {
            var user = new User
            {
                TenantId = tenantId,
                Email = request.Email,
                Username = request.Username,
                PasswordHash = string.Empty,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = role,
                IsActive = request.IsActive ?? true,
                Permissions = request.Permissions ?? new List<string>()
            };

            var createdUser = await databaseService.CreateUserAsync(tenantId, user, request.Password);
            return Results.Created($"/api/admin/users/{tenantId}/{createdUser.Id}", ToAdminUserInfo(createdUser));
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error creating user: {ex.Message}");
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Users")
    .WithName("CreateAdminUser")
    .WithSummary("Create user")
    .WithDescription("Creates a user with server-side BCrypt password hashing.");

// Admin: Update a user profile
app.MapPut("/api/admin/users/{tenantId}/{userId}",
    async (IDatabaseService databaseService, HttpContext context, string tenantId, string userId, UpdateAdminUserRequest request) =>
    {
        var authError = AuthorizeUserAdmin(context, tenantId);
        if (authError != null)
        {
            return authError;
        }

        if (!TryParseUserRole(request.Role, out var role))
        {
            return Results.BadRequest("Invalid role");
        }

        var currentRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        try
        {
            var existingUser = await databaseService.GetUserAsync(tenantId, userId);
            if (existingUser == null)
            {
                return Results.NotFound("User not found");
            }

            if (currentRole != "SuperAdmin" && (existingUser.Role == UserRole.SuperAdmin || role == UserRole.SuperAdmin))
            {
                return Results.Forbid();
            }

            if (currentUserId == userId && request.IsActive == false)
            {
                return Results.BadRequest("Cannot deactivate your own user");
            }

            var user = new User
            {
                Id = userId,
                TenantId = tenantId,
                Email = request.Email,
                Username = request.Username,
                PasswordHash = string.Empty,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = role,
                IsActive = request.IsActive,
                Permissions = request.Permissions ?? existingUser.Permissions
            };

            var updatedUser = await databaseService.UpdateUserAsync(tenantId, userId, user);
            return Results.Ok(ToAdminUserInfo(updatedUser));
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error updating user: {ex.Message}");
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Users")
    .WithName("UpdateAdminUser")
    .WithSummary("Update user")
    .WithDescription("Updates user profile fields without accepting password hashes.");

// Admin: Reset a user's password
app.MapPost("/api/admin/users/{tenantId}/{userId}/reset-password",
    async (IDatabaseService databaseService, HttpContext context, string tenantId, string userId, ResetAdminUserPasswordRequest request) =>
    {
        var authError = AuthorizeUserAdmin(context, tenantId);
        if (authError != null)
        {
            return authError;
        }

        try
        {
            var targetUser = await databaseService.GetUserAsync(tenantId, userId);
            if (targetUser == null)
            {
                return Results.NotFound("User not found");
            }

            var currentRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (currentRole != "SuperAdmin" && targetUser.Role == UserRole.SuperAdmin)
            {
                return Results.Forbid();
            }

            var updatedUser = await databaseService.ResetUserPasswordAsync(tenantId, userId, request.Password);
            return Results.Ok(ToAdminUserInfo(updatedUser));
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error resetting user password: {ex.Message}");
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Users")
    .WithName("ResetAdminUserPassword")
    .WithSummary("Reset user password")
    .WithDescription("Resets a user's password with server-side BCrypt hashing.");

// Admin: Delete a user
app.MapDelete("/api/admin/users/{tenantId}/{userId}",
    async (IDatabaseService databaseService, HttpContext context, string tenantId, string userId) =>
    {
        var authError = AuthorizeUserAdmin(context, tenantId);
        if (authError != null)
        {
            return authError;
        }

        var currentUserId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId == userId)
        {
            return Results.BadRequest("Cannot delete your own user");
        }

        try
        {
            var targetUser = await databaseService.GetUserAsync(tenantId, userId);
            if (targetUser == null)
            {
                return Results.NotFound("User not found");
            }

            var currentRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (currentRole != "SuperAdmin" && targetUser.Role == UserRole.SuperAdmin)
            {
                return Results.Forbid();
            }

            var deleted = await databaseService.DeleteUserAsync(tenantId, userId);
            return deleted
                ? Results.Ok(new { message = "User deleted successfully", tenantId, userId })
                : Results.NotFound("User not found");
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error deleting user: {ex.Message}");
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Users")
    .WithName("DeleteAdminUser")
    .WithSummary("Delete user")
    .WithDescription("Deletes a user. Users cannot delete their own account.");

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
    .RequireAuthorization("TenantContentReader")
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
    .RequireAuthorization("TenantContentReader")
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
    .RequireAuthorization("TenantContentEditor")
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
    .RequireAuthorization("TenantContentEditor")
    .WithTags("Admin")
    .WithName("AdminUpdatePage")
    .WithSummary("Update an existing page (admin)")
    .WithDescription("Updates a page by slug for a specific tenant. Requires JWT authentication.");

// Admin: Delete an existing page (JWT auth, no API key)
app.MapDelete("/api/admin/pages/{tenantId}/{**pageSlug}",
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

        try
        {
            var decodedSlug = Uri.UnescapeDataString(pageSlug);
            var deleted = await databaseService.DeletePageAdminAsync(tenantId, decodedSlug);
            return deleted
                ? Results.Ok(new { message = "Page deleted successfully", tenantId, pageSlug = decodedSlug })
                : Results.NotFound("Page not found");
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error deleting page: {ex.Message}");
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin")
    .WithName("AdminDeletePage")
    .WithSummary("Delete an existing page (admin)")
    .WithDescription("Deletes a page by slug for a specific tenant. Requires TenantAdmin or SuperAdmin role.");

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
    .RequireAuthorization("TenantContentReader")
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
    .RequireAuthorization("TenantContentReader")
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
    .RequireAuthorization("TenantContentReader")
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
    .RequireAuthorization("TenantContentReader")
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
    .RequireAuthorization("TenantContentReader")
    .WithTags("Admin - Themes")
    .WithName("GetActiveThemeAdmin")
    .WithSummary("Get the active theme for a tenant (admin)")
    .WithDescription("Retrieves the active theme for a tenant. Requires JWT authentication.");

// Admin: Install a compiled theme package
app.MapPost("/api/admin/themes/{tenantId}/install",
    async (IDatabaseService databaseService, ThemePackageInstaller installer, string tenantId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        if (!context.Request.HasFormContentType)
            return Results.BadRequest("Theme package must be uploaded as multipart/form-data.");

        try
        {
            var form = await context.Request.ReadFormAsync(context.RequestAborted);
            var packageFile = form.Files.GetFile("package") ?? form.Files.FirstOrDefault();

            if (packageFile == null || packageFile.Length == 0)
                return Results.BadRequest("A theme package zip file is required.");

            await using var packageStream = packageFile.OpenReadStream();
            var installResult = await installer.InstallAsync(packageStream, tenantId, context.RequestAborted);
            var existing = await databaseService.GetThemeAdminAsync(tenantId, installResult.Theme.ThemeId);
            var saved = existing == null
                ? await databaseService.CreateThemeAsync(tenantId, installResult.Theme)
                : await databaseService.UpdateThemeAsync(tenantId, installResult.Theme.ThemeId, installResult.Theme);

            var response = new
            {
                created = existing == null,
                theme = saved,
                storage = new
                {
                    installResult.TenantThemePath,
                    installResult.CssBlobPath,
                    installResult.ManifestBlobPath,
                    installResult.PackageBlobPath,
                    installResult.AssetBlobPaths
                }
            };

            return existing == null
                ? Results.Created($"/api/admin/themes/{tenantId}/{saved.ThemeId}", response)
                : Results.Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (InvalidDataException)
        {
            return Results.BadRequest("Theme package must be a valid zip file.");
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Themes")
    .WithName("InstallCompiledThemePackage")
    .WithSummary("Install a compiled theme package")
    .WithDescription("Uploads theme.css/assets to blob storage, computes compiled asset metadata, and creates or updates the tenant theme.");

// Admin: Get tenant-scoped theme storage target paths
app.MapGet("/api/admin/themes/{tenantId}/{themeId}/storage-target",
    (IOptions<AssetStorageSettings> assetStorageOptions, string tenantId, string themeId, int? version, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        var settings = assetStorageOptions.Value;
        var tenantThemePath = settings.BuildTenantThemePath(tenantId, themeId, (version ?? 1).ToString());

        return Results.Ok(new
        {
            provider = settings.Provider,
            containerName = settings.AzureBlob.ThemesContainerName,
            publicBaseUrl = string.IsNullOrWhiteSpace(settings.AzureBlob.ThemesPublicBaseUrl)
                ? settings.AzureBlob.PublicBaseUrl
                : settings.AzureBlob.ThemesPublicBaseUrl,
            tenantThemePath,
            cssBlobPath = $"{tenantThemePath}/theme.css",
            manifestBlobPath = $"{tenantThemePath}/theme-manifest.json",
            packageBlobPath = $"{tenantThemePath}/theme-package.zip",
            assetsBlobPath = $"{tenantThemePath}/assets/",
            cssUrl = settings.BuildThemePublicUrl(tenantThemePath, "theme.css"),
            manifestUrl = settings.BuildThemePublicUrl(tenantThemePath, "theme-manifest.json"),
            packageUrl = settings.BuildThemePublicUrl(tenantThemePath, "theme-package.zip"),
            assetsBaseUrl = settings.BuildThemePublicUrl(tenantThemePath, "assets/")
        });
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Themes")
    .WithName("GetThemeStorageTarget")
    .WithSummary("Get tenant-scoped storage target paths for a compiled theme")
    .WithDescription("Returns safe blob paths and public URLs for a tenant theme package. Storage credentials are never returned.");

// Admin: Get tenant-scoped media storage target paths
app.MapGet("/api/admin/media/{tenantId}/storage-target",
    (IOptions<AssetStorageSettings> assetStorageOptions, string tenantId, string fileName, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        if (string.IsNullOrWhiteSpace(fileName))
            return Results.BadRequest("File name is required");

        var settings = assetStorageOptions.Value;
        var assetId = Guid.NewGuid().ToString("N");
        var mediaPath = settings.BuildTenantMediaPath(tenantId, assetId, Path.GetFileName(fileName), DateTimeOffset.UtcNow);

        return Results.Ok(new
        {
            provider = settings.Provider,
            containerName = settings.AzureBlob.MediaContainerName,
            publicBaseUrl = string.IsNullOrWhiteSpace(settings.AzureBlob.MediaPublicBaseUrl)
                ? settings.AzureBlob.PublicBaseUrl
                : settings.AzureBlob.MediaPublicBaseUrl,
            assetId,
            blobPath = mediaPath,
            publicUrl = settings.BuildMediaPublicUrl(mediaPath)
        });
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Media")
    .WithName("GetMediaStorageTarget")
    .WithSummary("Get tenant-scoped storage target path for a media asset")
    .WithDescription("Returns a safe blob path and public URL for a tenant media upload. Storage credentials are never returned.");

// Admin: Upload media asset and register metadata
app.MapPost("/api/admin/media/{tenantId}/upload",
    async (IDatabaseService databaseService, MediaAssetUploader uploader, string tenantId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        if (!context.Request.HasFormContentType)
            return Results.BadRequest("Media file must be uploaded as multipart/form-data.");

        try
        {
            var form = await context.Request.ReadFormAsync(context.RequestAborted);
            var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
            if (file == null || file.Length == 0)
                return Results.BadRequest("A media file is required.");

            var tags = form.TryGetValue("tags", out var tagsValue)
                ? tagsValue.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
                : new List<string>();
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var uploadRequest = new MediaAssetUploadRequest
            {
                TenantId = tenantId,
                FileName = file.FileName,
                ContentType = file.ContentType,
                SizeBytes = file.Length,
                Folder = form.TryGetValue("folder", out var folderValue) ? folderValue.ToString() : string.Empty,
                AltText = form.TryGetValue("altText", out var altTextValue) ? altTextValue.ToString() : string.Empty,
                Caption = form.TryGetValue("caption", out var captionValue) ? captionValue.ToString() : string.Empty,
                Tags = tags,
                UserId = userId
            };

            await using var fileStream = file.OpenReadStream();
            var mediaAsset = await uploader.UploadAsync(fileStream, uploadRequest, context.RequestAborted);
            var created = await databaseService.CreateMediaAssetAsync(tenantId, mediaAsset);

            return Results.Created($"/api/admin/media/{tenantId}/{created.MediaAssetId}", created);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(ex.Message);
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Media")
    .WithName("UploadMediaAsset")
    .WithSummary("Upload a media file")
    .WithDescription("Uploads a media file to tenant asset storage and creates the media metadata document.");

// Admin: List tenant media assets
app.MapGet("/api/admin/media/{tenantId}",
    async (IDatabaseService databaseService, string tenantId, string? folder, string? contentType, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        var assets = await databaseService.GetMediaAssetsByTenantAsync(tenantId, folder, contentType);
        return Results.Ok(new { assets, count = assets.Count, tenantId, folder, contentType });
    })
    .RequireAuthorization("TenantContentReader")
    .WithTags("Admin - Media")
    .WithName("GetMediaAssetsByTenant")
    .WithSummary("List media assets for a tenant")
    .WithDescription("Lists metadata for media files stored in tenant asset storage. Requires JWT authentication.");

// Admin: Register media asset metadata
app.MapPost("/api/admin/media/{tenantId}",
    async (IDatabaseService databaseService, string tenantId, MediaAsset mediaAsset, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        try
        {
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            mediaAsset.CreatedByUserId = string.IsNullOrWhiteSpace(mediaAsset.CreatedByUserId)
                ? userId
                : mediaAsset.CreatedByUserId;
            mediaAsset.UpdatedByUserId = userId;

            var created = await databaseService.CreateMediaAssetAsync(tenantId, mediaAsset);
            return Results.Created($"/api/admin/media/{tenantId}/{created.MediaAssetId}", created);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ex.Message);
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Media")
    .WithName("CreateMediaAsset")
    .WithSummary("Register media asset metadata")
    .WithDescription("Creates metadata for a media file already uploaded to tenant asset storage.");

// Admin: Get media asset metadata
app.MapGet("/api/admin/media/{tenantId}/{mediaAssetId}",
    async (IDatabaseService databaseService, string tenantId, string mediaAssetId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        var asset = await databaseService.GetMediaAssetAsync(tenantId, mediaAssetId);
        return asset == null ? Results.NotFound("Media asset not found") : Results.Ok(asset);
    })
    .RequireAuthorization("TenantContentReader")
    .WithTags("Admin - Media")
    .WithName("GetMediaAsset")
    .WithSummary("Get media asset metadata")
    .WithDescription("Retrieves metadata for a media file. Requires JWT authentication.");

// Admin: Update media asset metadata
app.MapPut("/api/admin/media/{tenantId}/{mediaAssetId}",
    async (IDatabaseService databaseService, string tenantId, string mediaAssetId, MediaAsset mediaAsset, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        try
        {
            mediaAsset.UpdatedByUserId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var updated = await databaseService.UpdateMediaAssetAsync(tenantId, mediaAssetId, mediaAsset);
            return Results.Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Media")
    .WithName("UpdateMediaAsset")
    .WithSummary("Update media asset metadata")
    .WithDescription("Updates editable metadata for a media file. Requires JWT authentication.");

// Admin: Delete media asset metadata
app.MapDelete("/api/admin/media/{tenantId}/{mediaAssetId}",
    async (IDatabaseService databaseService, string tenantId, string mediaAssetId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        try
        {
            var deleted = await databaseService.DeleteMediaAssetAsync(tenantId, mediaAssetId);
            return deleted
                ? Results.Ok(new { message = "Media asset deleted successfully", tenantId, mediaAssetId })
                : Results.NotFound("Media asset not found");
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Media")
    .WithName("DeleteMediaAsset")
    .WithSummary("Delete media asset metadata")
    .WithDescription("Deletes metadata for a media file. Blob deletion will be handled by the media upload/delete service phase.");

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
    .RequireAuthorization("TenantContentReader")
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
    .RequireAuthorization("TenantContentOwner")
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
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Themes")
    .WithName("UpdateTheme")
    .WithSummary("Update an existing theme")
    .WithDescription("Updates a theme by ID for a specific tenant. Requires JWT authentication.");

// Admin: Activate a theme
app.MapPost("/api/admin/themes/{tenantId}/{themeId}/activate",
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

        return await PumpkinManager.ActivateThemeAsync(databaseService, tenantId, themeId);
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Themes")
    .WithName("ActivateTheme")
    .WithSummary("Activate a theme")
    .WithDescription("Marks one theme as active for a tenant and updates the tenant active-theme pointer.");

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
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Themes")
    .WithName("DeleteTheme")
    .WithSummary("Delete a theme")
    .WithDescription("Deletes a theme by ID for a specific tenant. Requires JWT authentication.");

// ===== ADMIN: FORM DEFINITION ENDPOINTS =====

// Admin: List all form definitions for a tenant
app.MapGet("/api/admin/forms/{tenantId}/definitions",
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

        return await PumpkinManager.GetFormDefinitionsByTenantAsync(databaseService, tenantId);
    })
    .RequireAuthorization("TenantContentReader")
    .WithTags("Admin - Forms")
    .WithName("GetFormDefinitionsByTenant")
    .WithSummary("List all form definitions for a tenant")
    .WithDescription("Retrieves all form definitions for a specific tenant. Requires JWT authentication.");

// Admin: Get a single form definition
app.MapGet("/api/admin/forms/{tenantId}/definitions/{formDefinitionId}",
    async (IDatabaseService databaseService, string tenantId, string formDefinitionId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.GetFormDefinitionAsync(databaseService, tenantId, formDefinitionId);
    })
    .RequireAuthorization("TenantContentReader")
    .WithTags("Admin - Forms")
    .WithName("GetFormDefinition_Admin")
    .WithSummary("Get a form definition by ID")
    .WithDescription("Retrieves a form definition by ID for a specific tenant. Requires JWT authentication.");

// Admin: Create a form definition
app.MapPost("/api/admin/forms/{tenantId}/definitions",
    async (IDatabaseService databaseService, string tenantId, FormDefinition formDefinition, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.CreateFormDefinitionAsync(databaseService, tenantId, formDefinition);
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Forms")
    .WithName("CreateFormDefinition")
    .WithSummary("Create a form definition")
    .WithDescription("Creates a new form definition for a specific tenant. Requires JWT authentication.");

// Admin: Update a form definition
app.MapPut("/api/admin/forms/{tenantId}/definitions/{formDefinitionId}",
    async (IDatabaseService databaseService, string tenantId, string formDefinitionId,
           FormDefinition formDefinition, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.UpdateFormDefinitionAsync(databaseService, tenantId, formDefinitionId, formDefinition);
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Forms")
    .WithName("UpdateFormDefinition")
    .WithSummary("Update a form definition")
    .WithDescription("Updates a form definition by ID for a specific tenant. Requires JWT authentication.");

// Admin: Delete a form definition
app.MapDelete("/api/admin/forms/{tenantId}/definitions/{formDefinitionId}",
    async (IDatabaseService databaseService, string tenantId, string formDefinitionId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.DeleteFormDefinitionAsync(databaseService, tenantId, formDefinitionId);
    })
    .RequireAuthorization("TenantContentOwner")
    .WithTags("Admin - Forms")
    .WithName("DeleteFormDefinition")
    .WithSummary("Delete a form definition")
    .WithDescription("Deletes a form definition by ID for a specific tenant. Requires JWT authentication.");

// ===== ADMIN: FORM ENTRY ENDPOINTS =====

// Admin: List form entries for a tenant (optionally filtered by type)
app.MapGet("/api/admin/forms/{tenantId}/entries",
    async (IDatabaseService databaseService, string tenantId, HttpContext context, string? type = null) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.GetFormEntriesByTenantAsync(databaseService, tenantId, type);
    })
    .RequireAuthorization("TenantContentReader")
    .WithTags("Admin - Forms")
    .WithName("GetFormEntries")
    .WithSummary("List form entries for a tenant")
    .WithDescription("Retrieves all form entries for a tenant. Optional ?type= query parameter filters by form type. Requires JWT authentication.");

// Admin: Get a single form entry
app.MapGet("/api/admin/forms/{tenantId}/entries/{entryId}",
    async (IDatabaseService databaseService, string tenantId, string entryId, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.GetFormEntryAsync(databaseService, tenantId, entryId);
    })
    .RequireAuthorization("TenantContentReader")
    .WithTags("Admin - Forms")
    .WithName("GetFormEntry")
    .WithSummary("Get a single form entry")
    .WithDescription("Retrieves a single form entry by ID for a specific tenant. Requires JWT authentication.");

// Admin: Update form entry status
app.MapPut("/api/admin/forms/{tenantId}/entries/{entryId}/status",
    async (IDatabaseService databaseService, string tenantId, string entryId,
           StatusUpdateRequest request, HttpContext context) =>
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return Results.Unauthorized();

        var userTenantId = context.User.FindFirst("tenantId")?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userTenantId))
            return Results.BadRequest("User tenant ID not found in token");

        if (tenantId != userTenantId && userRole != "SuperAdmin")
            return Results.Forbid();

        return await PumpkinManager.UpdateFormEntryStatusAsync(databaseService, tenantId, entryId, request.Status);
    })
    .RequireAuthorization("TenantContentEditor")
    .WithTags("Admin - Forms")
    .WithName("UpdateFormEntryStatus")
    .WithSummary("Update the status of a form entry")
    .WithDescription("Updates the status of a form entry (e.g. new → read → actioned → archived). Requires JWT authentication.");

static IResult? AuthorizeUserAdmin(HttpContext context, string tenantId)
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

    if (userRole != "SuperAdmin" && userRole != "TenantAdmin")
    {
        return Results.Forbid();
    }

    if (tenantId != userTenantId && userRole != "SuperAdmin")
    {
        return Results.Forbid();
    }

    return null;
}

static bool TryParseUserRole(string role, out UserRole userRole)
{
    return Enum.TryParse(role, ignoreCase: true, out userRole)
        && Enum.IsDefined(typeof(UserRole), userRole);
}

static AdminUserInfo ToAdminUserInfo(User user)
{
    return new AdminUserInfo(
        user.Id,
        user.TenantId,
        user.Email,
        user.Username,
        user.FirstName,
        user.LastName,
        user.Role.ToString(),
        user.IsActive,
        user.CreatedDate,
        user.LastLogin,
        user.Permissions);
}

app.Run();

/// <summary>Request body for updating a form entry's status.</summary>
record StatusUpdateRequest(string Status);

/// <summary>Sanitized admin user response. PasswordHash is intentionally omitted.</summary>
record AdminUserInfo(
    string Id,
    string TenantId,
    string Email,
    string Username,
    string? FirstName,
    string? LastName,
    string Role,
    bool IsActive,
    DateTime CreatedDate,
    DateTime? LastLogin,
    List<string> Permissions);

/// <summary>Request body for creating an admin-managed user.</summary>
record CreateAdminUserRequest(
    string Email,
    string Username,
    string Password,
    string Role,
    string? FirstName,
    string? LastName,
    bool? IsActive,
    List<string>? Permissions);

/// <summary>Request body for updating an admin-managed user.</summary>
record UpdateAdminUserRequest(
    string Email,
    string Username,
    string Role,
    string? FirstName,
    string? LastName,
    bool IsActive,
    List<string>? Permissions);

/// <summary>Request body for resetting an admin-managed user's password.</summary>
record ResetAdminUserPasswordRequest(string Password);
