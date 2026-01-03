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
    nextInvoice: string;
}
//# sourceMappingURL=Tenant.d.ts.map