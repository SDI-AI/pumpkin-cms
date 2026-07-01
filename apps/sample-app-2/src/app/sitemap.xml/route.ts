import { fetchSitemapData } from '@/lib/api';

/**
 * Route handler for /sitemap.xml
 * 
 * This generates an XML sitemap dynamically from the Pumpkin CMS API.
 * The sitemap is cached using Next.js ISR with a 1-day revalidation period.
 * 
 * @see https://www.sitemaps.org/protocol.html
 */
export async function GET(request: Request) {
  try {
    // Fetch sitemap data from the API
    const entries = await fetchSitemapData();

    // Build the base URL from the request URL
    const baseUrl = new URL(request.url).origin;

    // Generate XML sitemap
    const xml = generateSitemapXml(entries, baseUrl);

    // Return XML response with appropriate headers
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 1 day cache
      },
    });
  } catch (error) {
    console.error('[sitemap.xml] Error generating sitemap:', error);
    
    // Return a minimal valid sitemap on error
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
    
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  }
}

/**
 * Generate XML sitemap from entries.
 */
function generateSitemapXml(
  entries: Array<{ pageSlug: string; lastModified: string }>,
  baseUrl: string
): string {
  const urls = entries
    .map((entry) => {
      // Build absolute URL for the page
      const loc = `${baseUrl}/${entry.pageSlug}`.replace(/([^:]\/)\/+/g, '$1'); // Remove double slashes
      
      // Format lastModified as YYYY-MM-DD (required format for sitemap)
      const lastmod = new Date(entry.lastModified).toISOString().split('T')[0];

      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Escape special XML characters.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
