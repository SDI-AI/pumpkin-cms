import type { Page, Theme } from 'pumpkin-ts-models';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7211';
const API_KEY = process.env.PUMPKIN_API_KEY || '';
const TENANT_ID = process.env.PUMPKIN_TENANT_ID || '';

/**
 * Fetch a page by slug from the Pumpkin CMS content API.
 *
 * Endpoint: GET /api/pages/{tenantId}/{pageSlug}
 * Auth:     Bearer {apiKey}
 */
export async function fetchPage(slug: string): Promise<Page | null> {
  if (!API_KEY || !TENANT_ID) {
    console.warn('[pumpkin-api] PUMPKIN_API_KEY or PUMPKIN_TENANT_ID not set');
    return null;
  }

  try {
    const url = `${API_URL}/api/pages/${TENANT_ID}/${slug}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
      },
      next: { revalidate: 60 }, // ISR: revalidate every 60 s
    });

    if (!res.ok) {
      console.error(`[pumpkin-api] ${res.status} ${res.statusText} for ${url}`);
      return null;
    }

    return (await res.json()) as Page;
  } catch (err) {
    console.error('[pumpkin-api] Fetch error:', err);
    return null;
  }
}

/**
 * Fetch the active theme for the current tenant.
 *
 * Endpoint: GET /api/themes/{tenantId}
 * Auth:     Bearer {apiKey}
 */
export async function fetchTheme(): Promise<Theme | null> {
  if (!API_KEY || !TENANT_ID) {
    console.warn('[pumpkin-api] PUMPKIN_API_KEY or PUMPKIN_TENANT_ID not set');
    return null;
  }

  try {
    const url = `${API_URL}/api/themes/${TENANT_ID}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
      },
      next: { revalidate: 300 }, // ISR: revalidate every 5 min (themes change rarely)
    });

    if (!res.ok) {
      console.error(`[pumpkin-api] ${res.status} ${res.statusText} for ${url}`);
      return null;
    }

    return (await res.json()) as Theme;
  } catch (err) {
    console.error('[pumpkin-api] Fetch error:', err);
    return null;
  }
}
