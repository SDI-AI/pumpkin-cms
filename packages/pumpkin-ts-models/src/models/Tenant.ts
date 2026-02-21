/**
 * Tenant model representing a CMS tenant/organization
 */
export interface Tenant {
  id: string;
  tenantId: string;
  name: string;
  plan: string;
  status: string;
  apiKey: string;
  apiKeyHash: string;
  apiKeyMeta: ApiKeyMeta;
  createdAt: string;
  updatedAt: string;
  settings: TenantSettings;
  contact: Contact;
  billing: Billing;
}

/**
 * API key metadata
 */
export interface ApiKeyMeta {
  createdAt: string;
  isActive: boolean;
}

/**
 * Tenant settings and configuration
 */
export interface TenantSettings {
  /** References Theme.themeId for the active site theme. */
  theme: string;
  language: string;
  maxUsers: number;
  features: Features;
  allowedOrigins: string[];
}

/**
 * Feature flags for tenant capabilities
 */
export interface Features {
  forms: boolean;
  pages: boolean;
  analytics: boolean;
  canCreateTenants: boolean;
  canDeleteTenants: boolean;
  canManageAllContent: boolean;
  canViewAllTenants: boolean;
}

/**
 * Tenant contact information
 */
export interface Contact {
  email: string;
  phone: string;
}

/**
 * Billing information
 */
export interface Billing {
  cycle: string;
  nextInvoice: string | null;
}

/**
 * Simplified tenant info for dropdown and display
 */
export interface TenantInfo {
  id: string;
  tenantId: string;
  name: string;
  status: string;
}

/**
 * Convert full Tenant to simplified TenantInfo
 */
export function tenantToTenantInfo(tenant: Tenant): TenantInfo {
  return {
    id: tenant.id,
    tenantId: tenant.tenantId,
    name: tenant.name,
    status: tenant.status,
  };
}
