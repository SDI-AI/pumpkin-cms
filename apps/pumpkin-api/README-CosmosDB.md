# Pumpkin CMS API - Cosmos DB Integration

## Overview

This API includes a comprehensive Cosmos DB facade that provides a clean, easy-to-use interface for interacting with Azure Cosmos DB. The facade follows best practices for Azure Cosmos DB development and includes built-in logging, diagnostics, and error handling.

## Configuration

### Connection Strings

The application is configured to use the Cosmos DB emulator by default for local development:

- **Local Development**: Uses Cosmos DB Emulator (`localhost:8081`)
- **Production**: Configure your Azure Cosmos DB connection string

### Settings

Configure Cosmos DB settings in `appsettings.json`:

```json
{
  "CosmosDb": {
    "ConnectionString": "AccountEndpoint=https://localhost:8081/;AccountKey=...",
    "DatabaseName": "PumpkinCMS",
    "ContainerName": "Content",
    "PartitionKey": "/tenantId",
    "MaxRetryAttemptsOnRateLimitedRequests": 9,
    "MaxRetryWaitTimeOnRateLimitedRequests": 30,
    "PreferredRegions": "East US,West US"
  }
}
```

## Using the Cosmos DB Facade

### Dependency Injection

The facade is registered as a singleton in the DI container:

```csharp
builder.Services.AddSingleton<ICosmosDbFacade, CosmosDbFacade>();
```

### Basic Operations

```csharp
// Get a single item
var item = await cosmosDb.GetItemAsync<ContentItem>("item-id", "partition-key");

// Get multiple items with a query
var items = await cosmosDb.GetItemsAsync<ContentItem>(
    "SELECT * FROM c WHERE c.status = @status",
    new Dictionary<string, object> { { "@status", "published" } }
);

// Create a new item
var newItem = await cosmosDb.CreateItemAsync(contentItem, "partition-key");

// Update or create an item (upsert)
var upsertedItem = await cosmosDb.UpsertItemAsync(contentItem, "partition-key");

// Update an existing item
var updatedItem = await cosmosDb.ReplaceItemAsync("item-id", contentItem, "partition-key");

// Delete an item
await cosmosDb.DeleteItemAsync("item-id", "partition-key");

// Check if an item exists
var exists = await cosmosDb.ItemExistsAsync("item-id", "partition-key");

// Get count of items
var count = await cosmosDb.GetItemCountAsync("SELECT * FROM c WHERE c.status = @status", 
    new Dictionary<string, object> { { "@status", "published" } });
```

## Data Modeling Best Practices

### Partition Key Strategy

The facade is configured to use `/tenantId` as the partition key, which provides:

- **Multi-tenancy**: Isolate data by tenant
- **Even distribution**: Assuming balanced tenant data
- **Query efficiency**: Most queries filter by tenant

### Content Item Model

The `ContentItem` model demonstrates good Cosmos DB practices:

```csharp
public class ContentItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonPropertyName("tenantId")]  // Partition key
    public string TenantId { get; set; } = string.Empty;
    
    // Other properties...
}
```

## API Endpoints

### Health Check

- `GET /health/cosmos` - Check Cosmos DB connectivity

### Content Management

- `GET /api/content?tenantId=default` - Get all content for a tenant
- `GET /api/content/{id}?tenantId=default` - Get specific content item
- `POST /api/content` - Create new content item
- `PUT /api/content/{id}` - Update content item
- `DELETE /api/content/{id}?tenantId=default` - Delete content item

## Development Setup

### 1. Install Cosmos DB Emulator

Download and install the [Azure Cosmos DB Emulator](https://learn.microsoft.com/azure/cosmos-db/emulator).

### 2. Create Database and Container

The application expects:
- Database: `PumpkinCMS-Dev` (development) or `PumpkinCMS` (production)
- Container: `Content`
- Partition Key: `/tenantId`

### 3. Run the Application

```bash
dotnet watch
```

### 4. Test the API

```bash
# Health check
curl https://localhost:5001/health/cosmos

# Create content
curl -X POST https://localhost:5001/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome Page",
    "content": "Welcome to Pumpkin CMS!",
    "tenantId": "default"
  }'

# Get content
curl https://localhost:5001/api/content?tenantId=default
```

## Monitoring and Diagnostics

The facade includes comprehensive logging and diagnostics:

- **High latency detection**: Logs operations > 100ms
- **Request Units (RU) tracking**: Logs RU consumption
- **Diagnostic strings**: Captures detailed operation diagnostics
- **Error handling**: Proper exception handling with logging

### Accessing Diagnostics

```csharp
// Get diagnostic information
var diagnostics = cosmosDb.GetDiagnostics();
```

## Error Handling

The facade handles common Cosmos DB exceptions:

- **404 Not Found**: Returns `null` for get operations
- **429 Too Many Requests**: Automatic retry with backoff
- **Connection issues**: Proper logging and error propagation

## Production Considerations

1. **Connection String**: Use Azure Key Vault for production connection strings
2. **Monitoring**: Set up Azure Monitor for Cosmos DB metrics
3. **Request Units**: Monitor and adjust RU allocation based on workload
4. **Regions**: Configure preferred regions for multi-region deployments
5. **Backup**: Ensure automatic backups are configured in Azure

## VS Code Extensions

For enhanced development experience, install:

- **Azure Cosmos DB Extension**: `ms-azuretools.vscode-cosmosdb`
  - View and query data directly in VS Code
  - Manage databases and containers
  - No need for custom scripts

## References

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Cosmos DB .NET SDK](https://docs.microsoft.com/azure/cosmos-db/sql/sql-api-sdk-dotnet-standard)
- [Cosmos DB Best Practices](https://docs.microsoft.com/azure/cosmos-db/sql/best-practice-dotnet)