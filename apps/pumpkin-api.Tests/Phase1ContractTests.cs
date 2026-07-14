using Microsoft.AspNetCore.Http;
using pumpkin_api.Managers;
using pumpkin_api.Services;
using pumpkin_net_models.Models;
using System.Text.Json;

namespace pumpkin_api.Tests;

public static class Phase1ContractTests
{
    public static async Task RunAllAsync()
    {
        var tests = new List<(string Name, Func<Task> Run)>
        {
            ("theme activation updates active pointer", ThemeActivationUpdatesActivePointerAsync),
            ("theme delete clears active pointer", ThemeDeleteClearsActivePointerAsync),
            ("form submit sanitizes and captures metadata", FormSubmitSanitizesAndCapturesMetadataAsync),
            ("form submit rejects missing required field", FormSubmitRejectsMissingRequiredFieldAsync),
            ("form submit rejects honeypot spam", FormSubmitRejectsHoneypotSpamAsync),
            ("form entry status stamps lifecycle dates", FormEntryStatusStampsLifecycleDatesAsync),
            ("HTML block editor fields survive JSON round trip", HtmlBlockEditorFieldsSurviveJsonRoundTripAsync),
        };

        Console.WriteLine("Running Phase 1 contract tests...");
        foreach (var test in tests)
        {
            await test.Run();
            Console.WriteLine($"  PASS {test.Name}");
        }

        Console.WriteLine("Phase 1 contract tests passed.");
    }

    private static Task HtmlBlockEditorFieldsSurviveJsonRoundTripAsync()
    {
        const string json = """
        {
          "id": "homepage-hero",
          "name": "Homepage Hero",
          "enabled": false,
          "type": "Hero",
          "content": {
            "type": "Main",
            "headline": "Headline",
            "subheadline": "Subheadline",
            "backgroundImage": "",
            "backgroundImageAltText": "",
            "mainImage": "",
            "mainImageAltText": "",
            "buttonText": "Start",
            "buttonLink": "/start"
          }
        }
        """;

        var block = HtmlBlockFactory.CreateBlock(json);
        Assert(block != null, "known block should deserialize");
        Assert(block!.Id == "homepage-hero", "block id should deserialize");
        Assert(block.Name == "Homepage Hero", "block name should deserialize");
        Assert(block.Enabled == false, "block enabled state should deserialize");

        var serialized = JsonSerializer.Serialize(block, block.GetType());
        using var document = JsonDocument.Parse(serialized);
        var root = document.RootElement;
        Assert(root.GetProperty("id").GetString() == "homepage-hero", "block id should serialize");
        Assert(root.GetProperty("name").GetString() == "Homepage Hero", "block name should serialize");
        Assert(root.GetProperty("enabled").GetBoolean() == false, "block enabled state should serialize");
        return Task.CompletedTask;
    }

    private static async Task ThemeActivationUpdatesActivePointerAsync()
    {
        var service = new InMemoryPhase1DatabaseService();
        await service.CreateTenantAsync(new Tenant { TenantId = "tenant-a", Id = "tenant-a" });

        await service.CreateThemeAsync("tenant-a", NewTheme("light", isActive: true));
        await service.CreateThemeAsync("tenant-a", NewTheme("ocean", isActive: false));

        var result = await PumpkinManager.ActivateThemeAsync(service, "tenant-a", "ocean");
        await AssertStatusAsync(result, StatusCodes.Status200OK);

        Assert((await service.GetThemeAdminAsync("tenant-a", "light"))?.IsActive == false, "previous theme should be inactive");
        Assert((await service.GetThemeAdminAsync("tenant-a", "ocean"))?.IsActive == true, "activated theme should be active");
        Assert((await service.GetTenantAsync("tenant-a"))?.Settings.Theme == "ocean", "tenant active theme pointer should be updated");
    }

    private static async Task ThemeDeleteClearsActivePointerAsync()
    {
        var service = new InMemoryPhase1DatabaseService();
        await service.CreateTenantAsync(new Tenant { TenantId = "tenant-a", Id = "tenant-a" });

        await service.CreateThemeAsync("tenant-a", NewTheme("light", isActive: true));
        var deleted = await service.DeleteThemeAsync("tenant-a", "light");

        Assert(deleted, "active theme should delete");
        Assert((await service.GetTenantAsync("tenant-a"))?.Settings.Theme == string.Empty, "deleting active theme should clear tenant pointer");
    }

