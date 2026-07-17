using pumpkin_api.Services;
using pumpkin_net_models.Models;
using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace pumpkin_api.Managers;

public static class PumpkinManager
{
    private static readonly ConcurrentDictionary<string, List<DateTimeOffset>> FormSubmissionWindows = new();

    public static IResult GetWelcomeMessage()
    {
        return Results.Ok("Welcome to Pumpkin CMS v1.03");
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

            var blockErrors = HtmlBlockContractValidator.ValidatePage(page);
            if (blockErrors.Count > 0)
                return Results.BadRequest(new { message = "Page contains invalid block content.", errors = blockErrors });

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

            var blockErrors = HtmlBlockContractValidator.ValidatePage(page);
            if (blockErrors.Count > 0)
                return Results.BadRequest(new { message = "Page contains invalid block content.", errors = blockErrors });

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
            
            if (string.IsNullOrEmpty(formEntry.FormDefinitionId))
                return Results.BadRequest("Form definition ID is required");

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

            var sitemapEntries = await databaseService.GetSitemapPagesAsync(apiKey, tenantId);
            
            return Results.Ok(new { tenantId, pages = sitemapEntries, count = sitemapEntries.Count });
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

    public static async Task<IResult> GetPublishedSpokePagesAsync(
        IDatabaseService databaseService,
        string apiKey,
        string tenantId,
        string hubPageSlug,
        int limit)
    {
        try
        {
            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");

            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            if (string.IsNullOrWhiteSpace(hubPageSlug))
                return Results.BadRequest("Hub page slug is required");

            var safeLimit = Math.Clamp(limit <= 0 ? 12 : limit, 1, 50);
            var spokes = await databaseService.GetPublishedSpokePagesAsync(apiKey, tenantId, hubPageSlug, safeLimit);

            return Results.Ok(new
            {
                tenantId,
                hubPageSlug,
                spokePages = spokes,
                count = spokes.Count,
                limit = safeLimit
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving spoke pages: {ex.Message}");
        }
    }

    public static async Task<(bool IsValid, Tenant? Tenant, bool IsAdmin)> ValidateTenantAsync(
        IDatabaseService databaseService,
        string tenantId, 
        string apiKey)
    {
        try
        {
            // For now, we'll validate by trying to get a page (which validates the API key)
            // This is a temporary workaround until we add a dedicated ValidateTenantApiKeyAsync method
            
            // If we can access data with this tenant/key combo, it's valid
            // We'll need to add a proper ValidateTenantApiKeyAsync method to IDatabaseService later
            
            // For now, just return basic validation
            // TODO: Add proper tenant validation method to IDatabaseService
            return (false, null, false);
        }
        catch
        {
            return (false, null, false);
        }
    }

    // Check specific admin permissions using existing Features
    public static bool HasPermission(Tenant? tenant, string permission)
    {
        if (tenant == null || tenant.Plan != "SuperAdmin")
            return false;

        return permission switch
        {
            "CreateTenant" => tenant.Settings.Features.CanCreateTenants,
            "DeleteTenant" => tenant.Settings.Features.CanDeleteTenants,
            "ManageAllContent" => tenant.Settings.Features.CanManageAllContent,
            "ViewAllTenants" => tenant.Settings.Features.CanViewAllTenants,
            _ => false
        };
    }

    // Admin: Get specific tenant (JWT authentication at endpoint level)
    public static async Task<IResult> GetTenantAsync(IDatabaseService databaseService, string tenantId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            var tenant = await databaseService.GetTenantAsync(tenantId);
            
            if (tenant == null)
                return Results.NotFound("Tenant not found");
            
            return Results.Ok(tenant);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving tenant: {ex.Message}");
        }
    }

    // Admin: Create new tenant (JWT authentication at endpoint level)
    public static async Task<IResult> CreateTenantAsync(IDatabaseService databaseService, Tenant tenant)
    {
        try
        {
            if (tenant == null)
                return Results.BadRequest("Tenant data is required");
            
            if (string.IsNullOrEmpty(tenant.TenantId))
                return Results.BadRequest("Tenant ID is required");

            var createdTenant = await databaseService.CreateTenantAsync(tenant);
            
            return Results.Created($"/api/admin/tenants/{createdTenant.TenantId}", createdTenant);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error creating tenant: {ex.Message}");
        }
    }

    // Admin: Get all tenants (JWT authentication at endpoint level)
    public static async Task<IResult> GetAllTenantsAsync(IDatabaseService databaseService)
    {
        try
        {
            var tenants = await databaseService.GetAllTenantsAsync();
            
            return Results.Ok(new { tenants, count = tenants.Count });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving tenants: {ex.Message}");
        }
    }

    // Admin: Get all pages (optionally filtered by tenant) (JWT authentication at endpoint level)
    public static async Task<IResult> GetAllPagesAsync(IDatabaseService databaseService, string? tenantId = null)
    {
        try
        {
            var pages = await databaseService.GetAllPagesAsync(tenantId);
            
            return Results.Ok(new { pages, count = pages.Count, tenantId = tenantId ?? "all" });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving pages: {ex.Message}");
        }
    }

    // Admin: Get hub pages for a tenant (JWT authentication at endpoint level)
    public static async Task<IResult> GetHubPagesAsync(IDatabaseService databaseService, string tenantId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            var hubPages = await databaseService.GetHubPagesAsync(tenantId);
            
            return Results.Ok(new { tenantId, hubPages, count = hubPages.Count });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving hub pages: {ex.Message}");
        }
    }

    // Admin: Get spoke pages for a hub (JWT authentication at endpoint level)
    public static async Task<IResult> GetSpokePagesAsync(IDatabaseService databaseService, string tenantId, string hubPageSlug)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            
            if (string.IsNullOrEmpty(hubPageSlug))
                return Results.BadRequest("Hub page slug is required");

            var spokePages = await databaseService.GetSpokePagesAsync(tenantId, hubPageSlug);
            
            return Results.Ok(new { tenantId, hubPageSlug, spokePages, count = spokePages.Count });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving spoke pages: {ex.Message}");
        }
    }

    // Admin: Get complete content hierarchy visualization (JWT authentication at endpoint level)
    public static async Task<IResult> GetContentHierarchyAsync(IDatabaseService databaseService, string tenantId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            var hierarchy = await databaseService.GetContentHierarchyAsync(tenantId);
            
            return Results.Ok(hierarchy);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving content hierarchy: {ex.Message}");
        }
    }

    // ===== THEME METHODS (Content Serving - API Key) =====

    public static async Task<IResult> GetThemeAsync(IDatabaseService databaseService, string apiKey, string tenantId, string themeId, ILogger? logger = null)
    {
        try
        {
            logger?.LogInformation("GetThemeAsync called - TenantId: {TenantId}, ThemeId: {ThemeId}", tenantId, themeId);

            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(themeId))
                return Results.BadRequest("Theme ID is required");

            var theme = await databaseService.GetThemeAsync(apiKey, tenantId, themeId);

            if (theme == null)
            {
                logger?.LogWarning("GetThemeAsync - Theme not found or access denied - TenantId: {TenantId}, ThemeId: {ThemeId}", tenantId, themeId);
                return Results.NotFound("Theme not found or access denied");
            }

            return Results.Ok(theme);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "GetThemeAsync - Error - TenantId: {TenantId}, ThemeId: {ThemeId}", tenantId, themeId);
            return Results.Problem($"Error retrieving theme: {ex.Message}");
        }
    }

    public static async Task<IResult> GetActiveThemeAsync(IDatabaseService databaseService, string apiKey, string tenantId, ILogger? logger = null)
    {
        try
        {
            logger?.LogInformation("GetActiveThemeAsync called - TenantId: {TenantId}", tenantId);

            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            var theme = await databaseService.GetActiveThemeAsync(apiKey, tenantId);

            if (theme == null)
            {
                logger?.LogWarning("GetActiveThemeAsync - No active theme - TenantId: {TenantId}", tenantId);
                return Results.NotFound("No active theme found for this tenant");
            }

            return Results.Ok(theme);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "GetActiveThemeAsync - Error - TenantId: {TenantId}", tenantId);
            return Results.Problem($"Error retrieving active theme: {ex.Message}");
        }
    }

    // ===== THEME ADMIN METHODS (JWT Authentication) =====

    public static async Task<IResult> GetThemeAdminAsync(IDatabaseService databaseService, string tenantId, string themeId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(themeId))
                return Results.BadRequest("Theme ID is required");

            var theme = await databaseService.GetThemeAdminAsync(tenantId, themeId);

            if (theme == null)
                return Results.NotFound("Theme not found");

            return Results.Ok(theme);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving theme: {ex.Message}");
        }
    }

    public static async Task<IResult> GetActiveThemeAdminAsync(IDatabaseService databaseService, string tenantId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            var theme = await databaseService.GetActiveThemeAdminAsync(tenantId);

            if (theme == null)
                return Results.NotFound("No active theme found for this tenant");

            return Results.Ok(theme);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving active theme: {ex.Message}");
        }
    }

    public static async Task<IResult> GetThemesByTenantAsync(IDatabaseService databaseService, string tenantId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            var themes = await databaseService.GetThemesByTenantAsync(tenantId);
            var activeTheme = await databaseService.GetActiveThemeAdminAsync(tenantId);
            var activeThemeId = activeTheme?.ThemeId;

            if (!string.IsNullOrWhiteSpace(activeThemeId))
            {
                foreach (var theme in themes)
                {
                    theme.IsActive = theme.ThemeId == activeThemeId;
                }
            }

            return Results.Ok(new { themes, count = themes.Count, tenantId, activeThemeId });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving themes: {ex.Message}");
        }
    }

    public static async Task<IResult> CreateThemeAsync(IDatabaseService databaseService, string tenantId, Theme theme)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (theme == null)
                return Results.BadRequest("Theme data is required");
            if (string.IsNullOrEmpty(theme.ThemeId))
                return Results.BadRequest("Theme ID is required");

            var created = await databaseService.CreateThemeAsync(tenantId, theme);

            return Results.Created($"/api/admin/themes/{tenantId}/{created.ThemeId}", created);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error creating theme: {ex.Message}");
        }
    }

    public static async Task<IResult> UpdateThemeAsync(IDatabaseService databaseService, string tenantId, string themeId, Theme theme)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(themeId))
                return Results.BadRequest("Theme ID is required");
            if (theme == null)
                return Results.BadRequest("Theme data is required");

            var updated = await databaseService.UpdateThemeAsync(tenantId, themeId, theme);

            return Results.Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error updating theme: {ex.Message}");
        }
    }

    public static async Task<IResult> ActivateThemeAsync(IDatabaseService databaseService, string tenantId, string themeId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(themeId))
                return Results.BadRequest("Theme ID is required");

            var activated = await databaseService.ActivateThemeAsync(tenantId, themeId);
            return Results.Ok(activated);
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error activating theme: {ex.Message}");
        }
    }

    public static async Task<IResult> DeleteThemeAsync(IDatabaseService databaseService, string tenantId, string themeId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(themeId))
                return Results.BadRequest("Theme ID is required");

            var deleted = await databaseService.DeleteThemeAsync(tenantId, themeId);

            if (deleted)
                return Results.Ok(new { message = "Theme deleted successfully", tenantId, themeId });

            return Results.NotFound("Theme not found");
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error deleting theme: {ex.Message}");
        }
    }

    // ===== FORM DEFINITION — content serving (API key) =====

    /// <summary>
    /// Returns the active FormDefinition for the given type so the frontend can render the form.
    /// </summary>
    public static async Task<IResult> GetFormDefinitionPublicAsync(
        IDatabaseService databaseService, string apiKey, string tenantId, string type)
    {
        try
        {
            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(type))
                return Results.BadRequest("Form type is required");

            var definition = await databaseService.GetFormDefinitionPublicAsync(apiKey, tenantId, type);

            if (definition == null)
                return Results.NotFound("Form definition not found or access denied");

            var tenant = await databaseService.GetTenantAsync(tenantId);
            ApplyPublicCaptchaSettings(definition, tenant);

            return Results.Ok(definition);
        }
        catch (UnauthorizedAccessException)
        {
            return Results.Unauthorized();
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving form definition: {ex.Message}");
        }
    }

    /// <summary>
    /// Accepts a flat field dictionary from the frontend, looks up the FormDefinition,
    /// validates required fields, then saves a FormEntry.
    /// ipAddress, userAgent, submittedAt, status, and source are set server-side.
    /// </summary>
    public static async Task<IResult> SubmitFormAsync(
        IDatabaseService databaseService,
        string apiKey,
        string tenantId,
        string type,
        Dictionary<string, object?> formData,
        HttpContext httpContext,
        ICaptchaVerifier? captchaVerifier = null)
    {
        try
        {
            if (string.IsNullOrEmpty(apiKey))
                return Results.BadRequest("API key is required");
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(type))
                return Results.BadRequest("Form type is required");
            if (formData == null)
                return Results.BadRequest("Form data is required");

            var normalizedType = type.Trim().ToLowerInvariant();

            // Fetch the definition to validate required fields
            var definition = await databaseService.GetFormDefinitionPublicAsync(apiKey, tenantId, normalizedType);

            if (definition == null)
                return Results.NotFound("Form definition not found or access denied");

            if (!definition.IsActive)
                return Results.BadRequest("This form is not currently accepting submissions");

            var spamResult = ValidateSpamProtection(definition, formData);
            if (spamResult != null)
                return spamResult;

            var ipAddress = GetClientIpAddress(httpContext);
            var rateLimitResult = ValidateRateLimit(definition, tenantId, normalizedType, ipAddress);
            if (rateLimitResult != null)
                return rateLimitResult;

            var tenant = await databaseService.GetTenantAsync(tenantId);
            var captchaResult = await ValidateCaptchaAsync(
                definition,
                tenant,
                formData,
                ipAddress,
                captchaVerifier,
                httpContext.RequestAborted);
            if (captchaResult != null)
                return captchaResult;

            var allowedFieldNames = definition.Fields
                .Select(f => f.Name)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            var unknownFields = formData.Keys
                .Where(key => !allowedFieldNames.Contains(key))
                .Where(key => !key.StartsWith("_", StringComparison.Ordinal))
                .Where(key => !key.Equals("pageSlug", StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (unknownFields.Any())
                return Results.BadRequest($"Unknown fields submitted: {string.Join(", ", unknownFields)}");

            // Validate required fields
            var missingFields = definition.Fields
                .Where(f => f.Required && !f.Hidden)
                .Where(f => !formData.ContainsKey(f.Name) ||
                            formData[f.Name] == null ||
                            string.IsNullOrWhiteSpace(GetStringValue(formData[f.Name])))
                .Select(f => f.Label)
                .ToList();

            if (missingFields.Any())
                return Results.BadRequest($"Required fields missing: {string.Join(", ", missingFields)}");

            var validationErrors = ValidateFieldValues(definition, formData);
            if (validationErrors.Any())
                return Results.BadRequest($"Invalid fields: {string.Join("; ", validationErrors)}");

            var sanitizedFormData = BuildSanitizedFormData(definition, formData);

            // Build the FormEntry
            var entry = new FormEntry
            {
                Id = $"{normalizedType}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid():N}",
                Type = normalizedType,
                TenantId = tenantId,
                FormDefinitionId = definition.FormDefinitionId,
                PageSlug = GetStringValue(GetOptionalValue(formData, "pageSlug")) ?? GetStringValue(GetOptionalValue(formData, "_pageSlug")) ?? string.Empty,
                FormData = sanitizedFormData,
                SubmittedAt = DateTime.UtcNow,
                Status = FormEntryStatuses.New,
                Source = "website_form",
                IpAddress = ipAddress,
                UserAgent = httpContext.Request.Headers.UserAgent.FirstOrDefault() ?? string.Empty,
                Metadata = new FormEntryMetadata
                {
                    Referrer = httpContext.Request.Headers.Referer.FirstOrDefault() ?? string.Empty,
                    UtmSource = GetStringValue(GetOptionalValue(formData, "_utmSource")) ?? string.Empty,
                    UtmMedium = GetStringValue(GetOptionalValue(formData, "_utmMedium")) ?? string.Empty,
                    UtmCampaign = GetStringValue(GetOptionalValue(formData, "_utmCampaign")) ?? string.Empty
                }
            };

            var saved = await databaseService.SaveFormEntryAsync(apiKey, tenantId, entry);

            return Results.Created($"/api/forms/{tenantId}/entries/{saved.Id}", saved);
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
            return Results.Problem($"Error submitting form: {ex.Message}");
        }
    }

    // ===== FORM DEFINITION — admin (JWT) =====

    public static async Task<IResult> GetFormDefinitionsByTenantAsync(
        IDatabaseService databaseService, string tenantId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            var definitions = await databaseService.GetFormDefinitionsByTenantAsync(tenantId);

            return Results.Ok(new { definitions, count = definitions.Count, tenantId });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving form definitions: {ex.Message}");
        }
    }

    public static async Task<IResult> GetFormDefinitionAsync(
        IDatabaseService databaseService, string tenantId, string formDefinitionId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(formDefinitionId))
                return Results.BadRequest("Form definition ID is required");

            var definition = await databaseService.GetFormDefinitionAsync(tenantId, formDefinitionId);

            if (definition == null)
                return Results.NotFound("Form definition not found");

            return Results.Ok(definition);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving form definition: {ex.Message}");
        }
    }

    public static async Task<IResult> CreateFormDefinitionAsync(
        IDatabaseService databaseService, string tenantId, FormDefinition formDefinition)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (formDefinition == null)
                return Results.BadRequest("Form definition data is required");
            if (string.IsNullOrEmpty(formDefinition.Type))
                return Results.BadRequest("Form definition type is required");
            if (!IsValidSubmitRedirect(formDefinition))
                return Results.BadRequest("Redirect URL must be a relative site path or an absolute HTTP(S) URL");
            if (!IsValidCaptchaAction(formDefinition))
                return Results.BadRequest("CAPTCHA action must use 1-32 letters, numbers, underscores, or hyphens");

            formDefinition.TenantId = tenantId;
            if (string.IsNullOrEmpty(formDefinition.FormDefinitionId))
                formDefinition.FormDefinitionId = formDefinition.Id;

            var created = await databaseService.CreateFormDefinitionAsync(tenantId, formDefinition);

            return Results.Created($"/api/admin/forms/{tenantId}/definitions/{created.FormDefinitionId}", created);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error creating form definition: {ex.Message}");
        }
    }

    public static async Task<IResult> UpdateFormDefinitionAsync(
        IDatabaseService databaseService, string tenantId, string formDefinitionId, FormDefinition formDefinition)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(formDefinitionId))
                return Results.BadRequest("Form definition ID is required");
            if (formDefinition == null)
                return Results.BadRequest("Form definition data is required");
            if (!IsValidSubmitRedirect(formDefinition))
                return Results.BadRequest("Redirect URL must be a relative site path or an absolute HTTP(S) URL");
            if (!IsValidCaptchaAction(formDefinition))
                return Results.BadRequest("CAPTCHA action must use 1-32 letters, numbers, underscores, or hyphens");

            var updated = await databaseService.UpdateFormDefinitionAsync(tenantId, formDefinitionId, formDefinition);

            return Results.Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error updating form definition: {ex.Message}");
        }
    }

    public static async Task<IResult> DeleteFormDefinitionAsync(
        IDatabaseService databaseService, string tenantId, string formDefinitionId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(formDefinitionId))
                return Results.BadRequest("Form definition ID is required");

            var deleted = await databaseService.DeleteFormDefinitionAsync(tenantId, formDefinitionId);

            if (deleted)
                return Results.Ok(new { message = "Form definition deleted successfully", tenantId, formDefinitionId });

            return Results.NotFound("Form definition not found");
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error deleting form definition: {ex.Message}");
        }
    }

    // ===== FORM ENTRY — admin (JWT) =====

    public static async Task<IResult> GetFormEntriesByTenantAsync(
        IDatabaseService databaseService, string tenantId, string? type = null)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");

            var entries = await databaseService.GetFormEntriesByTenantAsync(tenantId, type);

            return Results.Ok(new { entries, count = entries.Count, tenantId, type = type ?? "all" });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving form entries: {ex.Message}");
        }
    }

    public static async Task<IResult> GetFormEntryAsync(
        IDatabaseService databaseService, string tenantId, string entryId)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(entryId))
                return Results.BadRequest("Entry ID is required");

            var entry = await databaseService.GetFormEntryAsync(tenantId, entryId);

            if (entry == null)
                return Results.NotFound("Form entry not found");

            return Results.Ok(entry);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error retrieving form entry: {ex.Message}");
        }
    }

    public static async Task<IResult> UpdateFormEntryStatusAsync(
        IDatabaseService databaseService, string tenantId, string entryId, string status)
    {
        try
        {
            if (string.IsNullOrEmpty(tenantId))
                return Results.BadRequest("Tenant ID is required");
            if (string.IsNullOrEmpty(entryId))
                return Results.BadRequest("Entry ID is required");
            if (string.IsNullOrEmpty(status))
                return Results.BadRequest("Status is required");

            var updated = await databaseService.UpdateFormEntryStatusAsync(tenantId, entryId, status);

            return Results.Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error updating form entry status: {ex.Message}");
        }
    }

    private static IResult? ValidateSpamProtection(FormDefinition definition, Dictionary<string, object?> formData)
    {
        var spam = definition.SpamProtection;
        if (spam.RejectWhenHoneypotFilled &&
            !string.IsNullOrWhiteSpace(spam.HoneypotFieldName) &&
            !string.IsNullOrWhiteSpace(GetStringValue(GetOptionalValue(formData, spam.HoneypotFieldName))))
        {
            return Results.BadRequest("Submission rejected");
        }

        if (spam.RequireConsent &&
            !string.IsNullOrWhiteSpace(spam.ConsentFieldName) &&
            !IsTruthy(GetOptionalValue(formData, spam.ConsentFieldName)))
        {
            return Results.BadRequest("Consent is required");
        }

        return null;
    }

    private static IResult? ValidateRateLimit(FormDefinition definition, string tenantId, string formType, string ipAddress)
    {
        var rateLimit = definition.RateLimit;
        if (!rateLimit.Enabled)
        {
            return null;
        }

        var maxSubmissions = Math.Max(rateLimit.MaxSubmissions, 1);
        var windowSeconds = Math.Max(rateLimit.WindowSeconds, 1);
        var now = DateTimeOffset.UtcNow;
        var windowStart = now.AddSeconds(-windowSeconds);
        var key = $"{tenantId}:{formType}:{ipAddress}";
        var submissions = FormSubmissionWindows.GetOrAdd(key, _ => new List<DateTimeOffset>());

        lock (submissions)
        {
            submissions.RemoveAll(timestamp => timestamp < windowStart);
            if (submissions.Count >= maxSubmissions)
            {
                return Results.Json(
                    new { message = "Too many submissions. Please wait and try again." },
                    statusCode: StatusCodes.Status429TooManyRequests);
            }

            submissions.Add(now);
        }

        CleanupRateLimitWindows(windowStart);
        return null;
    }

    private static async Task<IResult?> ValidateCaptchaAsync(
        FormDefinition definition,
        Tenant? tenant,
        Dictionary<string, object?> formData,
        string ipAddress,
        ICaptchaVerifier? captchaVerifier,
        CancellationToken cancellationToken)
    {
        var (required, settings, action) = ResolveCaptchaSettings(definition, tenant);
        if (!required)
            return null;

        if (!string.Equals(settings.Provider, CaptchaProviders.Turnstile, StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(settings.SiteKey) ||
            captchaVerifier == null)
        {
            return Results.Json(
                new { message = "This form's CAPTCHA is not configured correctly." },
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        var token = GetStringValue(GetOptionalValue(formData, "_captchaToken"));
        if (string.IsNullOrWhiteSpace(token) || token.Length > 2048)
            return Results.BadRequest("Please complete the CAPTCHA challenge");

        var verification = await captchaVerifier.VerifyAsync(
            settings,
            token,
            ipAddress,
            action,
            cancellationToken);

        return verification.Success
            ? null
            : Results.BadRequest("CAPTCHA verification failed. Please try again.");
    }

    private static void ApplyPublicCaptchaSettings(FormDefinition definition, Tenant? tenant)
    {
        definition.SpamProtection ??= new FormSpamProtection();
        var (required, settings, action) = ResolveCaptchaSettings(definition, tenant);
        definition.SpamProtection.Captcha = new FormCaptchaSettings
        {
            Mode = required ? FormCaptchaModes.Required : FormCaptchaModes.Disabled,
            Provider = required ? settings.Provider : CaptchaProviders.None,
            SiteKey = required ? settings.SiteKey : string.Empty,
            Action = action,
        };
    }

    private static (bool Required, TenantCaptchaSettings Settings, string Action) ResolveCaptchaSettings(
        FormDefinition definition,
        Tenant? tenant)
    {
        var formCaptcha = definition.SpamProtection?.Captcha ?? new FormCaptchaSettings();
        var tenantCaptcha = tenant?.Settings?.FormSecurity?.Captcha ?? new TenantCaptchaSettings();
        var required = string.Equals(formCaptcha.Mode, FormCaptchaModes.Required, StringComparison.OrdinalIgnoreCase) ||
            (string.Equals(formCaptcha.Mode, FormCaptchaModes.Inherit, StringComparison.OrdinalIgnoreCase) &&
             tenantCaptcha.EnabledByDefault);
        if (string.Equals(formCaptcha.Mode, FormCaptchaModes.Disabled, StringComparison.OrdinalIgnoreCase))
            required = false;

        var action = string.IsNullOrWhiteSpace(formCaptcha.Action)
            ? "form_submit"
            : formCaptcha.Action.Trim();
        return (required, tenantCaptcha, action);
    }

    private static bool IsValidSubmitRedirect(FormDefinition definition)
    {
        if (!string.Equals(definition.SubmitBehavior, FormSubmitBehavior.Redirect, StringComparison.OrdinalIgnoreCase))
            return true;

        var redirectUrl = definition.RedirectUrl?.Trim() ?? string.Empty;
        if (redirectUrl.StartsWith('/') && !redirectUrl.StartsWith("//", StringComparison.Ordinal))
            return true;

        return Uri.TryCreate(redirectUrl, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    private static bool IsValidCaptchaAction(FormDefinition definition)
    {
        var action = definition.SpamProtection?.Captcha?.Action;
        return string.IsNullOrWhiteSpace(action) || Regex.IsMatch(action, "^[a-zA-Z0-9_-]{1,32}$");
    }

    private static void CleanupRateLimitWindows(DateTimeOffset oldestAllowed)
    {
        foreach (var item in FormSubmissionWindows)
        {
            lock (item.Value)
            {
                item.Value.RemoveAll(timestamp => timestamp < oldestAllowed);
                if (item.Value.Count == 0)
                {
                    FormSubmissionWindows.TryRemove(item.Key, out _);
                }
            }
        }
    }

    private static string GetClientIpAddress(HttpContext httpContext)
    {
        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            return forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .FirstOrDefault() ?? string.Empty;
        }

        var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(realIp))
        {
            return realIp;
        }

        return httpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
    }

    private static List<string> ValidateFieldValues(FormDefinition definition, Dictionary<string, object?> formData)
    {
        var errors = new List<string>();
        foreach (var field in definition.Fields.Where(f => !f.Hidden))
        {
            if (!formData.TryGetValue(field.Name, out var rawValue) || rawValue == null)
            {
                continue;
            }

            var value = GetStringValue(rawValue);
            if (string.IsNullOrWhiteSpace(value))
            {
                continue;
            }

            if (field.Type.Equals(FormFieldTypes.Email, StringComparison.OrdinalIgnoreCase) &&
                !Regex.IsMatch(value, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            {
                errors.Add($"{field.Label} must be a valid email address");
            }

            if ((field.Type.Equals(FormFieldTypes.Select, StringComparison.OrdinalIgnoreCase) ||
                 field.Type.Equals(FormFieldTypes.Radio, StringComparison.OrdinalIgnoreCase)) &&
                field.Options?.Any() == true &&
                !field.Options.Any(option => option.Value == value))
            {
                errors.Add($"{field.Label} has an invalid option");
            }

            if (field.Validation.MinLength.HasValue && value.Length < field.Validation.MinLength.Value)
            {
                errors.Add(GetValidationMessage(field, $"minimum length is {field.Validation.MinLength.Value}"));
            }

            if (field.Validation.MaxLength.HasValue && value.Length > field.Validation.MaxLength.Value)
            {
                errors.Add(GetValidationMessage(field, $"maximum length is {field.Validation.MaxLength.Value}"));
            }

            if (!string.IsNullOrWhiteSpace(field.Validation.Pattern) &&
                !Regex.IsMatch(value, field.Validation.Pattern))
            {
                errors.Add(GetValidationMessage(field, "format is invalid"));
            }

            if ((field.Validation.Min.HasValue || field.Validation.Max.HasValue) &&
                decimal.TryParse(value, out var numericValue))
            {
                if (field.Validation.Min.HasValue && numericValue < field.Validation.Min.Value)
                {
                    errors.Add(GetValidationMessage(field, $"minimum value is {field.Validation.Min.Value}"));
                }

                if (field.Validation.Max.HasValue && numericValue > field.Validation.Max.Value)
                {
                    errors.Add(GetValidationMessage(field, $"maximum value is {field.Validation.Max.Value}"));
                }
            }
        }

        return errors;
    }

    private static Dictionary<string, object?> BuildSanitizedFormData(FormDefinition definition, Dictionary<string, object?> formData)
    {
        var sanitized = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        foreach (var field in definition.Fields)
        {
            if (formData.TryGetValue(field.Name, out var value))
            {
                sanitized[field.Name] = NormalizeFormValue(value);
            }
            else if (field.DefaultValue != null)
            {
                sanitized[field.Name] = field.DefaultValue;
            }
        }

        return sanitized;
    }

    private static object? GetOptionalValue(Dictionary<string, object?> formData, string key)
    {
        return formData.TryGetValue(key, out var value) ? value : null;
    }

    private static object? NormalizeFormValue(object? value)
    {
        if (value is JsonElement jsonElement)
        {
            return jsonElement.ValueKind switch
            {
                JsonValueKind.String => jsonElement.GetString(),
                JsonValueKind.Number => jsonElement.GetRawText(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Null => null,
                _ => jsonElement.GetRawText()
            };
        }

        return value;
    }

    private static string? GetStringValue(object? value)
    {
        var normalized = NormalizeFormValue(value);
        return normalized switch
        {
            null => null,
            string stringValue => stringValue,
            bool boolValue => boolValue ? "true" : "false",
            _ => normalized.ToString()
        };
    }

    private static bool IsTruthy(object? value)
    {
        return GetStringValue(value)?.Trim().ToLowerInvariant() switch
        {
            "true" => true,
            "1" => true,
            "yes" => true,
            "on" => true,
            _ => false
        };
    }

    private static string GetValidationMessage(FormFieldDefinition field, string fallback)
    {
        return string.IsNullOrWhiteSpace(field.Validation.Message)
            ? $"{field.Label} {fallback}"
            : field.Validation.Message;
    }
}
