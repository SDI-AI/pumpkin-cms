import { revalidatePath, revalidateTag } from 'next/cache';
import { loadTenantConfig } from '@/lib/tenant-config';

export function publicTenantCacheTag(tenantId: string) {
  return `tenant:${normalizeTagSegment(tenantId)}`;
}

export function publicPagesCacheTag(tenantId: string) {
  return `${publicTenantCacheTag(tenantId)}:pages`;
}

export function publicPageCacheTag(tenantId: string, slug: string) {
  return `${publicPagesCacheTag(tenantId)}:${normalizeSlug(slug) || 'home'}`;
}

export function publicThemeCacheTag(tenantId: string) {
  return `${publicTenantCacheTag(tenantId)}:theme`;
}

export function publicFormsCacheTag(tenantId: string) {
  return `${publicTenantCacheTag(tenantId)}:forms`;
}

export function publicFormCacheTag(tenantId: string, type: string) {
  return `${publicFormsCacheTag(tenantId)}:${normalizeTagSegment(type) || 'default'}`;
}

export function revalidatePublicPages(...slugs: Array<string | null | undefined>) {
  const config = loadTenantConfig();
  const normalizedSlugs = slugs
    .map((slug) => normalizeSlug(slug))
    .filter((slug): slug is string => Boolean(slug));
  const paths = new Set(
    normalizedSlugs
      .map((slug) => slugToPublicPath(slug))
      .filter((path): path is string => Boolean(path)),
  );

  if (config) {
    revalidatePublicTag(publicPagesCacheTag(config.tenantId));
    for (const slug of normalizedSlugs) {
      revalidatePublicTag(publicPageCacheTag(config.tenantId, slug));
    }
  }

  for (const path of paths) {
    revalidatePath(path);
  }
}

export function revalidatePublicTheme() {
  const config = loadTenantConfig();
  if (config) {
    revalidatePublicTag(publicThemeCacheTag(config.tenantId));
  }

  revalidatePath('/', 'layout');
}

export function revalidatePublicForms(...types: Array<string | null | undefined>) {
  const config = loadTenantConfig();
  if (!config) return;

  revalidatePublicTag(publicFormsCacheTag(config.tenantId));
  for (const type of types) {
    const normalizedType = normalizeTagSegment(type);
    if (normalizedType) {
      revalidatePublicTag(publicFormCacheTag(config.tenantId, normalizedType));
    }
  }
}

export function publicPageCacheTags(tenantId: string, slug: string) {
  return [
    publicPagesCacheTag(tenantId),
    publicPageCacheTag(tenantId, slug),
  ];
}

export function publicThemeCacheTags(tenantId: string) {
  return [publicThemeCacheTag(tenantId)];
}

export function publicFormCacheTags(tenantId: string, type: string) {
  return [
    publicFormsCacheTag(tenantId),
    publicFormCacheTag(tenantId, type),
  ];
}

function slugToPublicPath(slug?: string | null) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return null;
  return normalized === 'home' ? '/' : `/${normalized}`;
}

function normalizeSlug(slug?: string | null) {
  return slug?.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function normalizeTagSegment(value?: string | null) {
  return value?.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function revalidatePublicTag(tag: string) {
  revalidateTag(tag, 'max');
}