    private static async Task FormSubmitSanitizesAndCapturesMetadataAsync()
    {
        var service = new InMemoryPhase1DatabaseService();
        service.PublicFormDefinition = NewContactFormDefinition();

        var formData = new Dictionary<string, object?>
        {
            ["name"] = "Avery",
            ["email"] = "avery@example.com",
            ["message"] = "Hello from the test",
            ["_website"] = "",
            ["_consent"] = true,
            ["_pageSlug"] = "/contact",
            ["_utmSource"] = "newsletter",
        };

        var result = await PumpkinManager.SubmitFormAsync(
            service,
            "api-key",
            "tenant-a",
            "contact_submission",
            formData,
            NewHttpContext());

        await AssertStatusAsync(result, StatusCodes.Status201Created);
        Assert(service.SavedEntries.Count == 1, "one entry should be saved");

        var saved = service.SavedEntries.Single();
        Assert(saved.FormData.ContainsKey("name"), "defined field should be saved");
        Assert(!saved.FormData.ContainsKey("_website"), "honeypot should not be saved");
        Assert(!saved.FormData.ContainsKey("_pageSlug"), "metadata field should not be saved as form data");
        Assert(saved.Status == FormEntryStatuses.New, "new submissions should use new status");
        Assert(saved.PageSlug == "/contact", "page slug should be captured");
        Assert(saved.Metadata.UtmSource == "newsletter", "utm source should be captured");
    }

    private static async Task FormSubmitRejectsMissingRequiredFieldAsync()
    {
        var service = new InMemoryPhase1DatabaseService();
        service.PublicFormDefinition = NewContactFormDefinition();

        var result = await PumpkinManager.SubmitFormAsync(
            service,
            "api-key",
            "tenant-a",
            "contact_submission",
            new Dictionary<string, object?> { ["email"] = "avery@example.com", ["_consent"] = true },
            NewHttpContext());

        await AssertStatusAsync(result, StatusCodes.Status400BadRequest);
        Assert(service.SavedEntries.Count == 0, "invalid submissions should not be saved");
    }

    private static async Task FormSubmitRejectsHoneypotSpamAsync()
    {
        var service = new InMemoryPhase1DatabaseService();
        service.PublicFormDefinition = NewContactFormDefinition();

        var result = await PumpkinManager.SubmitFormAsync(
            service,
            "api-key",
            "tenant-a",
            "contact_submission",
            new Dictionary<string, object?>
            {
                ["name"] = "Avery",
                ["email"] = "avery@example.com",
                ["message"] = "Hello",
                ["_website"] = "filled-by-bot",
                ["_consent"] = true,
            },
            NewHttpContext());

        await AssertStatusAsync(result, StatusCodes.Status400BadRequest);
        Assert(service.SavedEntries.Count == 0, "spam submissions should not be saved");
    }

    private static async Task FormEntryStatusStampsLifecycleDatesAsync()
    {
        var service = new InMemoryPhase1DatabaseService();
        var entry = await service.SaveFormEntryAsync("api-key", "tenant-a", new FormEntry
        {
            Id = "entry-1",
            TenantId = "tenant-a",
            Type = "contact_submission",
        });

        Assert(entry.Status == FormEntryStatuses.New, "saved entries should default to new");

        var read = await service.UpdateFormEntryStatusAsync("tenant-a", "entry-1", FormEntryStatuses.Read);
        Assert(read.ReadAt != null, "read status should stamp ReadAt");

        var actioned = await service.UpdateFormEntryStatusAsync("tenant-a", "entry-1", FormEntryStatuses.Actioned);
        Assert(actioned.ActionedAt != null, "actioned status should stamp ActionedAt");

        var archived = await service.UpdateFormEntryStatusAsync("tenant-a", "entry-1", FormEntryStatuses.Archived);
        Assert(archived.ArchivedAt != null, "archived status should stamp ArchivedAt");
    }

    private static Theme NewTheme(string id, bool isActive)
    {
        return new Theme
        {
            ThemeId = id,
            Id = id,
            Name = id,
            Label = id,
            IsActive = isActive,
            CssVariables = new Dictionary<string, string>
            {
                ["--background"] = "#ffffff",
                ["--foreground"] = "#111111",
                ["--primary"] = "#f97316",
            },
        };
    }

