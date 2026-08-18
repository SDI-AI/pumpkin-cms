namespace pumpkin_api.Services;

public class AssetStorageSettings
{
    public const string SectionName = "AssetStorage";

    /// <summary>
    /// Tenant asset provider. Supported values: "AzureBlob" and "LocalFile".
    /// </summary>
    public string Provider { get; set; } = "AzureBlob";

    /// <summary>
    /// Tenant-scoped theme path used by install/build flows before publishing URLs.
    /// </summary>
    public string ThemePathTemplate { get; set; } = "tenants/{tenantId}/themes/{themeId}/{version}";

    /// <summary>
    /// Tenant-scoped media path used by media upload flows before publishing URLs.
    /// </summary>
    public string MediaPathTemplate { get; set; } = "tenants/{tenantId}/media/{yyyy}/{mm}/{assetId}-{fileName}";

    public long MaxThemePackageBytes { get; set; } = 50 * 1024 * 1024;
    public long MaxMediaAssetBytes { get; set; } = 25 * 1024 * 1024;
    public string[] AllowedMediaContentTypes { get; set; } =
    {
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/avif",
        "application/pdf"
    };
    public string[] AllowedMediaExtensions { get; set; } =
    {
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".avif",
        ".pdf"
    };

    public AzureBlobAssetStorageSettings AzureBlob { get; set; } = new();
    public LocalFileAssetStorageSettings LocalFile { get; set; } = new();

    public string BuildTenantThemePath(string tenantId, string themeId, string version)
    {
        return ThemePathTemplate
            .Replace("{tenantId}", Uri.EscapeDataString(tenantId))
            .Replace("{themeId}", Uri.EscapeDataString(themeId))
            .Replace("{version}", Uri.EscapeDataString(version))
            .Trim('/');
    }

    public string BuildTenantMediaPath(string tenantId, string assetId, string fileName, DateTimeOffset createdAt)
    {
        return MediaPathTemplate
            .Replace("{tenantId}", Uri.EscapeDataString(tenantId))
            .Replace("{yyyy}", createdAt.UtcDateTime.ToString("yyyy"))
            .Replace("{mm}", createdAt.UtcDateTime.ToString("MM"))
            .Replace("{assetId}", Uri.EscapeDataString(assetId))
            .Replace("{fileName}", Uri.EscapeDataString(fileName))
            .Trim('/');
    }

    public string BuildThemePublicUrl(string tenantThemePath, string fileName)
    {
        return Provider.Equals("LocalFile", StringComparison.OrdinalIgnoreCase)
            ? BuildLocalPublicUrl(tenantThemePath, fileName)
            : BuildAzurePublicUrl(AzureBlob.ThemesPublicBaseUrl, AzureBlob.ThemesContainerName, tenantThemePath, fileName);
    }

    public string BuildMediaPublicUrl(string mediaPath)
    {
        return Provider.Equals("LocalFile", StringComparison.OrdinalIgnoreCase)
            ? BuildLocalPublicUrl(mediaPath)
            : BuildAzurePublicUrl(AzureBlob.MediaPublicBaseUrl, AzureBlob.MediaContainerName, mediaPath);
    }

    private string BuildAzurePublicUrl(string containerPublicBaseUrl, string containerName, string blobPath, string fileName = "")
    {
        var baseUrl = string.IsNullOrWhiteSpace(containerPublicBaseUrl)
            ? AzureBlob.PublicBaseUrl
            : containerPublicBaseUrl;

        if (string.IsNullOrWhiteSpace(baseUrl))
            return string.Empty;

        var relativePath = string.IsNullOrWhiteSpace(fileName)
            ? blobPath.Trim('/')
            : $"{blobPath.Trim('/')}/{fileName.TrimStart('/')}";

        if (!string.IsNullOrWhiteSpace(containerPublicBaseUrl))
            return $"{baseUrl.TrimEnd('/')}/{relativePath}";

        return $"{baseUrl.TrimEnd('/')}/{containerName.Trim('/')}/{relativePath}";
    }

    private string BuildLocalPublicUrl(string storagePath, string fileName = "")
    {
        var baseUrl = LocalFile.PublicBaseUrl;
        var requestPath = string.IsNullOrWhiteSpace(LocalFile.RequestPath)
            ? "/assets"
            : $"/{LocalFile.RequestPath.Trim('/')}";

        var relativePath = string.IsNullOrWhiteSpace(fileName)
            ? storagePath.Trim('/')
            : $"{storagePath.Trim('/')}/{fileName.TrimStart('/')}";

        if (!string.IsNullOrWhiteSpace(baseUrl))
            return $"{baseUrl.TrimEnd('/')}/{relativePath}";

        return $"{requestPath}/{relativePath}";
    }
}

public class AzureBlobAssetStorageSettings
{
    /// <summary>
    /// Optional connection string for local/dev or connection-string based deployments.
    /// Prefer managed identity in Azure-hosted production.
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;

    public string AccountName { get; set; } = string.Empty;
    public string ThemesContainerName { get; set; } = "pumpkin-themes";
    public string MediaContainerName { get; set; } = "pumpkin-media";
    /// <summary>Public root for the storage account or CDN, for example https://account.blob.core.windows.net.</summary>
    public string PublicBaseUrl { get; set; } = string.Empty;
    /// <summary>Optional public root mapped directly to the themes container.</summary>
    public string ThemesPublicBaseUrl { get; set; } = string.Empty;
    /// <summary>Optional public root mapped directly to the media container.</summary>
    public string MediaPublicBaseUrl { get; set; } = string.Empty;
    public bool UseManagedIdentity { get; set; } = true;
}

public class LocalFileAssetStorageSettings
{
    /// <summary>
    /// Root directory for local assets. Relative paths resolve under the API content root.
    /// </summary>
    public string RootPath { get; set; } = "App_Data/assets";

    /// <summary>
    /// App-relative request path used to serve local assets.
    /// </summary>
    public string RequestPath { get; set; } = "/assets";

    /// <summary>
    /// Optional absolute public root, for example https://cdn.example.com/assets.
    /// Leave empty to return app-relative URLs under RequestPath.
    /// </summary>
    public string PublicBaseUrl { get; set; } = string.Empty;
}
