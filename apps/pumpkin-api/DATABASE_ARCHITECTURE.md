# Database Architecture Refactoring

This document describes the new flexible database architecture that supports multiple database providers (Cosmos DB and MongoDB).

## Architecture Overview

The refactored architecture consists of the following layers:

```
???????????????????????????????????????????????????
?           Application Layer                      ?
?         (Controllers/Managers)                   ?
???????????????????????????????????????????????????
                 ?
                 ?
???????????????????????????????????????????????????
?          IDatabaseService                        ?
?      (High-level service interface)             ?
???????????????????????????????????????????????????
                 ?
                 ?
???????????????????????????????????????????????????
?         DatabaseService                          ?
?    (Router based on configuration)              ?
????????????????????????????????????????????????????
            ?                      ?
            ?                      ?
????????????????????????  ????????????????????????
?  CosmosDataConnection?  ?  MongoDataConnection ?
?  (implements         ?  ?  (implements         ?
?   IDataConnection)   ?  ?   IDataConnection)   ?
????????????????????????  ????????????????????????
```

## Components

### 1. **IDataConnection** (Interface)
Common interface that defines database operations. Both Cosmos DB and MongoDB implementations implement this interface.

**Location:** `Services/IDataConnection.cs`

**Methods:**
- `GetPageAsync(string apiKey, string tenantId, string pageSlug)`
- `SavePageAsync(string apiKey, string tenantId, Page page)`
- `UpdatePageAsync(string apiKey, string tenantId, string pageSlug, Page page)`
- `DeletePageAsync(string apiKey, string tenantId, string pageSlug)`

### 2. **IDatabaseService** (Interface)
High-level service interface used by the application layer. This provides a stable API regardless of the underlying database.

**Location:** `Services/IDatabaseService.cs`

### 3. **DatabaseService** (Implementation)
Routes database operations to the appropriate implementation (Cosmos DB or MongoDB) based on configuration.

**Location:** `Services/DatabaseService.cs`

**Key Features:**
- Reads the `Provider` setting from configuration
- Creates the appropriate data connection at startup
- Delegates all operations to the selected implementation

### 4. **CosmosDataConnection** (Implementation)
Cosmos DB-specific implementation of `IDataConnection`.

**Location:** `Services/CosmosDataConnection.cs`

**Features:**
- Azure Cosmos DB SDK integration
- Request Unit (RU) tracking
- Partition key optimization
- Retry policies

### 5. **MongoDataConnection** (Implementation)
MongoDB-specific implementation of `IDataConnection`.

**Location:** `Services/MongoDataConnection.cs`

**Features:**
- MongoDB driver integration
- Connection pooling
- Filter builders for queries
- Conditional compilation support

**Note:** MongoDB support requires the `MongoDB.Driver` NuGet package. To enable MongoDB:
```bash
dotnet add package MongoDB.Driver
```

Then define the `USE_MONGODB` compilation symbol in your project file:
```xml
<PropertyGroup>
  <DefineConstants>USE_MONGODB</DefineConstants>
</PropertyGroup>
```

### 6. **DatabaseSettings** (Configuration)
Configuration class for database settings.

**Location:** `Services/DatabaseSettings.cs`

**Properties:**
- `Provider`: Database provider name ("CosmosDb" or "MongoDb")
- `CosmosDb`: Cosmos DB-specific settings
- `MongoDb`: MongoDB-specific settings

## Configuration

### appsettings.json Structure

```json
{
  "Database": {
    "Provider": "CosmosDb",
    "CosmosDb": {
      "ConnectionString": "AccountEndpoint=...;AccountKey=...;",
      "DatabaseName": "PumpkinCMS",
      "MaxRetryAttemptsOnRateLimitedRequests": 9,
      "MaxRetryWaitTimeOnRateLimitedRequests": 30,
      "PreferredRegions": ""
    },
    "MongoDb": {
      "ConnectionString": "mongodb://localhost:27017",
      "DatabaseName": "PumpkinCMS",
      "MaxConnectionPoolSize": 100,
      "ConnectTimeoutMs": 30000,
      "ServerSelectionTimeoutMs": 30000
    }
  }
}
```

### Switching Databases

To switch between databases, simply change the `Provider` value:

**For Cosmos DB:**
```json
"Database": {
  "Provider": "CosmosDb"
}
```

**For MongoDB:**
```json
"Database": {
  "Provider": "MongoDb"
}
```

## Dependency Injection Setup

The services are registered in `Program.cs`:

```csharp
// Configure Database settings
builder.Services.Configure<DatabaseSettings>(
    builder.Configuration.GetSection(DatabaseSettings.SectionName));

// Configure Cosmos DB settings
builder.Services.Configure<CosmosDbSettings>(
    builder.Configuration.GetSection($"{DatabaseSettings.SectionName}:CosmosDb"));

// Configure MongoDB settings
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection($"{DatabaseSettings.SectionName}:MongoDb"));

// Register data connection implementations
builder.Services.AddSingleton<CosmosDataConnection>();
builder.Services.AddSingleton<MongoDataConnection>();

// Register the main database service
builder.Services.AddSingleton<IDatabaseService, DatabaseService>();
```