    private static FormDefinition NewContactFormDefinition()
    {
        return new FormDefinition
        {
            FormDefinitionId = "contact-form",
            TenantId = "tenant-a",
            Name = "Contact",
            Type = "contact_submission",
            IsActive = true,
            SpamProtection = new FormSpamProtection
            {
                HoneypotFieldName = "_website",
                RejectWhenHoneypotFilled = true,
                RequireConsent = true,
                ConsentFieldName = "_consent",
            },
            Fields = new List<FormFieldDefinition>
            {
                new() { Name = "name", Label = "Name", Type = FormFieldTypes.Text, Required = true },
                new()
                {
                    Name = "email",
                    Label = "Email",
                    Type = FormFieldTypes.Email,
                    Required = true,
                    Validation = new FormFieldValidation { Pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$" },
                },
                new() { Name = "message", Label = "Message", Type = FormFieldTypes.Textarea, Required = true },
            },
        };
    }

    private static DefaultHttpContext NewHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
        context.Request.Headers.UserAgent = "phase1-contract-tests";
        return context;
    }

    private static async Task AssertStatusAsync(IResult result, int expectedStatusCode)
    {
        await Task.CompletedTask;
        if (result is IStatusCodeHttpResult statusResult)
        {
            var actualStatusCode = statusResult.StatusCode ?? StatusCodes.Status200OK;
            Assert(actualStatusCode == expectedStatusCode, $"expected status {expectedStatusCode}, got {actualStatusCode}");
            return;
        }

        throw new InvalidOperationException($"Result {result.GetType().Name} does not expose a status code");
    }

    private static void Assert(bool condition, string message)
    {
        if (!condition)
        {
            throw new InvalidOperationException(message);
        }
    }
}

internal sealed class InMemoryPhase1DatabaseService : IDatabaseService
{
    private readonly Dictionary<string, Tenant> _tenants = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<(string TenantId, string ThemeId), Theme> _themes = new();
    private readonly Dictionary<(string TenantId, string EntryId), FormEntry> _entries = new();

    public FormDefinition? PublicFormDefinition { get; set; }
    public List<FormEntry> SavedEntries { get; } = new();

    public Task<Tenant?> GetTenantAsync(string tenantId)
        => Task.FromResult(_tenants.GetValueOrDefault(tenantId));

    public Task<Tenant> CreateTenantAsync(Tenant tenant)
    {
        tenant.TenantId = string.IsNullOrWhiteSpace(tenant.TenantId) ? tenant.Id : tenant.TenantId;
        tenant.Id = string.IsNullOrWhiteSpace(tenant.Id) ? tenant.TenantId : tenant.Id;
        tenant.Settings ??= new TenantSettings();
        _tenants[tenant.TenantId] = tenant;
        return Task.FromResult(tenant);
    }

    public Task<Theme?> GetThemeAdminAsync(string tenantId, string themeId)
        => Task.FromResult(_themes.GetValueOrDefault((tenantId, themeId)));

    public Task<Theme?> GetActiveThemeAdminAsync(string tenantId)
    {
        if (_tenants.TryGetValue(tenantId, out var tenant) && !string.IsNullOrWhiteSpace(tenant.Settings?.Theme))
        {
            return GetThemeAdminAsync(tenantId, tenant.Settings.Theme);
        }

        var theme = _themes
            .Where(item => item.Key.TenantId.Equals(tenantId, StringComparison.OrdinalIgnoreCase))
            .Select(item => item.Value)
            .FirstOrDefault(item => item.IsActive);

        return Task.FromResult(theme);
    }

    public async Task<Theme> CreateThemeAsync(string tenantId, Theme theme)
    {
        theme.TenantId = tenantId;
        theme.ThemeId = string.IsNullOrWhiteSpace(theme.ThemeId) ? theme.Id : theme.ThemeId;
        theme.Id = theme.ThemeId;
        _themes[(tenantId, theme.ThemeId)] = theme;

        if (theme.IsActive)
        {
            return await ActivateThemeAsync(tenantId, theme.ThemeId);
        }

        return theme;
    }

    public async Task<Theme> UpdateThemeAsync(string tenantId, string themeId, Theme theme)
    {
        if (!_themes.ContainsKey((tenantId, themeId)))
        {
            throw new KeyNotFoundException("Theme not found");
        }

        theme.TenantId = tenantId;
        theme.ThemeId = themeId;
        theme.Id = themeId;
        _themes[(tenantId, themeId)] = theme;

        if (theme.IsActive)
        {
            return await ActivateThemeAsync(tenantId, themeId);
        }

        return theme;
    }

