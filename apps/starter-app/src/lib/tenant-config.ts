import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export type TenantConfigSource = 'environment' | 'local-file';

export interface TenantConfig {
  tenantId: string;
  apiUrl: string;
  apiKey: string;
  siteName: string;
  createdAt: string;
  source: TenantConfigSource;
}

export interface TenantConfigInput {
  tenantId: string;
  apiUrl: string;
  apiKey: string;
  siteName?: string;
}

export const tenantConfigPath = path.join(process.cwd(), 'config', 'tenant.local.json');

export function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function loadTenantConfig(): TenantConfig | null {
  const envTenantId = process.env.PUMPKIN_TENANT_ID;
  const envApiUrl = process.env.NEXT_PUBLIC_PUMPKIN_API_URL || process.env.PUMPKIN_API_URL;
  const envApiKey = process.env.PUMPKIN_API_KEY;

  if (envTenantId && envApiUrl && envApiKey) {
    return normalizeTenantConfig(
      {
        tenantId: envTenantId,
        apiUrl: envApiUrl,
        apiKey: envApiKey,
        siteName: process.env.PUMPKIN_SITE_NAME || envTenantId,
      },
      'environment'
    );
  }

  if (isProductionDeployment() || !existsSync(tenantConfigPath)) {
    return null;
  }

  const raw = readFileSync(tenantConfigPath, 'utf8');
  return normalizeTenantConfig(JSON.parse(raw) as TenantConfigInput, 'local-file');
}

export function getMissingTenantConfigKeys(): string[] {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_PUMPKIN_API_URL && !process.env.PUMPKIN_API_URL) {
    missing.push('NEXT_PUBLIC_PUMPKIN_API_URL');
  }

  if (!process.env.PUMPKIN_TENANT_ID) {
    missing.push('PUMPKIN_TENANT_ID');
  }

  if (!process.env.PUMPKIN_API_KEY) {
    missing.push('PUMPKIN_API_KEY');
  }

  return missing;
}

export function normalizeTenantConfig(input: TenantConfigInput, source: TenantConfigSource): TenantConfig {
  const tenantId = input.tenantId.trim();
  const apiUrl = input.apiUrl.trim().replace(/\/+$/, '');
  const apiKey = input.apiKey.trim();
  const siteName = input.siteName?.trim() || tenantId;

  if (!tenantId) {
    throw new Error('Tenant ID is required.');
  }

  if (!apiUrl) {
    throw new Error('Pumpkin API URL is required.');
  }

  if (!apiKey) {
    throw new Error('Tenant API key is required.');
  }

  return {
    tenantId,
    apiUrl,
    apiKey,
    siteName,
    createdAt: new Date().toISOString(),
    source,
  };
}

export function redactApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return 'configured';
  }

  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}
