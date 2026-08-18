using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using BCrypt.Net;
using Microsoft.Azure.Cosmos;
using MongoDB.Driver;
using pumpkin_net_models.Models;
using CmsUser = pumpkin_net_models.Models.User;

var options = BootstrapOptions.FromArgs(args);

if (options.ShowHelp)
{
    BootstrapOptions.PrintHelp();
    return 0;
}

try
{
    options.Validate();

    BootstrapResult result = options.Provider.Equals("MongoDb", StringComparison.OrdinalIgnoreCase)
        ? await new MongoBootstrapper(options).RunAsync()
        : await new CosmosBootstrapper(options).RunAsync();

    Console.WriteLine("Pumpkin database bootstrap complete.");
    Console.WriteLine($"Provider: {options.Provider}");
    Console.WriteLine($"Database: {options.DatabaseName}");
    Console.WriteLine($"Tenant: {options.TenantId}");
    Console.WriteLine($"Tenant created: {result.TenantCreated}");
    Console.WriteLine($"Admin user created: {result.AdminUserCreated}");
    Console.WriteLine($"Default form created: {result.DefaultFormCreated}");
    Console.WriteLine($"Default theme created: {result.DefaultThemeCreated}");
    Console.WriteLine($"Draft home page created: {result.HomePageCreated}");

    if (!string.IsNullOrWhiteSpace(result.GeneratedApiKey))
    {
        Console.WriteLine();
        Console.WriteLine("Generated tenant API key. Store this now; it is only shown once:");
        Console.WriteLine(result.GeneratedApiKey);
    }

    if (!string.IsNullOrWhiteSpace(result.GeneratedAdminPassword))
    {
        Console.WriteLine();
        Console.WriteLine("Generated admin password. Store this now; it is only shown once:");
        Console.WriteLine(result.GeneratedAdminPassword);
    }

    return 0;
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Bootstrap failed: {ex.Message}");
    return 1;
}

sealed class CosmosBootstrapper
{
    private static readonly string[] ContainerNames =
    {
        "Tenant",
        "Page",
        "Theme",
        "User",
        "FormDefinition",
        "FormEntry",
        "MediaAsset"
    };

    private readonly BootstrapOptions _options;
    private readonly CosmosClient _client;

    public CosmosBootstrapper(BootstrapOptions options)
    {
        _options = options;
        _client = new CosmosClient(
            options.CosmosConnectionString,
            new CosmosClientOptions
            {
                Serializer = new BootstrapCosmosSerializer(),
                MaxRetryAttemptsOnRateLimitedRequests = 9,
                MaxRetryWaitTimeOnRateLimitedRequests = TimeSpan.FromSeconds(30)
            });
    }

