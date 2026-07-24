import type { NextRequest } from 'next/server'
import { buildSitemapXml, getSiteOrigin, getSitemapEntries } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const xml = buildSitemapXml(getSiteOrigin(request), await getSitemapEntries())

    return new Response(xml, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
        'Content-Type': 'application/xml; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('[Sitemap] Unable to generate sitemap.', error)
    return new Response('Sitemap temporarily unavailable.\n', {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
        'Retry-After': '300',
      },
    })
  }
}
