# ?? Pumpkin CMS - Deployment Configuration Guide

## ?? Configuration Files Overview

| File | Purpose | Git Status | Contains Secrets |
|------|---------|------------|------------------|
| `appsettings.json` | Base configuration (all environments) | ? **Committed** | ? No (placeholders only) |
| `appsettings.Development.json` | Local development overrides | ? **Gitignored** | ? Yes (local secrets) |
| `appsettings.Production.json` | Production overrides | ? **Gitignored** | ? Yes (prod secrets) |
| `appsettings.Production.json.example` | Production template | ? **Committed** | ? No (template only) |

## ?? Configuration Hierarchy

.NET loads configuration in this order (later overrides earlier):

1. `appsettings.json` (base, committed)
2. `appsettings.{Environment}.json` (environment-specific, gitignored)
3. **Environment Variables** (highest priority)
4. **Azure Key Vault** (for Azure deployments)

## ?? Local Development Setup

### Current Setup ?
Your local environment is now configured:

**appsettings.Development.json** (gitignored):
```json
{
  "Jwt": {
    "SecretKey": "YOUR-LOCAL-DEV-SECRET-KEY-HERE"
  },
  "Database": {
    "CosmosDb": {
      "ConnectionString": "YOUR-LOCAL-COSMOS-CONNECTION-STRING"
    }
  }
}
```

### To Run Locally:
```bash
dotnet run
# or
dotnet run --environment Development
```

This will automatically use `appsettings.Development.json` when running locally.

---

## ?? Azure App Service Deployment

### Option 1: Environment Variables (Recommended)

Set these in Azure Portal ? App Service ? Configuration ? Application Settings:

```
Jwt__SecretKey = YOUR-PRODUCTION-JWT-SECRET-KEY-HERE
Database__CosmosDb__ConnectionString = YOUR-PRODUCTION-COSMOS-CONNECTION-STRING
```

**Note**: Use double underscores `__` to represent nested JSON structure.

### Option 2: Azure Key Vault (Most Secure)

1. **Create Key Vault**:
```bash
az keyvault create \
  --name pumpkin-cms-vault \
  --resource-group pumpkin-rg \
  --location eastus
```

2. **Store Secrets**:
```bash
az keyvault secret set \
  --vault-name pumpkin-cms-vault \
  --name "Jwt--SecretKey" \
  --value "YOUR-PRODUCTION-JWT-SECRET-KEY"

az keyvault secret set \
  --vault-name pumpkin-cms-vault \
  --name "Database--CosmosDb--ConnectionString" \
  --value "YOUR-PRODUCTION-COSMOS-CONNECTION-STRING"
```

3. **Grant App Service Access**:
```bash
# Enable managed identity for your App Service
az webapp identity assign \
  --name pumpkin-cms-api \
  --resource-group pumpkin-rg

# Grant access to Key Vault
az keyvault set-policy \
  --name pumpkin-cms-vault \
  --object-id <MANAGED_IDENTITY_PRINCIPAL_ID> \
  --secret-permissions get list
```

4. **Update Program.cs** (if using Key Vault):
```csharp
// Add to Program.cs after builder creation
if (builder.Environment.IsProduction())
{
    var keyVaultUri = new Uri("https://pumpkin-cms-vault.vault.azure.net/");
    builder.Configuration.AddAzureKeyVault(keyVaultUri, new DefaultAzureCredential());
}
```

### Option 3: App Service Configuration File

Create `appsettings.Production.json` on the server (not in Git):

```json
{
  "Jwt": {
    "SecretKey": "YOUR-PRODUCTION-SECRET-KEY"
  },
  "Database": {
    "CosmosDb": {
      "ConnectionString": "YOUR-PRODUCTION-CONNECTION-STRING"
    }
  }
}
```

Deploy this file separately via Azure Portal or FTP.

---

## ?? Docker Deployment

### Using Environment Variables

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  pumpkin-api:
    image: pumpkin-cms-api:latest
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - Jwt__SecretKey=${JWT_SECRET_KEY}
      - Database__CosmosDb__ConnectionString=${COSMOS_CONNECTION_STRING}
    ports:
      - "8080:8080"
```

**.env** (gitignored):
```env
JWT_SECRET_KEY=YOUR-JWT-SECRET-KEY-HERE
COSMOS_CONNECTION_STRING=YOUR-COSMOS-CONNECTION-STRING-HERE
```

Run with:
```bash
docker-compose up
```

---

## ?? Rotating Secrets

### Generate New JWT Secret Key

```powershell
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

```bash
# Linux/Mac
openssl rand -base64 32
```

### Update in All Environments

1. **Development**: Update `appsettings.Development.json`
2. **Production**: Update Azure Key Vault or App Service Configuration
3. **Restart** the application to pick up new secrets

?? **Warning**: Changing JWT secret will invalidate all existing tokens. Users will need to re-login.

---

## ? Security Checklist

Before deploying to production:

- [ ] `appsettings.json` contains only placeholders
- [ ] `appsettings.Development.json` is in `.gitignore`
- [ ] `appsettings.Production.json` is in `.gitignore`
- [ ] Production secrets are in Azure Key Vault or App Service Configuration
- [ ] JWT secret key is at least 32 characters
- [ ] Cosmos DB connection string uses managed identity (when possible)
- [ ] No secrets committed to Git repository
- [ ] Different secrets used for dev/staging/production
- [ ] Secrets are rotated periodically

---

## ?? Testing Configuration

### Verify Local Development:
```bash
dotnet run --environment Development
curl http://localhost:5000/api/auth/login
```

### Verify Production Settings:
```bash
# Check Azure App Service configuration
az webapp config appsettings list \
  --name pumpkin-cms-api \
  --resource-group pumpkin-rg

# Check if secrets are loaded (without exposing values)
curl https://your-app.azurewebsites.net/
```

---

## ?? Additional Resources

- [ASP.NET Core Configuration](https://docs.microsoft.com/aspnet/core/fundamentals/configuration/)
- [Azure Key Vault Configuration Provider](https://docs.microsoft.com/aspnet/core/security/key-vault-configuration)
- [Managed Identities for Azure Resources](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/)

---

**Made with ?? by Pumpkin CMS Team**