    public async Task<BootstrapResult> RunAsync()
    {
        var database = await _client.CreateDatabaseIfNotExistsAsync(_options.DatabaseName);
        foreach (var containerName in ContainerNames)
        {
            await database.Database.CreateContainerIfNotExistsAsync(containerName, "/tenantId");
        }

        var result = new BootstrapResult();
        var tenantContainer = database.Database.GetContainer("Tenant");
        var tenant = await ReadCosmosItemAsync<Tenant>(tenantContainer, _options.TenantId, _options.TenantId);
        if (tenant == null)
        {
            var apiKey = _options.ApiKey ?? SecretGenerator.GenerateSecret(32);
            tenant = SeedFactory.CreateTenant(_options, apiKey);
            await tenantContainer.CreateItemAsync(tenant, new PartitionKey(_options.TenantId));
            result.TenantCreated = true;
            if (_options.ApiKey == null)
            {
                result.GeneratedApiKey = apiKey;
            }
        }

        if (!_options.SkipAdminUser && !string.IsNullOrWhiteSpace(_options.AdminEmail))
        {
            var userContainer = database.Database.GetContainer("User");
            var existingUser = await QuerySingleCosmosAsync<CmsUser>(
                userContainer,
                "SELECT * FROM c WHERE c.tenantId = @tenantId AND LOWER(c.email) = @email",
                _options.TenantId,
                query => query.WithParameter("@tenantId", _options.TenantId)
                    .WithParameter("@email", _options.AdminEmail.ToLowerInvariant()));
            if (existingUser == null)
            {
                var password = _options.AdminPassword ?? SecretGenerator.GenerateSecret(24);
                var user = SeedFactory.CreateAdminUser(_options, password);
                await userContainer.CreateItemAsync(user, new PartitionKey(_options.TenantId));
                result.AdminUserCreated = true;
                if (_options.AdminPassword == null)
                {
                    result.GeneratedAdminPassword = password;
                }
            }
        }

        if (!_options.SkipDefaultForm)
        {
            result.DefaultFormCreated = await CreateCosmosIfMissingAsync(
                database.Database.GetContainer("FormDefinition"),
                SeedFactory.CreateDefaultForm(_options),
                form => form.Id);
        }

        if (!_options.SkipDefaultTheme)
        {
            result.DefaultThemeCreated = await CreateCosmosIfMissingAsync(
                database.Database.GetContainer("Theme"),
                SeedFactory.CreateDefaultTheme(_options),
                theme => theme.Id);
        }

        if (!_options.SkipHomePage)
        {
            result.HomePageCreated = await CreateCosmosIfMissingAsync(
                database.Database.GetContainer("Page"),
                SeedFactory.CreateDraftHomePage(_options),
                page => page.Id);
        }

        return result;
    }

    private async Task<bool> CreateCosmosIfMissingAsync<T>(Container container, T item, Func<T, string> idSelector)
    {
        var existing = await ReadCosmosItemAsync<T>(container, idSelector(item), _options.TenantId);
        if (existing != null)
        {
            return false;
        }

        await container.CreateItemAsync(item, new PartitionKey(_options.TenantId));
        return true;
    }

    private static async Task<T?> ReadCosmosItemAsync<T>(Container container, string id, string tenantId)
    {
        try
        {
            var response = await container.ReadItemAsync<T>(id, new PartitionKey(tenantId));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return default;
        }
    }

    private static async Task<T?> QuerySingleCosmosAsync<T>(
        Container container,
        string queryText,
        string tenantId,
        Func<QueryDefinition, QueryDefinition> configure)
    {
        var query = configure(new QueryDefinition(queryText));
        using var iterator = container.GetItemQueryIterator<T>(
            query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(tenantId) });
        while (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            var item = page.FirstOrDefault();
            if (item != null)
            {
                return item;
            }
        }

        return default;
    }
}

sealed class MongoBootstrapper
{
    private static readonly string[] CollectionNames =
    {
        "Tenant",
        "Page",
        "Theme",
        "User",
        "FormDefinition",
        "FormEntry",
        "MediaAsset"
    };

    private readonly BootstrapOptions _options;
    private readonly IMongoDatabase _database;

    public MongoBootstrapper(BootstrapOptions options)
    {
        _options = options;
        var settings = MongoClientSettings.FromConnectionString(options.MongoConnectionString);
        settings.MaxConnectionPoolSize = 100;
        settings.ConnectTimeout = TimeSpan.FromSeconds(30);
        settings.ServerSelectionTimeout = TimeSpan.FromSeconds(30);
        _database = new MongoClient(settings).GetDatabase(options.DatabaseName);
    }

