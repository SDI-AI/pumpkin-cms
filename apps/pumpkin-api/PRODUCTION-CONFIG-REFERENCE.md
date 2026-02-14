# Production Configuration Guide
# ==============================================================================
# This file documents all configuration options for appsettings.Production.json
# Copy appsettings.Production.json.example to create your production config
# ==============================================================================

## JWT Configuration

### Issuer (string)
- Description: The entity that issues the JWT token
- Default: "pumpkin-cms-api"
- Production: Keep default or use your domain (e.g., "https://api.yourdomain.com")
- Environment Variable: Jwt__Issuer

### Audience (string)
- Description: The intended recipient of the JWT token
- Default: "pumpkin-cms-admin"
- Production: Keep default or use your admin app identifier
- Environment Variable: Jwt__Audience

### SecretKey (string) ?? REQUIRED
- Description: Secret key used to sign JWT tokens (minimum 32 characters)
- Default: Placeholder only
- Production: MUST be set via Environment Variable or Azure Key Vault
- Security: Use a cryptographically random 256-bit (32+ character) key
- Generate: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
- Environment Variable: Jwt__SecretKey
- Azure Key Vault: Store as "Jwt--SecretKey"

### ExpirationMinutes (integer)
- Description: How long JWT tokens remain valid (in minutes)
- Development: 480 (8 hours)
- Production: 240 (4 hours) - recommended for better security
- Environment Variable: Jwt__ExpirationMinutes
- Note: Shorter expiration = more secure but users must login more often

## Database Configuration

### Provider (string)
- Description: Which database provider to use
- Options: "CosmosDb" or "MongoDb"
- Default: "CosmosDb"
- Environment Variable: Database__Provider

### CosmosDb__ConnectionString (string) ?? REQUIRED
- Description: Azure Cosmos DB connection string
- Format: "AccountEndpoint=https://...;AccountKey=...;"
- Production: MUST be set via Environment Variable or Azure Key Vault
- Environment Variable: Database__CosmosDb__ConnectionString
- Azure Key Vault: Store as "Database--CosmosDb--ConnectionString"
- Best Practice: Use Managed Identity instead of connection string when possible

### CosmosDb__DatabaseName (string)
- Description: Name of the Cosmos DB database
- Default: "PumpkinCMS"
- Environment Variable: Database__CosmosDb__DatabaseName

### CosmosDb__MaxRetryAttemptsOnRateLimitedRequests (integer)
- Description: Max retries when rate limited (429 errors)
- Default: 9
- Production: Keep default unless experiencing frequent rate limiting
- Environment Variable: Database__CosmosDb__MaxRetryAttemptsOnRateLimitedRequests

### CosmosDb__MaxRetryWaitTimeOnRateLimitedRequests (integer)
- Description: Max wait time in seconds between retries
- Default: 30
- Production: Keep default or increase for high-volume scenarios
- Environment Variable: Database__CosmosDb__MaxRetryWaitTimeOnRateLimitedRequests

### CosmosDb__PreferredRegions (string)
- Description: Comma-separated list of preferred Azure regions
- Default: "" (use primary region only)
- Production: Set for multi-region failover (e.g., "East US,West US")
- Environment Variable: Database__CosmosDb__PreferredRegions

## Logging Configuration

### LogLevel__Default (string)
- Options: Trace, Debug, Information, Warning, Error, Critical, None
- Development: "Debug" or "Information"
- Production: "Warning" - logs only warnings, errors, and critical issues
- Environment Variable: Logging__LogLevel__Default

### LogLevel__Microsoft.AspNetCore (string)
- Production: "Warning" - reduces noise from ASP.NET Core framework logs
- Environment Variable: Logging__LogLevel__Microsoft.AspNetCore

### LogLevel__Microsoft.Hosting.Lifetime (string)
- Production: "Information" - logs startup/shutdown events
- Environment Variable: Logging__LogLevel__Microsoft.Hosting.Lifetime

## AllowedHosts (string)
- Description: Semicolon-separated list of allowed host names
- Default: "*" (allows all hosts)
- Production: Set to your domain (e.g., "api.yourdomain.com;*.yourdomain.com")
- Environment Variable: AllowedHosts
- Security: Restricting hosts prevents host header injection attacks

## ==============================================================================
## Azure App Service Configuration (Recommended Method)
## ==============================================================================

# Set in Azure Portal ? App Service ? Configuration ? Application Settings:

Jwt__SecretKey = <your-production-jwt-secret-key>
Jwt__ExpirationMinutes = 240
Database__CosmosDb__ConnectionString = <your-production-cosmos-connection-string>
AllowedHosts = api.yourdomain.com

## ==============================================================================
## Azure Key Vault Configuration (Most Secure Method)
## ==============================================================================

# Store secrets in Azure Key Vault:
az keyvault secret set --vault-name your-vault --name "Jwt--SecretKey" --value "..."
az keyvault secret set --vault-name your-vault --name "Database--CosmosDb--ConnectionString" --value "..."

# Grant App Service access via Managed Identity (see DEPLOYMENT.md)

## ==============================================================================
## Docker Environment Variables
## ==============================================================================

# docker-compose.yml or Kubernetes ConfigMap/Secret:
ASPNETCORE_ENVIRONMENT=Production
Jwt__SecretKey=${JWT_SECRET}
Jwt__ExpirationMinutes=240
Database__CosmosDb__ConnectionString=${COSMOS_CONNECTION_STRING}

## ==============================================================================
## Configuration Hierarchy (Priority: Highest to Lowest)
## ==============================================================================

1. Environment Variables (highest priority)
2. Azure Key Vault
3. appsettings.Production.json
4. appsettings.json (base configuration)

## ==============================================================================
## Security Best Practices
## ==============================================================================

? DO:
- Use Environment Variables or Azure Key Vault for secrets
- Generate cryptographically random JWT secret keys
- Use different secrets for dev/staging/production
- Rotate secrets periodically
- Use Managed Identity for Azure resources
- Restrict AllowedHosts in production
- Use shorter JWT expiration times in production

? DON'T:
- Commit appsettings.Production.json with real secrets
- Use the same JWT secret across environments
- Use weak or predictable secret keys
- Store connection strings in application code
- Deploy with development settings

## ==============================================================================
