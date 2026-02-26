import type { Page, Theme } from 'pumpkin-ts-models';

/**
 * Sitemap entry returned from the API.
 */
export interface SitemapEntry {
  pageSlug: string;
  lastModified: string; // ISO 8601 date string
}

/**
 * Sitemap API response format.
 */
export interface SitemapResponse {
  tenantId: string;
  pages: SitemapEntry[];
  count: number;
}

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

/**
 * Fetch sitemap data for the current tenant.
 *
 * Endpoint: GET /api/tenant/{tenantId}/sitemap
 * Auth:     Bearer {apiKey}
 */
export async function fetchSitemapData(): Promise<SitemapEntry[]> {
  if (!API_KEY || !TENANT_ID) {
    console.warn('[pumpkin-api] PUMPKIN_API_KEY or PUMPKIN_TENANT_ID not set');
    return [];
  }

  try {
    const url = `${API_URL}/api/tenant/${TENANT_ID}/sitemap`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
      },
      next: { revalidate: 86400 }, // ISR: revalidate every 1 day (86400 seconds)
    });

    if (!res.ok) {
      console.error(`[pumpkin-api] ${res.status} ${res.statusText} for ${url}`);
      return [];
    }

    const data = (await res.json()) as SitemapResponse;
    return data.pages;
  } catch (err) {
    console.error('[pumpkin-api] Fetch error:', err);
    return [];
  }
}
