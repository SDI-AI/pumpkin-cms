using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;

namespace pumpkin_api.Services;

public class TenantCorsPolicyProvider : ICorsPolicyProvider
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<TenantCorsPolicyProvider> _logger;
    private readonly DefaultCorsPolicyProvider _defaultProvider;
    private readonly TimeSpan _cacheDuration;
    private readonly ConcurrentDictionary<string, (CorsPolicy? Policy, DateTime ExpiresAt)> _policyCache = new();

    public TenantCorsPolicyProvider(
        IDatabaseService databaseService,
        ILogger<TenantCorsPolicyProvider> logger,
        IOptions<CorsOptions> options,
        IConfiguration configuration)
    {
        _databaseService = databaseService;
        _logger = logger;
        _defaultProvider = new DefaultCorsPolicyProvider(options);
        _cacheDuration = TimeSpan.FromMinutes(
            configuration.GetValue<int>("Cors:CacheMinutes", 30));
    }

    public async Task<CorsPolicy?> GetPolicyAsync(HttpContext context, string? policyName)
    {
        if (policyName == "TenantCors")
        {
            var tenantId = context.Request.RouteValues["tenantId"]?.ToString();

            if (string.IsNullOrEmpty(tenantId))
            {
                _logger.LogWarning("TenantCors: No tenantId in route, denying CORS");
                return null;
            }

            if (_policyCache.TryGetValue(tenantId, out var cached) && DateTime.UtcNow < cached.ExpiresAt)
                return cached.Policy;

            var policy = await BuildTenantPolicyAsync(tenantId);
            _policyCache[tenantId] = (policy, DateTime.UtcNow.Add(_cacheDuration));
            _logger.LogDebug("TenantCors: Cached origins for tenant {TenantId} for {Minutes} minutes",
                tenantId, _cacheDuration.TotalMinutes);

            return policy;
        }

        return await _defaultProvider.GetPolicyAsync(context, policyName);
    }

    private async Task<CorsPolicy?> BuildTenantPolicyAsync(string tenantId)
    {
        try
        {
            var tenant = await _databaseService.GetTenantAsync(tenantId);

            if (tenant?.Settings?.AllowedOrigins == null || tenant.Settings.AllowedOrigins.Length == 0)
            {
                _logger.LogWarning("TenantCors: No allowed origins configured for tenant {TenantId}", tenantId);
                return null;
            }

            return new CorsPolicyBuilder()
                .WithOrigins(tenant.Settings.AllowedOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .Build();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TenantCors: Error loading tenant {TenantId}", tenantId);
            return null;
        }
    }
}
