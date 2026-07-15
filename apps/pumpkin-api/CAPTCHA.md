# Tenant CAPTCHA configuration

Pumpkin resolves CAPTCHA settings from the tenant and lets each form inherit, require, or disable the challenge. The current provider is Cloudflare Turnstile.

Store only the configuration reference on the tenant. Put the referenced secret in API configuration or a connected secret provider; it is never returned in a public form definition.

```json
{
  "settings": {
    "formSecurity": {
      "captcha": {
        "provider": "turnstile",
        "siteKey": "PUBLIC_TURNSTILE_SITE_KEY",
        "secretKeyReference": "Captcha:Tenants:tenant-a:SecretKey",
        "enabledByDefault": true,
        "allowedHostnames": ["www.example.com", "example.com"]
      }
    }
  }
}
```

For local development or Azure App Service, that reference can be supplied as an environment variable:

```text
Captcha__Tenants__tenant-a__SecretKey=TURNSTILE_SECRET_VALUE
```

On a form definition, configure the override under `spamProtection.captcha`:

```json
{
  "mode": "inherit",
  "provider": "none",
  "siteKey": "",
  "action": "contact_submit"
}
```

`provider` and `siteKey` in the form definition are output fields populated by the public API after tenant resolution. Form administration only needs to save `mode` and `action`.

Successful submissions can set `submitBehavior` to `redirect` and `redirectUrl` to a relative site path such as `/thank-you` or an absolute HTTP(S) URL. Relative paths are preferable for first-party conversion pages.