    public async Task<BootstrapResult> RunAsync()
    {
        await EnsureCollectionsAsync();
        await EnsureIndexesAsync();

        var result = new BootstrapResult();
        var tenants = _database.GetCollection<Tenant>("Tenant");
        var tenant = await tenants.Find(t => t.TenantId == _options.TenantId).FirstOrDefaultAsync();
        if (tenant == null)
        {
            var apiKey = _options.ApiKey ?? SecretGenerator.GenerateSecret(32);
            await tenants.InsertOneAsync(SeedFactory.CreateTenant(_options, apiKey));
            result.TenantCreated = true;
            if (_options.ApiKey == null)
            {
                result.GeneratedApiKey = apiKey;
            }
        }

        if (!_options.SkipAdminUser && !string.IsNullOrWhiteSpace(_options.AdminEmail))
        {
            var users = _database.GetCollection<CmsUser>("User");
            var normalizedEmail = _options.AdminEmail.ToLowerInvariant();
            var existingUser = await users.Find(user => user.Email.ToLower() == normalizedEmail).FirstOrDefaultAsync();
            if (existingUser == null)
            {
                var password = _options.AdminPassword ?? SecretGenerator.GenerateSecret(24);
                await users.InsertOneAsync(SeedFactory.CreateAdminUser(_options, password));
                result.AdminUserCreated = true;
                if (_options.AdminPassword == null)
                {
                    result.GeneratedAdminPassword = password;
                }
            }
        }

        if (!_options.SkipDefaultForm)
        {
            result.DefaultFormCreated = await CreateMongoIfMissingAsync(
                _database.GetCollection<FormDefinition>("FormDefinition"),
                SeedFactory.CreateDefaultForm(_options),
                form => form.Id);
        }

        if (!_options.SkipDefaultTheme)
        {
            result.DefaultThemeCreated = await CreateMongoIfMissingAsync(
                _database.GetCollection<Theme>("Theme"),
                SeedFactory.CreateDefaultTheme(_options),
                theme => theme.Id);
        }

        if (!_options.SkipHomePage)
        {
            result.HomePageCreated = await CreateMongoIfMissingAsync(
                _database.GetCollection<Page>("Page"),
                SeedFactory.CreateDraftHomePage(_options),
                page => page.Id);
        }

        return result;
    }

