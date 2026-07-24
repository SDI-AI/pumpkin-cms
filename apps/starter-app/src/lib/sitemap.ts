import type { NextRequest } from 'next/server'
import { loadTenantConfig } from '@/lib/tenant-config'

interface SitemapEntry {
  pageSlug: string
  lastModified?: string
}

interface SitemapResponse {
  pages?: SitemapEntry[]
}

export function getSiteOrigin(request: NextRequest) {
  const configuredOrigin = process.env.PUMPKIN_SITE_URL?.trim()

  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin).origin
    } catch {
      console.warn('[Sitemap] Ignoring invalid PUMPKIN_SITE_URL.')
    }
  }

  return request.nextUrl.origin
}

export async function getSitemapEntries() {
  const config = loadTenantConfig()
  if (!config) throw new Error('Pumpkin tenant configuration is unavailable.')

  const response = await fetch(`${config.apiUrl}/api/tenant/${encodeURIComponent(config.tenantId)}/sitemap`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    throw new Error(`Pumpkin sitemap request failed with status ${response.status}.`)
  }

  const data = await response.json() as SitemapResponse
  return Array.isArray(data.pages) ? data.pages : []
}

export function buildSitemapXml(origin: string, entries: SitemapEntry[]) {
  const uniqueEntries = new Map<string, SitemapEntry>()

  for (const entry of entries) {
    const slug = normalizeSlug(entry.pageSlug)
    if (slug !== null) uniqueEntries.set(slug, entry)
  }

  const urls = [...uniqueEntries.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, entry]) => {
      const location = slug === 'home' || slug === '' ? `${origin}/` : `${origin}/${slug}`
      const lastModified = validDate(entry.lastModified)

      return [
        '  <url>',
        `    <loc>${escapeXml(location)}</loc>`,
        ...(lastModified ? [`    <lastmod>${lastModified}</lastmod>`] : []),
        '  </url>',
      ].join('\n')
    })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

function normalizeSlug(value: string) {
  const slug = String(value || '').trim().replace(/^\/+|\/+$/g, '')
  if (slug.includes('..') || /[?#\\]/.test(slug)) return null
  return slug
}

function validDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
