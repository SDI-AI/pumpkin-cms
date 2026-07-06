import type { Page } from 'pumpkin-ts-models';
import { getStarterAdminToken } from '@/lib/admin-auth';
import { loadTenantConfig } from '@/lib/tenant-config';

interface PagesResponse {
  tenantId: string;
  pages: Page[];
  count: number;
}

export interface StarterAdminPagesResult {
  pages: Page[];
  unavailablePages: string[];
}

export async function getStarterAdminPages(): Promise<StarterAdminPagesResult> {
  const config = loadTenantConfig();
  if (!config) {
    throw new Error('Pumpkin tenant configuration is missing.');
  }
  const token = getRequiredAdminToken();

  const response = await fetch(`${config.apiUrl}/api/admin/pages?tenantId=${encodeURIComponent(config.tenantId)}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Unable to load tenant pages.'));
  }

  const data = (await response.json()) as PagesResponse;

  return {
    pages: data.pages,
    unavailablePages: [],
  };
}

export async function getStarterAdminPage(pageSlug: string): Promise<Page> {
  const config = loadTenantConfig();
  if (!config) {
    throw new Error('Pumpkin tenant configuration is missing.');
  }
  const token = getRequiredAdminToken();

  const response = await fetch(
    `${config.apiUrl}/api/admin/pages/${encodeURIComponent(config.tenantId)}/${encodeSlugPath(pageSlug)}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, `Unable to load page "${pageSlug}".`));
  }

  return (await response.json()) as Page;
}

export async function updateStarterAdminPage(pageSlug: string, page: Page): Promise<Page> {
  const config = loadTenantConfig();
  if (!config) {
    throw new Error('Pumpkin tenant configuration is missing.');
  }
  const token = getRequiredAdminToken();

  const response = await fetch(
    `${config.apiUrl}/api/admin/pages/${encodeURIComponent(config.tenantId)}/${encodeSlugPath(pageSlug)}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(page),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, `Unable to save page "${pageSlug}".`));
  }

  return (await response.json()) as Page;
}

async function readApiError(response: Response, fallback: string) {
  const text = await response.text().catch(() => '');
  if (!text) return fallback;

  try {
    const data = JSON.parse(text) as { message?: string; detail?: string; title?: string };
    return data.message || data.detail || data.title || fallback;
  } catch {
    return text;
  }
}

function encodeSlugPath(slug: string) {
  return slug
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function getRequiredAdminToken() {
  const token = getStarterAdminToken();
  if (!token) {
    throw new Error('Starter admin session is missing.');
  }

  return token;
}
