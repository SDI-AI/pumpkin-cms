using System.Net.Http.Json;
using System.Text.Json.Serialization;
using pumpkin_net_models.Models;

namespace pumpkin_api.Services;

public interface ICaptchaVerifier
{
    Task<CaptchaVerificationResult> VerifyAsync(
        TenantCaptchaSettings settings,
        string token,
        string remoteIp,
        string expectedAction,
        CancellationToken cancellationToken = default);
}

public sealed record CaptchaVerificationResult(bool Success, string Error = "");

public sealed class TurnstileCaptchaVerifier(HttpClient httpClient, IConfiguration configuration) : ICaptchaVerifier
{
    private const string VerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    public async Task<CaptchaVerificationResult> VerifyAsync(
        TenantCaptchaSettings settings,
        string token,
        string remoteIp,
        string expectedAction,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(settings.Provider, CaptchaProviders.Turnstile, StringComparison.OrdinalIgnoreCase))
            return new(false, "Unsupported CAPTCHA provider");

        if (string.IsNullOrWhiteSpace(settings.SecretKeyReference))
            return new(false, "CAPTCHA secret reference is not configured");

        var secret = configuration[settings.SecretKeyReference];
        if (string.IsNullOrWhiteSpace(secret))
            return new(false, "CAPTCHA secret is unavailable");

        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["secret"] = secret,
            ["response"] = token,
            ["remoteip"] = remoteIp,
        });
        using var response = await httpClient.PostAsync(VerifyUrl, content, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new(false, "CAPTCHA verification service is unavailable");

        var verification = await response.Content.ReadFromJsonAsync<TurnstileResponse>(cancellationToken);
        if (verification?.Success != true)
            return new(false, "CAPTCHA verification failed");

        if (!string.IsNullOrWhiteSpace(expectedAction) &&
            !string.Equals(verification.Action, expectedAction, StringComparison.Ordinal))
            return new(false, "CAPTCHA action did not match");

        if (settings.AllowedHostnames.Length > 0 &&
            !settings.AllowedHostnames.Contains(verification.Hostname, StringComparer.OrdinalIgnoreCase))
            return new(false, "CAPTCHA hostname is not allowed");

        return new(true);
    }

    private sealed class TurnstileResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; init; }

        [JsonPropertyName("hostname")]
        public string Hostname { get; init; } = string.Empty;

        [JsonPropertyName("action")]
        public string Action { get; init; } = string.Empty;
    }
}
