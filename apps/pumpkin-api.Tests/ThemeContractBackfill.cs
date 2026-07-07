using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using pumpkin_api.Services;
using pumpkin_net_models.Models;

namespace pumpkin_api.Tests;

public static class ThemeContractBackfill
{
    public static async Task RunPumpkinDefaultAsync(string[] args)
    {
        var apiConfigPath = GetArgumentValue(args, "--api-config")
            ?? Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "apps", "pumpkin-api"));

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiConfigPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var cosmosSettings = configuration
            .GetSection($"{DatabaseSettings.SectionName}:CosmosDb")
            .Get<CosmosDbSettings>();

        if (cosmosSettings == null || string.IsNullOrWhiteSpace(cosmosSettings.ConnectionString))
        {
            throw new InvalidOperationException("Cosmos DB connection string was not found in the API configuration.");
        }

        using var loggerFactory = LoggerFactory.Create(builder => builder.SetMinimumLevel(LogLevel.Warning));
        using var connection = new CosmosDataConnection(
            Options.Create(cosmosSettings),
            loggerFactory.CreateLogger<CosmosDataConnection>());

        const string tenantId = "pumpkin";
        const string themeId = "pumpkin-default";

        var theme = await connection.GetThemeAdminAsync(tenantId, themeId);
        if (theme == null)
        {
            throw new KeyNotFoundException($"Theme '{themeId}' was not found for tenant '{tenantId}'.");
        }

        BackfillPumpkinDefault(theme);

        var updated = await connection.UpdateThemeAsync(tenantId, themeId, theme);
        updated = await connection.ActivateThemeAsync(tenantId, themeId);

        var tenant = await connection.GetTenantAsync(tenantId);
        var tenantTheme = tenant?.Settings?.Theme ?? string.Empty;

        Console.WriteLine("Pumpkin default theme backfill complete.");
        Console.WriteLine($"Theme: {updated.ThemeId}");
        Console.WriteLine($"Active: {updated.IsActive}");
        Console.WriteLine($"Tenant pointer: {tenantTheme}");
        Console.WriteLine($"CSS variables: {updated.CssVariables.Count}");
        Console.WriteLine($"Preview colors: {updated.Preview.Palette.Count}");
    }

    private static void BackfillPumpkinDefault(Theme theme)
    {
        theme.Id = "pumpkin-default";
        theme.ThemeId = "pumpkin-default";
        theme.TenantId = "pumpkin";
        theme.Name = string.IsNullOrWhiteSpace(theme.Name) ? "Pumpkin Default" : theme.Name;
        theme.Label = "Pumpkin Default";
        theme.Category = "system";
        theme.Tags = new List<string> { "default", "pumpkin", "branded", "light" };
        theme.IsActive = true;
        theme.IsSystem = true;
        theme.IsCustom = false;
        theme.CreatedByUserId = string.Empty;
        theme.Version = Math.Max(theme.Version, 1);

        theme.Preview = new ThemePreview
        {
            Palette = new List<string> { "#fff8f0", "#f97316", "#7c2d12", "#22c55e", "#171717" },
            Background = "#ffffff",
            Foreground = "#171717",
            Primary = "#f97316",
            Accent = "#22c55e",
        };

        theme.CssVariables = new Dictionary<string, string>
        {
            ["--background"] = "#ffffff",
            ["--foreground"] = "#171717",
            ["--card"] = "#ffffff",
            ["--card-foreground"] = "#171717",
            ["--popover"] = "#ffffff",
            ["--popover-foreground"] = "#171717",
            ["--primary"] = "#f97316",
            ["--primary-foreground"] = "#ffffff",
            ["--secondary"] = "#f5f5f5",
            ["--secondary-foreground"] = "#262626",
            ["--muted"] = "#f5f5f5",
            ["--muted-foreground"] = "#737373",
            ["--accent"] = "#22c55e",
            ["--accent-foreground"] = "#ffffff",
            ["--destructive"] = "#dc2626",
            ["--destructive-foreground"] = "#ffffff",
            ["--border"] = "#e5e5e5",
            ["--input"] = "#d4d4d4",
            ["--ring"] = "#f97316",
            ["--radius"] = "0.5rem",
        };

        theme.Typography = new ThemeTypography
        {
            FontSans = "Inter, system-ui, sans-serif",
            FontSerif = "Georgia, serif",
            FontMono = "ui-monospace, SFMono-Regular, monospace",
            HeadingFont = "Inter, system-ui, sans-serif",
            BodyFont = "Inter, system-ui, sans-serif",
            BaseFontSize = "16px",
            LineHeight = "1.5",
            FontWeights = new Dictionary<string, string>
            {
                ["normal"] = "400",
                ["medium"] = "500",
                ["semibold"] = "600",
                ["bold"] = "700",
                ["extrabold"] = "800",
            },
        };

        theme.Spacing = new ThemeSpacing
        {
            BaseUnit = "0.25rem",
            Scale = new Dictionary<string, string>
            {
                ["1"] = "0.25rem",
                ["2"] = "0.5rem",
                ["3"] = "0.75rem",
                ["4"] = "1rem",
                ["6"] = "1.5rem",
                ["8"] = "2rem",
                ["12"] = "3rem",
                ["16"] = "4rem",
            },
        };

        theme.Borders = new ThemeBorders
        {
            Radius = new Dictionary<string, string>
            {
                ["sm"] = "0.25rem",
                ["md"] = "0.5rem",
                ["lg"] = "0.75rem",
                ["xl"] = "1rem",
            },
            Width = new Dictionary<string, string>
            {
                ["default"] = "1px",
                ["thick"] = "2px",
            },
            Style = "solid",
        };

        theme.Shadows = new ThemeShadows
        {
            Scale = new Dictionary<string, string>
            {
                ["sm"] = "0 1px 2px rgba(0,0,0,0.05)",
                ["md"] = "0 4px 6px rgba(0,0,0,0.07)",
                ["lg"] = "0 10px 15px rgba(0,0,0,0.10)",
            },
        };
    }

    private static string? GetArgumentValue(string[] args, string name)
    {
        var prefix = $"{name}=";
        return args.FirstOrDefault(arg => arg.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))?[prefix.Length..];
    }
}
