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
  const token = await getRequiredAdminToken();

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
  const token = await getRequiredAdminToken();

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
  const token = await getRequiredAdminToken();

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

export async function createStarterAdminPage(page: Page): Promise<Page> {
  const config = loadTenantConfig();
  if (!config) {
    throw new Error('Pumpkin tenant configuration is missing.');
  }
  const token = await getRequiredAdminToken();

  const response = await fetch(
    `${config.apiUrl}/api/admin/pages/${encodeURIComponent(config.tenantId)}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...page, tenantId: config.tenantId }),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response, `Unable to create page "${page.pageSlug}".`));
  }

  return (await response.json()) as Page;
}

export function createStarterAdminPageDraft(input: {
  tenantId: string;
  pageSlug?: string;
  hubPageSlug?: string;
  author?: string;
}): Page {
  const now = new Date().toISOString();
  const pageSlug = input.pageSlug || '';

  return {
    id: pageSlug ? `${input.tenantId}-${pageSlug}` : '',
    PageId: pageSlug ? `${input.tenantId}-${pageSlug}` : '',
    tenantId: input.tenantId,
    pageSlug,
    PageVersion: 1,
    Layout: 'standard',
    MetaData: {
      category: '',
      product: '',
      keyword: '',
      pageType: input.hubPageSlug ? 'Spoke' : 'Keyword',
      title: '',
      description: '',
      createdAt: now,
      updatedAt: now,
      author: input.author || 'starter-admin',
      language: 'en',
      market: 'us',
    },
    searchData: {
      state: '',
      city: '',
      metro: '',
      county: '',
      keyword: '',
      tags: [],
      contentSummary: '',
      blockTypes: [],
    },
    ContentData: {
      ContentBlocks: [],
    },
    contentRelationships: {
      isHub: false,
      hubPageSlug: input.hubPageSlug || '',
      topicCluster: '',
      relatedHubs: [],
      spokePriority: 0,
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      robots: 'index, follow',
      canonicalUrl: '',
      alternateUrls: [],
      structuredData: [],
      openGraph: {
        'og:title': '',
        'og:description': '',
        'og:type': 'website',
        'og:url': '',
        'og:image': '',
        'og:image:alt': '',
        'og:site_name': '',
        'og:locale': 'en_US',
      },
      twitterCard: {
        'twitter:card': 'summary_large_image',
        'twitter:title': '',
        'twitter:description': '',
        'twitter:image': '',
        'twitter:site': '',
        'twitter:creator': '',
      },
    },
    isPublished: false,
    publishedAt: null,
    includeInSitemap: true,
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

async function getRequiredAdminToken() {
  const token = await getStarterAdminToken();
  if (!token) {
    throw new Error('Starter admin session is missing.');
  }

  return token;
}
