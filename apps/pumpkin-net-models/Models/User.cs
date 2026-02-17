namespace pumpkin_net_models.Models;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string TenantId { get; set; }
    public required string Email { get; set; }
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public UserRole Role { get; set; } = UserRole.Viewer;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? LastLogin { get; set; }
    public List<string> Permissions { get; set; } = new();
    
    // Cosmos DB specific - must match TenantId for partitioning
    public string PartitionKey => TenantId;
}

public enum UserRole
{
    SuperAdmin,
    TenantAdmin,
    Editor,
    Viewer
}

public class LoginRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public class LoginResponse
{
    public required string Token { get; set; }
    public required UserInfo User { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class UserInfo
{
    public required string Id { get; set; }
    public required string TenantId { get; set; }
    public required string Email { get; set; }
    public required string Username { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public required string Role { get; set; }
    public List<string> Permissions { get; set; } = new();
}