    private async Task EnsureCollectionsAsync()
    {
        var existing = await (await _database.ListCollectionNamesAsync()).ToListAsync();
        var existingSet = existing.ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var collectionName in CollectionNames)
        {
            if (!existingSet.Contains(collectionName))
            {
                await _database.CreateCollectionAsync(collectionName);
            }
        }
    }

    private async Task EnsureIndexesAsync()
    {
        await _database.GetCollection<Tenant>("Tenant").Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Tenant>(
                Builders<Tenant>.IndexKeys.Ascending(t => t.TenantId),
                new CreateIndexOptions { Unique = true, Name = "ux_tenant_tenantId" }),
            new CreateIndexModel<Tenant>(
                Builders<Tenant>.IndexKeys.Ascending(t => t.Status).Ascending(t => t.ApiKeyMeta.IsActive),
                new CreateIndexOptions { Name = "ix_tenant_status_apiKey" })
        });

        await _database.GetCollection<Page>("Page").Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Page>(
                Builders<Page>.IndexKeys.Ascending(p => p.TenantId).Ascending(p => p.PageSlug),
                new CreateIndexOptions { Unique = true, Name = "ux_page_tenant_slug" }),
            new CreateIndexModel<Page>(
                Builders<Page>.IndexKeys.Ascending(p => p.TenantId).Ascending(p => p.IsPublished),
                new CreateIndexOptions { Name = "ix_page_tenant_published" }),
            new CreateIndexModel<Page>(
                Builders<Page>.IndexKeys.Ascending(p => p.TenantId).Ascending(p => p.ContentRelationships.HubPageSlug),
                new CreateIndexOptions { Name = "ix_page_tenant_hub" })
        });

        await _database.GetCollection<Theme>("Theme").Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Theme>(
                Builders<Theme>.IndexKeys.Ascending(t => t.TenantId).Ascending(t => t.ThemeId),
                new CreateIndexOptions { Unique = true, Name = "ux_theme_tenant_themeId" }),
            new CreateIndexModel<Theme>(
                Builders<Theme>.IndexKeys.Ascending(t => t.TenantId).Ascending(t => t.IsActive),
                new CreateIndexOptions { Name = "ix_theme_tenant_active" })
        });

        await _database.GetCollection<CmsUser>("User").Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<CmsUser>(
                Builders<CmsUser>.IndexKeys.Ascending(u => u.Email),
                new CreateIndexOptions { Unique = true, Name = "ux_user_email" }),
            new CreateIndexModel<CmsUser>(
                Builders<CmsUser>.IndexKeys.Ascending(u => u.TenantId).Ascending(u => u.Id),
                new CreateIndexOptions { Unique = true, Name = "ux_user_tenant_id" })
        });

        await _database.GetCollection<FormDefinition>("FormDefinition").Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<FormDefinition>(
                Builders<FormDefinition>.IndexKeys.Ascending(f => f.TenantId).Ascending(f => f.FormDefinitionId),
                new CreateIndexOptions { Unique = true, Name = "ux_form_definition_tenant_id" }),
            new CreateIndexModel<FormDefinition>(
                Builders<FormDefinition>.IndexKeys.Ascending(f => f.TenantId).Ascending(f => f.Type),
                new CreateIndexOptions { Unique = true, Name = "ux_form_definition_tenant_type" })
        });

        await _database.GetCollection<FormEntry>("FormEntry").Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<FormEntry>(
                Builders<FormEntry>.IndexKeys.Ascending(f => f.TenantId).Ascending(f => f.Id),
                new CreateIndexOptions { Unique = true, Name = "ux_form_entry_tenant_id" }),
            new CreateIndexModel<FormEntry>(
                Builders<FormEntry>.IndexKeys.Ascending(f => f.TenantId).Ascending(f => f.Type).Descending(f => f.SubmittedAt),
                new CreateIndexOptions { Name = "ix_form_entry_tenant_type_submitted" })
        });

        await _database.GetCollection<MediaAsset>("MediaAsset").Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<MediaAsset>(
                Builders<MediaAsset>.IndexKeys.Ascending(m => m.TenantId).Ascending(m => m.MediaAssetId),
                new CreateIndexOptions { Unique = true, Name = "ux_media_asset_tenant_id" }),
            new CreateIndexModel<MediaAsset>(
                Builders<MediaAsset>.IndexKeys.Ascending(m => m.TenantId).Ascending(m => m.Folder).Ascending(m => m.ContentType),
                new CreateIndexOptions { Name = "ix_media_asset_tenant_folder_type" })
        });
    }

    private static async Task<bool> CreateMongoIfMissingAsync<T>(
        IMongoCollection<T> collection,
        T item,
        Func<T, string> idSelector)
    {
        var filter = Builders<T>.Filter.Eq("Id", idSelector(item));
        var exists = await collection.Find(filter).AnyAsync();
        if (exists)
        {
            return false;
        }

        await collection.InsertOneAsync(item);
        return true;
    }
}

