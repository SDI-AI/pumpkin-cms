namespace pumpkin_api.Services;

public class AssetStorageSettings
{
    public const string SectionName = "AssetStorage";

    /// <summary>
    /// Tenant asset provider. Current provisioned value: "AzureBlob".
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

    public AzureBlobAssetStorageSettings AzureBlob { get; set; } = new();

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
        return BuildPublicUrl(AzureBlob.ThemesPublicBaseUrl, AzureBlob.ThemesContainerName, tenantThemePath, fileName);
    }

    public string BuildMediaPublicUrl(string mediaPath)
    {
        return BuildPublicUrl(AzureBlob.MediaPublicBaseUrl, AzureBlob.MediaContainerName, mediaPath);
    }

    private string BuildPublicUrl(string containerPublicBaseUrl, string containerName, string blobPath, string fileName = "")
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
