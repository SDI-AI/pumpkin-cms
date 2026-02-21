import type { Metadata } from 'next';
import { fetchPage } from '@/lib/api';
import { fetchTheme } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';
import { fallbackHomePage, fallbackTheme } from '@/data';
import { PageRenderer } from '@/components/PageRenderer';

/**
 * Dynamic metadata from the Page model's SEO fields.
 * Uses the fallback page when the API doesn't return a "home" page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const page = (await fetchPage('home')) ?? fallbackHomePage;
  return buildMetadata(page);
}

/**
 * Home page — fetches "home" from the Pumpkin CMS content API.
 * If the API returns no page (not configured, 404, error),
 * renders the built-in fallback page so the site always has a home.
 */
export default async function HomePage() {
  const [page, theme] = await Promise.all([
    fetchPage('home'),
    fetchTheme(),
  ]);

  return (
    <PageRenderer
      page={page ?? fallbackHomePage}
      blockStyles={(theme ?? fallbackTheme).blockStyles}
    />
  );
}
