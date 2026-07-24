import type { NextRequest } from 'next/server'
import { getSiteOrigin } from '@/lib/sitemap'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const origin = getSiteOrigin(request)
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
