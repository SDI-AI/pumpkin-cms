# Configuration Management Guide

## Overview

The Pumpkin CMS API uses ASP.NET Core's configuration system with environment-specific settings.

## Configuration Files

### ?? Base Configuration
**File:** `appsettings.json`
- ? Committed to Git
- Contains default settings and structure
- **Does NOT contain sensitive data** (connection strings are empty)

### ?? Development Configuration
**File:** `appsettings.Development.json`
- ? **NOT committed to Git** (in .gitignore)
- Contains development/test database connection strings
- Used when running locally in Development environment
- Higher logging verbosity for debugging

### ?? Production Configuration
**File:** `appsettings.Production.json`
- ? **NOT committed to Git** (in .gitignore)
- Contains production database connection strings
- Used when deployed to production
- Lower logging verbosity for performance

## .gitignore Configuration

The `.gitignore` file includes:

```gitignore
# Configuration files with sensitive data
appsettings.Development.json
appsettings.*.json
!appsettings.json
*.config.user
```

This pattern:
- ? Ignores ALL environment-specific config files (`appsettings.*.json`)
- ? Allows ONLY the base `appsettings.json` to be committed
- ? Protects sensitive connection strings and secrets

## Configuration Structure

### Current Setup

```
appsettings.json (Base - in Git)
??? Empty ConnectionString
??? Default logging
??? Common settings

appsettings.Development.json (Local - NOT in Git)
??? Development Cosmos DB connection
??? Debug logging
??? Development-specific settings

appsettings.Production.json (Deploy - NOT in Git)
??? Production Cosmos DB connection
??? Warning-level logging
??? Production-specific settings
```

## Environment Variables

ASP.NET Core configuration can be overridden by environment variables:

### Local Development
```bash
# PowerShell
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:CosmosDb__ConnectionString = "your-connection-string"

# Bash
export ASPNETCORE_ENVIRONMENT=Development
export CosmosDb__ConnectionString="your-connection-string"
```

### Azure App Service

Set in Azure Portal under **Configuration > Application settings**:

```
CosmosDb__ConnectionString = <production-connection-string>
CosmosDb__DatabaseName = PumpkinCMS
ASPNETCORE_ENVIRONMENT = Production
```

## Configuration Loading Order

ASP.NET Core loads configuration in this order (later overrides earlier):

1. `appsettings.json` (base)
2. `appsettings.{Environment}.json` (environment-specific)
3. **Environment Variables** (highest priority)
4. Azure App Configuration (if configured)
5. Azure Key Vault (if configured)

## Security Best Practices

### ? DO:
- Keep `appsettings.json` free of sensitive data
- Use environment-specific files for connection strings
- Keep `appsettings.*.json` files out of source control
- Use Azure Key Vault for production secrets
- Use environment variables in CI/CD pipelines

### ? DON'T:
- Commit connection strings to Git
- Share `appsettings.Production.json` in chat/email
- Store production secrets in config files
- Check in API keys or passwords

## Setup Instructions

### For New Developers

1. **Clone the repository**
   ```bash
   git clone https://github.com/sdi-ai/pumpkin-cms.git
   cd pumpkin-cms/apps/pumpkin-api
   ```

2. **Create local development config**
   ```bash
   # Copy the example or create new file
   cp appsettings.Production.json appsettings.Development.json
   ```

3. **Update development connection string**
   - Edit `appsettings.Development.json`
   - Set your local Cosmos DB Emulator connection string:
   ```json
   {
     "CosmosDb": {
       "ConnectionString": "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
     }
   }
   ```

4. **Run the application**
   ```bash
   dotnet run
   ```

### For Production Deployment

#### Option 1: Azure App Service (Recommended)

Configure in Azure Portal:
1. Go to App Service ? Configuration ? Application settings
2. Add settings:
   - `CosmosDb__ConnectionString`
   - `CosmosDb__DatabaseName`
   - `ASPNETCORE_ENVIRONMENT` = `Production`

#### Option 2: Using appsettings.Production.json

1. Create `appsettings.Production.json` locally
2. Add production connection string
3. Deploy file to server (keep out of Git)
4. Set `ASPNETCORE_ENVIRONMENT=Production`

**Note:** File is already in `.gitignore`, so it won't be committed accidentally.

#### Option 3: Azure Key Vault

```csharp
// In Program.cs
builder.Configuration.AddAzureKeyVault(
    new Uri($"https://{builder.Configuration["KeyVaultName"]}.vault.azure.net/"),
    new DefaultAzureCredential());
```

## Current Configuration Values

### Cosmos DB Settings

| Setting | appsettings.json | appsettings.Development.json | appsettings.Production.json |
|---------|-----------------|-----------------------------|-----------------------------|
| ConnectionString | `""` (empty) | Dev connection string | Prod connection string |
| DatabaseName | `PumpkinCMS` | `pumpkin-cms` | `pumpkin-cms` |
| MaxRetryAttempts | `9` | `9` | `9` |
| MaxRetryWaitTime | `30` | `30` | `30` |
| PreferredRegions | `""` | `""` | `""` (or specific region) |

### Logging Levels

| Logger | appsettings.json | Development | Production |
|--------|-----------------|-------------|------------|
| Default | Information | Debug | Information |
| Microsoft.AspNetCore | Warning | Information | Warning |
| Hosting | - | Information | Warning |

## Troubleshooting

### "Connection string is empty"

**Cause:** No environment-specific config file found

**Solution:**
1. Check `ASPNETCORE_ENVIRONMENT` variable
2. Ensure `appsettings.{Environment}.json` exists
3. Verify connection string is set in the file

### "Configuration file not found"

**Cause:** Environment-specific file missing

**Solution:**
1. Create `appsettings.Development.json` for local dev
2. Or set connection string via environment variable:
   ```bash
   $env:CosmosDb__ConnectionString = "your-connection-string"
   ```

### "Access denied to Cosmos DB"

**Cause:** Invalid connection string or expired key

**Solution:**
1. Verify connection string is correct
2. Check Azure Portal for current keys
3. Regenerate keys if necessary

## Git Status Check

Verify files are properly configured:

```bash
# These should be tracked (green):
git status appsettings.json

# These should be ignored (not shown):
git status appsettings.Development.json
git status appsettings.Production.json
```

If environment files show up in `git status`, they're not being ignored properly. Check `.gitignore`.

## Summary

| File | Git | Contains Secrets | Used For |
|------|-----|-----------------|----------|
| `appsettings.json` | ? Committed | ? No | Base config |
| `appsettings.Development.json` | ? Ignored | ? Yes | Local dev |
| `appsettings.Production.json` | ? Ignored | ? Yes | Production |

**Remember:** Never commit files containing connection strings or API keys! ??
