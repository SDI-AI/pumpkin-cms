import type { Metadata } from 'next';
import { fetchPage, fetchTheme } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';
import { fallbackTheme } from '@/data';
import { PageRenderer } from '@/components/PageRenderer';
import { notFound } from 'next/navigation';

interface SlugPageProps {
  params: { slug: string[] };
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  const slug = params.slug.join('/');
  const page = await fetchPage(slug);
  if (!page) return { title: 'Page Not Found' };
  return buildMetadata(page);
}

/**
 * Catch-all route — queries the Pumpkin CMS content API by page slug.
 * Example: /pumpkin-cms-tech-stack → fetchPage('pumpkin-cms-tech-stack')
 *
 * When the API is not configured, fetchPage falls back to built-in
 * sample data automatically so the app still works for local dev.
 */
export default async function SlugPage({ params }: SlugPageProps) {
  const slug = params.slug.join('/');
  const [page, theme] = await Promise.all([
    fetchPage(slug),
    fetchTheme(),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <PageRenderer
      page={page}
      blockStyles={(theme ?? fallbackTheme).blockStyles}
    />
  );
}
