import type { FormDefinition, HubSpokeLink, IHtmlBlock, Page, Theme } from 'pumpkin-ts-models';
import { fallbackTheme } from '@/data';
import { loadTenantConfig } from '@/lib/tenant-config';
import { resolveThemePlugin } from '@/themes/registry';

export const PUBLIC_REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const FETCH_TIMEOUT_MS = 5000;

interface PumpkinFetchOptions {
  cache?: RequestCache;
  revalidate?: number;
}

export async function fetchPumpkinPage(slug: string): Promise<Page | null> {
  const config = loadTenantConfig();
  if (!config) return null;

  const normalizedSlug = normalizeSlug(slug);
  const slugPath = normalizedSlug
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return fetchFromPumpkin<Page>(
    `${config.apiUrl}/api/pages/${encodeURIComponent(config.tenantId)}/${slugPath}`,
    config.apiKey,
  );
}

export async function getSiteTheme(): Promise<Theme> {
  const config = loadTenantConfig();
  if (!config) return fallbackTheme;

  const theme = await fetchFromPumpkin<Theme>(
    `${config.apiUrl}/api/themes/${encodeURIComponent(config.tenantId)}`,
    config.apiKey,
    { cache: 'no-store' },
  );

  return resolveThemePlugin(theme ?? fallbackTheme);
}

export async function fetchFormDefinition(type: string): Promise<FormDefinition | null> {
  const config = loadTenantConfig();
  if (!config) return null;

  return fetchFromPumpkin<FormDefinition>(
    `${config.apiUrl}/api/forms/${encodeURIComponent(config.tenantId)}/definitions/${encodeURIComponent(type)}`,
    config.apiKey,
    { cache: 'no-store' },
  );
}

interface SpokePagesResponse {
  spokePages: Page[];
  count: number;
  hubPageSlug: string;
  limit: number;
  tenantId: string;
}

export async function hydrateHubSpokesForPage(page: Page): Promise<Page> {
  const blocks = page.ContentData.ContentBlocks as Array<IHtmlBlock & {
    id?: string;
    content?: {
      hubPageSlug?: string;
      limit?: number;
      spokes?: HubSpokeLink[];
    };
  }>;

  const hubSpokeBlockEntries = blocks
    .map((block, index) => ({ block, index }))
    .filter((entry) => entry.block.type === 'HubSpokes');
  if (hubSpokeBlockEntries.length === 0) {
    return page;
  }

  const hydratedEntries = await Promise.all(
    hubSpokeBlockEntries.map(async ({ block, index }) => {
      const hubPageSlug = block.content?.hubPageSlug?.trim() || page.pageSlug;
      const limit = normalizeSpokeLimit(block.content?.limit);
      const spokes = await fetchHubSpokes(hubPageSlug, limit);
      return {
        index,
        hubPageSlug,
        limit,
        spokes,
      };
    }),
  );

  const hydratedByIndex = new Map(hydratedEntries.map((entry) => [entry.index, entry]));

  return {
    ...page,
    ContentData: {
      ...page.ContentData,
      ContentBlocks: blocks.map((block, index) => {
        if (block.type !== 'HubSpokes') {
          return block;
        }

        const hydrated = hydratedByIndex.get(index);
        return {
          ...block,
          content: {
            ...block.content,
            hubPageSlug: hydrated?.hubPageSlug || block.content?.hubPageSlug || page.pageSlug,
            limit: hydrated?.limit ?? block.content?.limit ?? 12,
            spokes: hydrated?.spokes ?? [],
          },
        };
      }),
    },
  };
}

export async function fetchHubSpokes(hubPageSlug: string, limit = 12): Promise<HubSpokeLink[]> {
  const config = loadTenantConfig();
  if (!config) return [];

  const slugPath = normalizeSlug(hubPageSlug)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const response = await fetchFromPumpkin<SpokePagesResponse>(
    `${config.apiUrl}/api/hubs/${encodeURIComponent(config.tenantId)}/spokes/${slugPath}?limit=${normalizeSpokeLimit(limit)}`,
    config.apiKey,
  );

  return (response?.spokePages ?? []).map(pageToHubSpokeLink);
}

export async function getFormDefinitionsForPage(page: Page): Promise<Record<string, FormDefinition>> {
  const formTypes = getFormTypesFromPage(page);
  if (formTypes.length === 0) return {};

  const definitions = await Promise.all(
    formTypes.map(async (type) => [type, await fetchFormDefinition(type)] as const),
  );

  return definitions.reduce<Record<string, FormDefinition>>((map, [type, definition]) => {
    if (definition) map[type] = definition;
    return map;
  }, {});
}

function getFormTypesFromPage(page: Page) {
  const blocks = page.ContentData.ContentBlocks as Array<IHtmlBlock & {
    enabled?: boolean;
    content?: { formType?: string };
  }>;

  return Array.from(
    new Set(
      blocks
        .filter((block) => block.enabled !== false)
        .filter((block) => block.type === 'Contact' || block.type === 'Form')
        .map((block) => block.content?.formType?.trim().toLowerCase())
        .filter((type): type is string => Boolean(type)),
    ),
  );
}

async function fetchFromPumpkin<T>(
  url: string,
  apiKey: string,
  options: PumpkinFetchOptions = {},
): Promise<T | null> {
  try {
    const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    };

    if (options.cache === 'no-store') {
      fetchOptions.cache = 'no-store';
    } else {
      fetchOptions.next = { revalidate: options.revalidate ?? PUBLIC_REVALIDATE_SECONDS };
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      console.warn(`[pumpkin-api] ${response.status} ${response.statusText} for ${url}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[pumpkin-api] Fetch failed for ${url}: ${getFetchErrorMessage(error)}`);
    return null;
  }
}

function normalizeSlug(slug: string) {
  return slug.replace(/^\/+|\/+$/g, '').toLowerCase() || 'home';
}

function normalizeSpokeLimit(limit?: number) {
  const numericLimit = typeof limit === 'number' && Number.isFinite(limit) ? limit : 12;
  return Math.max(1, Math.min(numericLimit, 50));
}

function pageToHubSpokeLink(page: Page): HubSpokeLink {
  return {
    title: page.MetaData.title || page.pageSlug,
    description: page.MetaData.description || page.searchData.contentSummary || '',
    url: page.pageSlug === 'home' ? '/' : `/${page.pageSlug}`,
    city: page.searchData.city || '',
    state: page.searchData.state || '',
    metro: page.searchData.metro || '',
    spokePriority: page.contentRelationships?.spokePriority ?? 0,
  };
}

function getFetchErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const cause = error.cause as { code?: string } | undefined;
    return cause?.code ? `${error.message} (${cause.code})` : error.message;
  }

  return String(error);
}
