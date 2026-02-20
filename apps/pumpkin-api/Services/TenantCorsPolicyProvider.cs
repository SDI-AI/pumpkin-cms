using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.Options;

namespace pumpkin_api.Services;

public class TenantCorsPolicyProvider : ICorsPolicyProvider
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<TenantCorsPolicyProvider> _logger;
    private readonly DefaultCorsPolicyProvider _defaultProvider;

    public TenantCorsPolicyProvider(
        IDatabaseService databaseService,
        ILogger<TenantCorsPolicyProvider> logger,
        IOptions<CorsOptions> options)
    {
        _databaseService = databaseService;
        _logger = logger;
        _defaultProvider = new DefaultCorsPolicyProvider(options);
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

        return await _defaultProvider.GetPolicyAsync(context, policyName);
    }
}