static class SeedFactory
{
    public static Tenant CreateTenant(BootstrapOptions options, string apiKey)
    {
        return new Tenant
        {
            Id = options.TenantId,
            TenantId = options.TenantId,
            Name = options.TenantName,
            Plan = options.TenantPlan,
            Status = "active",
            ApiKeyHash = BCrypt.Net.BCrypt.HashPassword(apiKey, 12),
            ApiKeyMeta = new ApiKeyMeta
            {
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            },
            Settings = new TenantSettings
            {
                Theme = options.SkipDefaultTheme ? string.Empty : "pumpkin-default",
                Language = "en",
                MaxUsers = 10,
                AllowedOrigins = options.AllowedOrigins.ToArray(),
                Features = new Features
                {
                    Forms = true,
                    Pages = true,
                    Analytics = false,
                    CanCreateTenants = true,
                    CanDeleteTenants = true,
                    CanManageAllContent = true,
                    CanViewAllTenants = true
                },
                FormSecurity = new TenantFormSecuritySettings
                {
                    Captcha = new TenantCaptchaSettings
                    {
                        Provider = CaptchaProviders.None,
                        EnabledByDefault = false
                    }
                }
            },
            Contact = new Contact
            {
                Email = options.AdminEmail
            },
            Billing = new Billing
            {
                Cycle = "none"
            },
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static CmsUser CreateAdminUser(BootstrapOptions options, string password)
    {
        var username = string.IsNullOrWhiteSpace(options.AdminUsername)
            ? options.AdminEmail
            : options.AdminUsername;

        return new CmsUser
        {
            Id = Guid.NewGuid().ToString("N"),
            TenantId = options.TenantId,
            Email = options.AdminEmail,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, 12),
            Role = UserRole.SuperAdmin,
            IsActive = true,
            CreatedDate = DateTime.UtcNow,
            Permissions = new List<string>
            {
                "tenants:create",
                "tenants:delete",
                "content:manage-all",
                "tenants:view-all"
            }
        };
    }

    public static FormDefinition CreateDefaultForm(BootstrapOptions options)
    {
        return new FormDefinition
        {
            Id = "contact",
            FormDefinitionId = "contact",
            TenantId = options.TenantId,
            Name = "Contact Form",
            Type = "contact",
            Description = "Default contact form for the starter site.",
            SubmitButtonText = "Send Message",
            SuccessMessage = "Thanks. Your message has been received.",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Fields = new List<FormFieldDefinition>
            {
                new() { Name = "name", Label = "Name", Type = FormFieldTypes.Text, Required = true, Order = 10 },
                new() { Name = "email", Label = "Email", Type = FormFieldTypes.Email, Required = true, Order = 20 },
                new() { Name = "phone", Label = "Phone", Type = FormFieldTypes.Phone, Required = false, Order = 30 },
                new() { Name = "message", Label = "Message", Type = FormFieldTypes.Textarea, Required = true, Order = 40 }
            },
            SpamProtection = new FormSpamProtection
            {
                HoneypotFieldName = "_website",
                RejectWhenHoneypotFilled = true,
                RequireConsent = false,
                Captcha = new FormCaptchaSettings
                {
                    Mode = FormCaptchaModes.Inherit,
                    Provider = CaptchaProviders.None,
                    Action = "form_submit"
                }
            }
        };
    }

    public static Theme CreateDefaultTheme(BootstrapOptions options)
    {
        return new Theme
        {
            Id = "pumpkin-default",
            ThemeId = "pumpkin-default",
            TenantId = options.TenantId,
            Name = "Pumpkin Default",
            Label = "Pumpkin Default",
            Description = "Default starter theme.",
            Category = "system",
            IsActive = true,
            IsSystem = true,
            IsCustom = false,
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Preview = new ThemePreview
            {
                Palette = new List<string> { "#0f172a", "#f97316", "#f8fafc" },
                Background = "#ffffff",
                Foreground = "#0f172a",
                Primary = "#f97316",
                Accent = "#2563eb"
            },
            Header = new ThemeHeader
            {
                LogoAlt = options.TenantName,
                Sticky = true,
                CtaText = "Contact",
                CtaUrl = "/#contact"
            },
            Footer = new ThemeFooter
            {
                Copyright = $"© {DateTime.UtcNow.Year} {options.TenantName}. All rights reserved.",
                Description = options.TenantName
            },
            Menu = new List<MenuItem>
            {
                new() { Label = "Home", Url = "/", Order = 10, IsVisible = true },
                new() { Label = "Contact", Url = "/#contact", Order = 20, IsVisible = true }
            }
        };
    }

    public static Page CreateDraftHomePage(BootstrapOptions options)
    {
        var pageId = "home";
        return new Page
        {
            Id = pageId,
            PageId = pageId,
            TenantId = options.TenantId,
            PageSlug = "home",
            PageVersion = 1,
            Layout = "standard",
            IsPublished = false,
            IncludeInSitemap = false,
            MetaData = new PageMetaData
            {
                Title = "Home",
                Description = $"Draft home page for {options.TenantName}.",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Language = "en",
                PageType = "Landing"
            },
            SearchData = new SearchData
            {
                ContentSummary = $"Draft home page for {options.TenantName}.",
                BlockTypes = new List<string>()
            },
            Seo = new SeoData
            {
                MetaTitle = options.TenantName,
                MetaDescription = $"Draft home page for {options.TenantName}.",
                Robots = "noindex, nofollow"
            },
            ContentData = new ContentData
            {
                ContentBlocks = new List<HtmlBlockBase>()
            }
        };
    }
}

sealed class BootstrapOptions
{
    private readonly HashSet<string> _flags;
    private readonly Dictionary<string, List<string>> _values;

