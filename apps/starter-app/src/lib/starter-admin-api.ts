import { getStarterAdminToken } from '@/lib/admin-auth';
import { loadTenantConfig } from '@/lib/tenant-config';

export interface StarterAdminApiContext {
  apiUrl: string;
  tenantId: string;
  token: string;
}

export async function getStarterAdminApiContext(): Promise<StarterAdminApiContext> {
  const config = loadTenantConfig();
  if (!config) {
    throw new Error('Pumpkin tenant configuration is missing.');
  }

  const token = await getStarterAdminToken();
  if (!token) {
    throw new Error('Starter admin session is missing.');
  }

  return {
    apiUrl: config.apiUrl,
    tenantId: config.tenantId,
    token,
  };
}

export async function starterAdminFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const context = await getStarterAdminApiContext();
  const response = await fetch(`${context.apiUrl}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${context.token}`,
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function readApiError(response: Response) {
  const text = await response.text().catch(() => '');
  if (!text) return `HTTP ${response.status}: ${response.statusText}`;

  try {
    const data = JSON.parse(text) as { message?: string; detail?: string; title?: string };
    return data.message || data.detail || data.title || text;
  } catch {
    return text;
  }
}