    public Task<Theme> ActivateThemeAsync(string tenantId, string themeId)
    {
        if (!_themes.TryGetValue((tenantId, themeId), out var theme))
        {
            throw new KeyNotFoundException("Theme not found");
        }

        foreach (var item in _themes.Where(item => item.Key.TenantId.Equals(tenantId, StringComparison.OrdinalIgnoreCase)))
        {
            item.Value.IsActive = false;
        }

        theme.IsActive = true;
        theme.UpdatedAt = DateTime.UtcNow;

        if (_tenants.TryGetValue(tenantId, out var tenant))
        {
            tenant.Settings ??= new TenantSettings();
            tenant.Settings.Theme = themeId;
            tenant.UpdatedAt = DateTime.UtcNow;
        }

        return Task.FromResult(theme);
    }

    public Task<bool> DeleteThemeAsync(string tenantId, string themeId)
    {
        _themes.TryGetValue((tenantId, themeId), out var existing);
        var deleted = _themes.Remove((tenantId, themeId));

        if (deleted &&
            existing?.IsActive == true &&
            _tenants.TryGetValue(tenantId, out var tenant) &&
            tenant.Settings?.Theme == themeId)
        {
            tenant.Settings ??= new TenantSettings();
            tenant.Settings.Theme = string.Empty;
            tenant.UpdatedAt = DateTime.UtcNow;
        }

        return Task.FromResult(deleted);
    }

    public Task<FormDefinition?> GetFormDefinitionPublicAsync(string apiKey, string tenantId, string type)
        => Task.FromResult(PublicFormDefinition?.Type == type ? PublicFormDefinition : null);

    public Task<FormEntry> SaveFormEntryAsync(string apiKey, string tenantId, FormEntry formEntry)
    {
        formEntry.TenantId = tenantId;
        formEntry.Id = string.IsNullOrWhiteSpace(formEntry.Id) ? Guid.NewGuid().ToString() : formEntry.Id;
        formEntry.Status = FormEntryStatuses.New;
        formEntry.SubmittedAt = formEntry.SubmittedAt == default ? DateTime.UtcNow : formEntry.SubmittedAt;
        formEntry.Source = string.IsNullOrWhiteSpace(formEntry.Source) ? "website" : formEntry.Source;
        _entries[(tenantId, formEntry.Id)] = formEntry;
        SavedEntries.Add(formEntry);
        return Task.FromResult(formEntry);
    }

    public Task<FormEntry?> GetFormEntryAsync(string tenantId, string entryId)
        => Task.FromResult(_entries.GetValueOrDefault((tenantId, entryId)));

    public Task<FormEntry> UpdateFormEntryStatusAsync(string tenantId, string entryId, string status)
    {
        if (!FormEntryStatuses.All.Contains(status))
        {
            throw new ArgumentException($"Invalid form entry status '{status}'");
        }

        if (!_entries.TryGetValue((tenantId, entryId), out var entry))
        {
            throw new KeyNotFoundException("Form entry not found");
        }

        entry.Status = status;

        if (status == FormEntryStatuses.Read && entry.ReadAt == null)
        {
            entry.ReadAt = DateTime.UtcNow;
        }
        else if (status == FormEntryStatuses.Actioned && entry.ActionedAt == null)
        {
            entry.ActionedAt = DateTime.UtcNow;
        }
        else if (status == FormEntryStatuses.Archived && entry.ArchivedAt == null)
        {
            entry.ArchivedAt = DateTime.UtcNow;
        }

        return Task.FromResult(entry);
    }