    private BootstrapOptions(Dictionary<string, List<string>> values, HashSet<string> flags)
    {
        _values = values;
        _flags = flags;
    }

    public bool ShowHelp => _flags.Contains("help") || _flags.Contains("h");
    public string Provider => Get("provider", "Database__Provider", "CosmosDb");
    public string DatabaseName => Get("database", "Database__CosmosDb__DatabaseName", Get("database-name", "Database__MongoDb__DatabaseName", "PumpkinCMS"));
    public string CosmosConnectionString => Get("cosmos-connection-string", "Database__CosmosDb__ConnectionString", string.Empty);
    public string MongoConnectionString => Get("mongo-connection-string", "Database__MongoDb__ConnectionString", "mongodb://localhost:27017");
    public string TenantId => NormalizeTenantId(Get("tenant-id", "PUMPKIN_BOOTSTRAP_TENANT_ID", "pumpkin"));
    public string TenantName => Get("tenant-name", "PUMPKIN_BOOTSTRAP_TENANT_NAME", "Pumpkin CMS");
    public string TenantPlan => Get("tenant-plan", "PUMPKIN_BOOTSTRAP_TENANT_PLAN", "standard");
    public string? ApiKey => EmptyToNull(Get("api-key", "PUMPKIN_BOOTSTRAP_API_KEY", string.Empty));
    public string AdminEmail => Get("admin-email", "PUMPKIN_BOOTSTRAP_ADMIN_EMAIL", string.Empty).Trim();
    public string? AdminPassword => EmptyToNull(Get("admin-password", "PUMPKIN_BOOTSTRAP_ADMIN_PASSWORD", string.Empty));
    public string AdminUsername => Get("admin-username", "PUMPKIN_BOOTSTRAP_ADMIN_USERNAME", string.Empty).Trim();
    public bool SkipAdminUser => _flags.Contains("skip-admin-user");
    public bool SkipDefaultForm => _flags.Contains("skip-default-form");
    public bool SkipDefaultTheme => _flags.Contains("skip-default-theme");
    public bool SkipHomePage => _flags.Contains("skip-home-page");

