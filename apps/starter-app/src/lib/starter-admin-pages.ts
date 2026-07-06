import type { Page } from 'pumpkin-ts-models';
import { loadTenantConfig } from '@/lib/tenant-config';

interface SitemapEntry {
  pageSlug: string;
  lastModified: string;
}

interface SitemapResponse {
  tenantId: string;
  pages: SitemapEntry[];
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

  const sitemapResponse = await fetch(`${config.apiUrl}/api/tenant/${encodeURIComponent(config.tenantId)}/sitemap`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    cache: 'no-store',
  });

  if (!sitemapResponse.ok) {
    throw new Error(await readApiError(sitemapResponse, 'Unable to load tenant sitemap.'));
  }

  const sitemap = (await sitemapResponse.json()) as SitemapResponse;
  const fetchedPages = await Promise.all(
    sitemap.pages.map(async (entry) => {
      const response = await fetch(
        `${config.apiUrl}/api/pages/${encodeURIComponent(config.tenantId)}/${encodeSlugPath(entry.pageSlug)}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        return { page: null, slug: entry.pageSlug };
      }

      return { page: (await response.json()) as Page, slug: entry.pageSlug };
    }),
  );

  return {
    pages: fetchedPages.flatMap((item) => (item.page ? [item.page] : [])),
    unavailablePages: fetchedPages.flatMap((item) => (item.page ? [] : [item.slug])),
  };
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
