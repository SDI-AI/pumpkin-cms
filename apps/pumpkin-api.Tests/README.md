# Pumpkin CMS - Test & Utility Project

## ?? Security Notice

**This project generates API keys and user credentials for testing purposes.**

### Important Security Guidelines:

1. **No Secrets in Source Code**
   - This project does NOT contain any hardcoded secrets
   - API keys and passwords are generated randomly each run
   - The default password is `CHANGE-ME-BEFORE-PRODUCTION` - a placeholder only

2. **Configuration Files**
   - `appsettings.json` - Template file (safe to commit, no secrets)
   - `appsettings.Development.json` - Your local secrets (**NEVER commit**, already in .gitignore)
   - Connection strings should be empty in committed files

3. **Generated Credentials**
   - API keys are generated using cryptographically secure random bytes
   - Passwords are hashed with BCrypt before storage
   - Each run produces new, unique credentials

4. **Before Production**
   - Always change the placeholder password
   - Use environment variables or Azure Key Vault for production secrets
   - Never share plain-text API keys or passwords

## ?? What This Project Does

### API Key Generator
Generates a secure API key and BCrypt hash for tenant authentication:
- **API Key**: Base64-encoded random bytes (256-bit)
- **API Key Hash**: BCrypt hashed for secure storage

### User Generator
Creates user documents with hashed passwords for Cosmos DB:
- Supports multiple roles: SuperAdmin, TenantAdmin, Editor, Viewer
- Auto-generates appropriate permissions based on role
- Uses GUID for user IDs
- Hashes passwords with BCrypt

## ?? Usage

### Generate Admin Credentials

```bash
cd pumpkin-api.Tests
dotnet run
```

This will output:
1. **Tenant API Key** - Use for programmatic API access
2. **User Credentials** - Use for admin dashboard login
3. **Complete JSON documents** - Ready to insert into Cosmos DB

### Customize User Generation

Edit `Program.cs` and modify the `UserGenerator.GenerateUser()` call:

```csharp
var (userDoc, userPassword) = UserGenerator.GenerateUser(
    email: "your-email@domain.com",
    username: "your-username",
    password: "YourSecureP@ssw0rd!",  // Choose a strong password
    tenantId: "your-tenant",
    firstName: "John",
    lastName: "Doe",
    role: 0  // 0=SuperAdmin, 1=TenantAdmin, 2=Editor, 3=Viewer
);
```

### Generate Multiple Users

```csharp
var users = UserGenerator.GenerateMultipleUsers(
    ("admin@company.com", "admin", "SecurePass1!", "tenant1", "Admin", "User", 0),
    ("editor@company.com", "editor", "SecurePass2!", "tenant1", "Editor", "User", 2),
    ("viewer@company.com", "viewer", "SecurePass3!", "tenant1", "Viewer", "User", 3)
);
```

## ??? User Roles & Permissions

| Role | Value | Permissions |
|------|-------|-------------|
| **SuperAdmin** | 0 | Full access to all tenants, pages, users, forms |
| **TenantAdmin** | 1 | Manage pages, users within their tenant |
| **Editor** | 2 | Create and edit pages, view forms |
| **Viewer** | 3 | Read-only access to pages and forms |

## ?? Quick Start

1. **Generate Credentials**
   ```bash
   dotnet run
   ```

2. **Update Placeholder Password**
   - Change `CHANGE-ME-BEFORE-PRODUCTION` to your secure password
   - Run again to get the new hash

3. **Save to Cosmos DB**
   - Create `Tenant` container with partition key `/tenantId`
   - Create `User` container with partition key `/tenantId`
   - Insert the generated JSON documents

4. **Test Login**
   - Use the generated email and password with `/api/auth/login`
   - Save the returned JWT token for subsequent API calls

## ?? Best Practices

? **DO:**
- Generate new credentials for each environment
- Use environment variables for secrets in production
- Rotate API keys periodically
- Use strong, unique passwords
- Store hashes, never plain passwords

? **DON'T:**
- Commit connection strings or secrets
- Reuse API keys across environments
- Share credentials in chat or email
- Use weak or default passwords in production
- Store plain-text passwords anywhere

## ?? Example Output

```
?? Pumpkin CMS - API Key Generator
================================================
ADMIN TENANT CREDENTIALS
================================================
Tenant ID:  admin
API Key:    6k+cZGeoZ0fQdSCXIn393VcNhLSk7/d2ow6RCSiN140=
API Hash:   $2a$12$d4GFC3.CtLeDtXmd23sOVemf.gCCWH5J3Vw3tNx0bCctM8RCoQ4LG
================================================

?? Pumpkin CMS - User Generator
================================================
ADMIN USER CREDENTIALS
================================================
Email:      admin@pumpkincms.io
Username:   superadmin
Password:   YourSecurePassword123!
Hash:       $2a$11$NnOZKi.SpyNtC5Dvi3cPg.7LFKVh8SPl8AwLfX7LMD9hLjCk5Fbjy
================================================

?? User GUID: 1df4cab2-e99c-4ef6-845e-9c28d98deeb6
```

## ?? Testing

The commented-out test code can be used for integration testing:
- Uncomment the test section in `Program.cs`
- Configure `appsettings.Development.json` with your Cosmos DB connection
- Run tests to verify CRUD operations

---

**Made with ?? by Pumpkin CMS Team**