    public IReadOnlyList<string> AllowedOrigins
    {
        get
        {
            var raw = GetMany("allowed-origin");
            var env = Environment.GetEnvironmentVariable("PUMPKIN_BOOTSTRAP_ALLOWED_ORIGINS");
            if (!string.IsNullOrWhiteSpace(env))
            {
                raw.Add(env);
            }

            return raw
                .SelectMany(value => value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                .Select(origin => origin.Trim().TrimEnd('/'))
                .Where(origin => Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                    && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }

    public static BootstrapOptions FromArgs(string[] args)
    {
        var values = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        var flags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var index = 0; index < args.Length; index++)
        {
            var arg = args[index];
            if (!arg.StartsWith("--", StringComparison.Ordinal))
            {
                continue;
            }

            var key = arg[2..].Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            var equalsIndex = key.IndexOf('=');
            if (equalsIndex >= 0)
            {
                AddValue(values, key[..equalsIndex], key[(equalsIndex + 1)..]);
                continue;
            }

            if (index + 1 < args.Length && !args[index + 1].StartsWith("--", StringComparison.Ordinal))
            {
                AddValue(values, key, args[++index]);
            }
            else
            {
                flags.Add(key);
            }
        }

        return new BootstrapOptions(values, flags);
    }

    public void Validate()
    {
        if (!Provider.Equals("CosmosDb", StringComparison.OrdinalIgnoreCase) &&
            !Provider.Equals("MongoDb", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("--provider must be CosmosDb or MongoDb.");
        }

        if (string.IsNullOrWhiteSpace(DatabaseName))
        {
            throw new InvalidOperationException("--database is required.");
        }

        if (Provider.Equals("CosmosDb", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(CosmosConnectionString))
        {
            throw new InvalidOperationException("--cosmos-connection-string is required for CosmosDb.");
        }

        if (Provider.Equals("MongoDb", StringComparison.OrdinalIgnoreCase) &&
            string.IsNullOrWhiteSpace(MongoConnectionString))
        {
            throw new InvalidOperationException("--mongo-connection-string is required for MongoDb.");
        }

        if (string.IsNullOrWhiteSpace(TenantId))
        {
            throw new InvalidOperationException("--tenant-id is required.");
        }

        if (AdminPassword != null && AdminPassword.Length < 8)
        {
            throw new InvalidOperationException("--admin-password must be at least 8 characters.");
        }

        if (!SkipAdminUser && string.IsNullOrWhiteSpace(AdminEmail))
        {
            Console.WriteLine("No admin user will be created because --admin-email was not provided.");
        }
    }

    public static void PrintHelp()
    {
        Console.WriteLine("""
Pumpkin Database Bootstrap

Options:
  --provider CosmosDb|MongoDb
  --database <name>
  --cosmos-connection-string <connection-string>
  --mongo-connection-string <connection-string>
  --tenant-id <slug>
  --tenant-name <name>
  --tenant-plan <plan>
  --allowed-origin <url>      repeatable or comma-separated
  --api-key <plain-text-key>
  --admin-email <email>
  --admin-password <password>
  --admin-username <username>
  --skip-admin-user
  --skip-default-form
  --skip-default-theme
  --skip-home-page
""");
    }

    private string Get(string key, string envName, string fallback)
    {
        if (_values.TryGetValue(key, out var values))
        {
            var value = values.LastOrDefault();
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        var env = Environment.GetEnvironmentVariable(envName);
        return string.IsNullOrWhiteSpace(env) ? fallback : env.Trim();
    }

    private List<string> GetMany(string key)
    {
        return _values.TryGetValue(key, out var values)
            ? values.ToList()
            : new List<string>();
    }

    private static void AddValue(Dictionary<string, List<string>> values, string key, string value)
    {
        key = key.Trim();
        if (!values.TryGetValue(key, out var existing))
        {
            existing = new List<string>();
            values[key] = existing;
        }

        existing.Add(value);
    }

    private static string NormalizeTenantId(string tenantId)
    {
        return tenantId.Trim().ToLowerInvariant();
    }

    private static string? EmptyToNull(string value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}

sealed class BootstrapResult
{
    public bool TenantCreated { get; set; }
    public bool AdminUserCreated { get; set; }
    public bool DefaultFormCreated { get; set; }
    public bool DefaultThemeCreated { get; set; }
    public bool HomePageCreated { get; set; }
    public string GeneratedApiKey { get; set; } = string.Empty;
    public string GeneratedAdminPassword { get; set; } = string.Empty;
}

sealed class BootstrapCosmosSerializer : CosmosSerializer
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
        Converters =
        {
            new HtmlBlockJsonConverter(),
            new HtmlBlockBaseJsonConverter()
        }
    };

    public override T FromStream<T>(Stream stream)
    {
        if (stream == null || stream.Length == 0)
        {
            return default!;
        }

        using (stream)
        {
            return JsonSerializer.Deserialize<T>(stream, JsonOptions)!;
        }
    }

    public override Stream ToStream<T>(T input)
    {
        var stream = new MemoryStream();
        JsonSerializer.Serialize(stream, input, JsonOptions);
        stream.Position = 0;
        return stream;
    }
}

static class SecretGenerator
{
    public static string GenerateSecret(int byteCount)
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(byteCount));
    }
}