    public Task<Page?> GetPageAsync(string apiKey, string tenantId, string pageSlug) => throw new NotSupportedException();
    public Task<Page> SavePageAsync(string apiKey, string tenantId, Page page) => throw new NotSupportedException();
    public Task<Page> UpdatePageAsync(string apiKey, string tenantId, string pageSlug, Page page) => throw new NotSupportedException();
    public Task<bool> DeletePageAsync(string apiKey, string tenantId, string pageSlug) => throw new NotSupportedException();
    public Task<List<SitemapEntry>> GetSitemapPagesAsync(string apiKey, string tenantId) => throw new NotSupportedException();
    public Task<List<Page>> GetPublishedSpokePagesAsync(string apiKey, string tenantId, string hubPageSlug, int limit) => throw new NotSupportedException();
    public Task<List<Tenant>> GetAllTenantsAsync() => throw new NotSupportedException();
    public Task<List<Page>> GetAllPagesAsync(string? tenantId = null) => throw new NotSupportedException();
    public Task<Page?> GetPageBySlugAsync(string tenantId, string pageSlug) => throw new NotSupportedException();
    public Task<List<Page>> GetPagesByTenantAsync(string tenantId) => throw new NotSupportedException();
    public Task<List<Tenant>> GetTenantsForUserAsync(string userTenantId, bool isSuperAdmin) => throw new NotSupportedException();
    public Task<Page> SavePageAdminAsync(string tenantId, Page page) => throw new NotSupportedException();
    public Task<Page> UpdatePageAdminAsync(string tenantId, string pageSlug, Page page) => throw new NotSupportedException();
    public Task<bool> DeletePageAdminAsync(string tenantId, string pageSlug) => throw new NotSupportedException();
    public Task<List<Page>> GetHubPagesAsync(string tenantId) => throw new NotSupportedException();
    public Task<List<Page>> GetSpokePagesAsync(string tenantId, string hubPageSlug) => throw new NotSupportedException();
    public Task<object> GetContentHierarchyAsync(string tenantId) => throw new NotSupportedException();
    public Task<Tenant> UpdateTenantAsync(string tenantId, Tenant tenant) => throw new NotSupportedException();
    public Task<bool> DeleteTenantAsync(string tenantId) => throw new NotSupportedException();
    public Task<User?> GetUserByEmailAsync(string email) => throw new NotSupportedException();
    public Task UpdateUserLastLoginAsync(string userId, string tenantId) => throw new NotSupportedException();
    public Task<List<User>> GetUsersByTenantAsync(string tenantId) => throw new NotSupportedException();
    public Task<User?> GetUserAsync(string tenantId, string userId) => throw new NotSupportedException();
    public Task<User> CreateUserAsync(string tenantId, User user, string password) => throw new NotSupportedException();
    public Task<User> UpdateUserAsync(string tenantId, string userId, User user) => throw new NotSupportedException();
    public Task<User> ResetUserPasswordAsync(string tenantId, string userId, string password) => throw new NotSupportedException();
    public Task<bool> DeleteUserAsync(string tenantId, string userId) => throw new NotSupportedException();
    public Task<Theme?> GetThemeAsync(string apiKey, string tenantId, string themeId) => GetThemeAdminAsync(tenantId, themeId);
    public Task<Theme?> GetActiveThemeAsync(string apiKey, string tenantId) => GetActiveThemeAdminAsync(tenantId);
    public Task<List<Theme>> GetThemesByTenantAsync(string tenantId) => throw new NotSupportedException();
    public Task<FormDefinition?> GetFormDefinitionAsync(string tenantId, string formDefinitionId) => throw new NotSupportedException();
    public Task<FormDefinition?> GetFormDefinitionByTypeAsync(string tenantId, string type) => throw new NotSupportedException();
    public Task<List<FormDefinition>> GetFormDefinitionsByTenantAsync(string tenantId) => throw new NotSupportedException();
    public Task<FormDefinition> CreateFormDefinitionAsync(string tenantId, FormDefinition formDefinition) => throw new NotSupportedException();
    public Task<FormDefinition> UpdateFormDefinitionAsync(string tenantId, string formDefinitionId, FormDefinition formDefinition) => throw new NotSupportedException();
    public Task<bool> DeleteFormDefinitionAsync(string tenantId, string formDefinitionId) => throw new NotSupportedException();
    public Task<List<FormEntry>> GetFormEntriesByTenantAsync(string tenantId, string? type = null) => throw new NotSupportedException();
    public Task<List<MediaAsset>> GetMediaAssetsByTenantAsync(string tenantId, string? folder = null, string? contentType = null) => throw new NotSupportedException();
    public Task<MediaAsset?> GetMediaAssetAsync(string tenantId, string mediaAssetId) => throw new NotSupportedException();
    public Task<MediaAsset> CreateMediaAssetAsync(string tenantId, MediaAsset mediaAsset) => throw new NotSupportedException();
    public Task<MediaAsset> UpdateMediaAssetAsync(string tenantId, string mediaAssetId, MediaAsset mediaAsset) => throw new NotSupportedException();
    public Task<bool> DeleteMediaAssetAsync(string tenantId, string mediaAssetId) => throw new NotSupportedException();
}
