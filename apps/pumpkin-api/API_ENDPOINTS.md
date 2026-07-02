# Pumpkin CMS API Endpoint Inventory

This inventory reflects the current `pumpkin-api` minimal API surface.

## Runtime

- Database provider: Cosmos DB only for this phase.
- Bootstrap provisioning and Cosmos container creation are intentionally out of scope for this phase.
- Public content routes authenticate with `Authorization: Bearer {tenantApiKey}`.
- Admin and auth routes authenticate with JWT bearer tokens unless marked anonymous.
- Tenant isolation is enforced in handlers. Role policies add a second gate for admin content routes.

## Roles

- `SuperAdmin`: all admin operations, including cross-tenant reads and tenant management.
- `TenantAdmin`: tenant-scoped content, theme, form-definition, and destructive operations.
- `Editor`: tenant-scoped page create/update and form-entry status updates.
- `Viewer`: tenant-scoped read-only admin content access.

## General

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | none | Welcome message. |

## Authentication

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | anonymous | Returns JWT, expiry, and user profile. |
| GET | `/api/auth/verify` | JWT | Verifies token and returns active user profile from the database. |
| POST | `/api/auth/logout` | JWT | Stateless logout acknowledgement; clients discard the JWT. |

## Public Content

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/pages/{tenantId}/{**pageSlug}` | tenant API key | Returns a published page by slug. |
| POST | `/api/pages/{tenantId}` | tenant API key | Creates a page through the public API surface. |
| PUT | `/api/pages/{tenantId}/{**pageSlug}` | tenant API key | Updates a page through the public API surface. |
| DELETE | `/api/pages/{tenantId}/{**pageSlug}` | tenant API key | Deletes a page through the public API surface. |
| GET | `/api/tenant/{tenantId}/sitemap` | tenant API key | Returns sitemap entries. |
| POST | `/api/forms/{tenantId}/entries` | tenant API key | Submits a full form-entry payload. |
| GET | `/api/forms/{tenantId}/definitions/{type}` | tenant API key | Returns the active form definition for a form type. |
| POST | `/api/forms/{tenantId}/submit/{type}` | tenant API key | Submits a flat field dictionary and validates it against the form definition. |
| GET | `/api/themes/{tenantId}` | tenant API key | Returns the active tenant theme. |
| GET | `/api/themes/{tenantId}/{themeId}` | tenant API key | Returns a theme by ID. |

## Admin Tenants

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/tenants` | JWT | SuperAdmins see all tenants; other roles see their own tenant. |
| GET | `/api/admin/tenants/{tenantId}` | JWT, SuperAdmin | Gets a tenant by ID. |
| POST | `/api/admin/tenants` | JWT, SuperAdmin | Creates a tenant. |
| PUT | `/api/admin/tenants/{tenantId}` | JWT, SuperAdmin | Updates a tenant. |
| DELETE | `/api/admin/tenants/{tenantId}` | JWT, SuperAdmin | Deletes a tenant; cannot delete caller's tenant. |
| POST | `/api/admin/tenants/{tenantId}/regenerate-api-key` | JWT, SuperAdmin | Regenerates tenant API key. |

## Admin Pages

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/pages?tenantId={tenantId}` | JWT, content reader | Lists pages for caller tenant or specified tenant for SuperAdmin. |
| GET | `/api/admin/pages/{tenantId}/{**pageSlug}` | JWT, content reader | Gets a page including drafts. |
| POST | `/api/admin/pages/{tenantId}` | JWT, content editor | Creates a page without tenant API key. |
| PUT | `/api/admin/pages/{tenantId}/{**pageSlug}` | JWT, content editor | Updates a page without tenant API key. |
| DELETE | `/api/admin/pages/{tenantId}/{**pageSlug}` | JWT, content owner | Deletes a page without tenant API key. |
| GET | `/api/admin/tenants/{tenantId}/hubs` | JWT, content reader | Lists hub pages. |
| GET | `/api/admin/tenants/{tenantId}/hubs/{hubPageSlug}/spokes` | JWT, content reader | Lists spoke pages for a hub. |
| GET | `/api/admin/tenants/{tenantId}/content-hierarchy` | JWT, content reader | Returns hierarchy data for page-map UI. |

## Admin Users

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/users/{tenantId}` | JWT, SuperAdmin or TenantAdmin | Lists sanitized users for a tenant. |
| GET | `/api/admin/users/{tenantId}/{userId}` | JWT, SuperAdmin or TenantAdmin | Gets a sanitized user profile. |
| POST | `/api/admin/users/{tenantId}` | JWT, SuperAdmin or TenantAdmin | Creates a user and hashes the supplied password server-side with BCrypt. |
| PUT | `/api/admin/users/{tenantId}/{userId}` | JWT, SuperAdmin or TenantAdmin | Updates profile, role, active status, and permissions. Password hashes are not accepted. |
| POST | `/api/admin/users/{tenantId}/{userId}/reset-password` | JWT, SuperAdmin or TenantAdmin | Resets a password and hashes it server-side with BCrypt. |
| DELETE | `/api/admin/users/{tenantId}/{userId}` | JWT, SuperAdmin or TenantAdmin | Deletes a user. Users cannot delete themselves. |

## Admin Themes

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/themes/{tenantId}` | JWT, content reader | Lists themes. |
| GET | `/api/admin/themes/{tenantId}/active` | JWT, content reader | Gets active theme. |
| GET | `/api/admin/themes/{tenantId}/{themeId}` | JWT, content reader | Gets a theme by ID. |
| POST | `/api/admin/themes/{tenantId}` | JWT, content owner | Creates a theme. |
| PUT | `/api/admin/themes/{tenantId}/{themeId}` | JWT, content owner | Updates a theme. |
| DELETE | `/api/admin/themes/{tenantId}/{themeId}` | JWT, content owner | Deletes a theme. |

## Admin Forms

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/forms/{tenantId}/definitions` | JWT, content reader | Lists form definitions. |
| GET | `/api/admin/forms/{tenantId}/definitions/{formDefinitionId}` | JWT, content reader | Gets a form definition. |
| POST | `/api/admin/forms/{tenantId}/definitions` | JWT, content owner | Creates a form definition. |
| PUT | `/api/admin/forms/{tenantId}/definitions/{formDefinitionId}` | JWT, content owner | Updates a form definition. |
| DELETE | `/api/admin/forms/{tenantId}/definitions/{formDefinitionId}` | JWT, content owner | Deletes a form definition. |
| GET | `/api/admin/forms/{tenantId}/entries?type={type}` | JWT, content reader | Lists form entries, optionally filtered by type. |
| GET | `/api/admin/forms/{tenantId}/entries/{entryId}` | JWT, content reader | Gets a form entry. |
| PUT | `/api/admin/forms/{tenantId}/entries/{entryId}/status` | JWT, content editor | Updates entry status to `new`, `read`, `actioned`, or `archived`. |