## Usage in Application Code

Application code should use `IDatabaseService` instead of directly referencing database implementations:

```csharp
public static async Task<IResult> GetPageAsync(
    IDatabaseService databaseService, 
    string apiKey, 
    string tenantId, 
    string pageSlug, 
    ILogger? logger = null)
{
    var page = await databaseService.GetPageAsync(apiKey, tenantId, pageSlug);
    // ...
}
```

## Migration Guide

### From Old Architecture (ICosmosDbFacade)

**Before:**
```csharp
public static async Task<IResult> GetPageAsync(
    ICosmosDbFacade cosmosDb,
    string apiKey,
    string tenantId,
    string pageSlug)
{
    var page = await cosmosDb.GetPageAsync(apiKey, tenantId, pageSlug);
}
```

**After:**
```csharp
public static async Task<IResult> GetPageAsync(
    IDatabaseService databaseService,
    string apiKey,
    string tenantId,
    string pageSlug)
{
    var page = await databaseService.GetPageAsync(apiKey, tenantId, pageSlug);
}
```

### Configuration Migration

**Before (appsettings.json):**
```json
{
  "CosmosDb": {
    "ConnectionString": "...",
    "DatabaseName": "PumpkinCMS"
  }
}
```

**After (appsettings.json):**
```json
{
  "Database": {
    "Provider": "CosmosDb",
    "CosmosDb": {
      "ConnectionString": "...",
      "DatabaseName": "PumpkinCMS"
    }
  }
}
```

## Benefits

1. **Flexibility**: Easy to switch between database providers
2. **Testability**: Can mock `IDatabaseService` for unit tests
3. **Maintainability**: Clear separation of concerns
4. **Extensibility**: Easy to add new database providers
5. **Configuration-driven**: No code changes required to switch databases

## Adding a New Database Provider

To add a new database provider (e.g., PostgreSQL):

1. Create a new class implementing `IDataConnection`:
   ```csharp
   public class PostgresDataConnection : IDataConnection, IDisposable
   {
       // Implementation...
   }
   ```

2. Add configuration settings in `DatabaseSettings`:
   ```csharp
   public PostgresDbSettings PostgresDb { get; set; } = new();
   ```

3. Update `DatabaseService` to handle the new provider:
   ```csharp
   _dataConnection = databaseSettings.Provider.ToLowerInvariant() switch
   {
       "cosmosdb" => serviceProvider.GetRequiredService<CosmosDataConnection>(),
       "mongodb" => serviceProvider.GetRequiredService<MongoDataConnection>(),
       "postgresql" => serviceProvider.GetRequiredService<PostgresDataConnection>(),
       _ => throw new InvalidOperationException($"Unsupported database provider: {databaseSettings.Provider}")
   };
   ```

4. Register the new connection in `Program.cs`:
   ```csharp
   builder.Services.AddSingleton<PostgresDataConnection>();
   ```

## Legacy Files

The following files are now superseded by the new architecture but remain for backwards compatibility:

- `Services/ICosmosDbFacade.cs` (replaced by `IDatabaseService`)
- `Services/CosmosDbFacade.cs` (replaced by `CosmosDataConnection`)

These files can be removed once all references have been updated to use the new architecture.

## Testing

The test project has been updated to use `IDatabaseService`:

**Location:** `../pumpkin-api.Tests/Program.cs`

The tests demonstrate how to:
1. Load configuration
2. Create database service instances
3. Perform CRUD operations
4. Handle errors

## Troubleshooting

### MongoDB Support Not Available

**Error:** "MongoDB support is not enabled"

**Solution:** 
1. Install MongoDB.Driver package: `dotnet add package MongoDB.Driver`
2. Define USE_MONGODB compilation symbol (optional, for conditional compilation)

### Provider Not Recognized

**Error:** "Unsupported database provider: XYZ"

**Solution:** Check the `Provider` value in `appsettings.json`. Valid values are:
- `CosmosDb`
- `MongoDb` (case-insensitive)

### Connection Issues

**Cosmos DB:**
- Verify connection string in configuration
- Check firewall/network settings
- Ensure database and containers exist

**MongoDB:**
- Verify connection string format
- Check MongoDB server is running
- Verify authentication credentials

## Performance Considerations

### Cosmos DB
- Connection pooling is handled automatically
- Monitor Request Units (RU) consumption
- Use partition keys effectively
- Implement retry policies

### MongoDB
- Configure connection pool size appropriately
- Set reasonable timeout values
- Use indexes for frequently queried fields
- Monitor connection usage

## Security

- Store connection strings in Azure Key Vault or secure configuration
- Use managed identities where possible
- Rotate credentials regularly
- Implement proper authentication and authorization
- Use encrypted connections (SSL/TLS)

## Future Enhancements

Potential improvements to the architecture:

1. **Caching Layer**: Add Redis or in-memory caching
2. **Read Replicas**: Support for read-only database connections
3. **Multi-tenancy**: Database-per-tenant or schema-per-tenant support
4. **Monitoring**: Integration with Application Insights
5. **Migration Tools**: Automated data migration between providers
6. **Health Checks**: Database connectivity health endpoints
