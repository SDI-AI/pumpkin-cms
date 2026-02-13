using System.Text.Json.Serialization;

namespace pumpkin_net_models.Models;

public class Tenant
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("tenantId")]
    public string TenantId { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("plan")]
    public string Plan { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("apiKey")]
    public string ApiKey { get; set; } = string.Empty;

    [JsonPropertyName("apiKeyHash")]
    public string ApiKeyHash { get; set; } = string.Empty;

    [JsonPropertyName("apiKeyMeta")]
    public ApiKeyMeta ApiKeyMeta { get; set; } = new();

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("settings")]
    public TenantSettings Settings { get; set; } = new();

    [JsonPropertyName("contact")]
    public Contact Contact { get; set; } = new();

    [JsonPropertyName("billing")]
    public Billing Billing { get; set; } = new();
}

public class ApiKeyMeta
{
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;
}

public class TenantSettings
{
    [JsonPropertyName("theme")]
    public string Theme { get; set; } = string.Empty;

    [JsonPropertyName("language")]
    public string Language { get; set; } = string.Empty;

    [JsonPropertyName("maxUsers")]
    public int MaxUsers { get; set; } = 0;

    [JsonPropertyName("features")]
    public Features Features { get; set; } = new();

    [JsonPropertyName("allowedOrigins")]
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}

public class Features
{
    [JsonPropertyName("forms")]
    public bool Forms { get; set; } = false;

    [JsonPropertyName("pages")]
    public bool Pages { get; set; } = false;

    [JsonPropertyName("analytics")]
    public bool Analytics { get; set; } = false;

    // Add admin permissions to existing Features
    [JsonPropertyName("canCreateTenants")]
    public bool CanCreateTenants { get; set; } = false;

    [JsonPropertyName("canDeleteTenants")]
    public bool CanDeleteTenants { get; set; } = false;

    [JsonPropertyName("canManageAllContent")]
    public bool CanManageAllContent { get; set; } = false;

    [JsonPropertyName("canViewAllTenants")]
    public bool CanViewAllTenants { get; set; } = false;
}

public class Contact
{
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;
}

public class Billing
{
    [JsonPropertyName("cycle")]
    public string Cycle { get; set; } = string.Empty;

    [JsonPropertyName("nextInvoice")]
    public DateTime NextInvoice { get; set; } = DateTime.UtcNow;
}
