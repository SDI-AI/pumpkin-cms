# Pumpkin Database Bootstrap

Creates the database resources and base tenant records needed for a fresh Pumpkin API environment.

The API does not create Cosmos containers or Mongo indexes at startup. Run this tool once per environment, and again when adding a base tenant to an empty database.

## What It Creates

Cosmos DB:

- database if missing
- containers with partition key `/tenantId`

MongoDB:

- collections if missing
- indexes for common tenant-scoped lookups

Seed data:

- base tenant with a hashed API key
- optional admin user
- optional default contact form definition
- optional default active theme
- optional draft home page

The tool is idempotent. Existing records are left in place unless a missing seed can be safely added.

## Required Resources

Containers or collections:

```text
Tenant
Page
Theme
User
FormDefinition
FormEntry
MediaAsset
```

## Cosmos Example

```powershell
dotnet run --project tools\Pumpkin.DatabaseBootstrap -- `
  --provider CosmosDb `
  --cosmos-connection-string "<connection-string>" `
  --database PumpkinCMS `
  --tenant-id pumpkin `
  --tenant-name "Pumpkin CMS" `
  --allowed-origin "http://localhost:3003" `
  --admin-email "admin@example.com"
```

## Mongo Example

```powershell
dotnet run --project tools\Pumpkin.DatabaseBootstrap -- `
  --provider MongoDb `
  --mongo-connection-string "mongodb://localhost:27017" `
  --database PumpkinCMS `
  --tenant-id pumpkin `
  --tenant-name "Pumpkin CMS" `
  --allowed-origin "http://localhost:3003" `
  --admin-email "admin@example.com"
```

If `--api-key` or `--admin-password` are omitted for new records, secure values are generated and printed once.

## Options

```text
--provider CosmosDb|MongoDb
--database <name>
--cosmos-connection-string <connection-string>
--mongo-connection-string <connection-string>
--tenant-id <slug>
--tenant-name <name>
--tenant-plan <plan>
--allowed-origin <url>      repeatable or comma-separated
--api-key <plain-text-key>
--admin-email <email>
--admin-password <password>
--admin-username <username>
--skip-admin-user
--skip-default-form
--skip-default-theme
--skip-home-page
```

Environment variable alternatives:

```text
Database__Provider
Database__CosmosDb__ConnectionString
Database__MongoDb__ConnectionString
Database__CosmosDb__DatabaseName
Database__MongoDb__DatabaseName
PUMPKIN_BOOTSTRAP_TENANT_ID
PUMPKIN_BOOTSTRAP_TENANT_NAME
PUMPKIN_BOOTSTRAP_TENANT_PLAN
PUMPKIN_BOOTSTRAP_ALLOWED_ORIGINS
PUMPKIN_BOOTSTRAP_API_KEY
PUMPKIN_BOOTSTRAP_ADMIN_EMAIL
PUMPKIN_BOOTSTRAP_ADMIN_PASSWORD
PUMPKIN_BOOTSTRAP_ADMIN_USERNAME
```
