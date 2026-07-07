import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageRenderer } from '@/components/PageRenderer';
import { buildMetadata } from '@/lib/metadata';
import { fetchPumpkinPage, getFormDefinitionsForPage, getSiteTheme } from '@/lib/pumpkin-api';

export const revalidate = 60;

interface SlugPageProps {
  params: {
    slug: string[];
  };
}

function normalizeSlug(slugParts: string[]) {
  return slugParts.join('/').toLowerCase();
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  const page = await fetchPumpkinPage(normalizeSlug(params.slug));
  if (!page) return { title: 'Page Not Found' };
  return buildMetadata(page);
}

export default async function SlugPage({ params }: SlugPageProps) {
  const [page, theme] = await Promise.all([
    fetchPumpkinPage(normalizeSlug(params.slug)),
    getSiteTheme(),
  ]);

  if (!page) {
    notFound();
  }

  const formDefinitions = await getFormDefinitionsForPage(page);

  return (
    <PageRenderer
      page={page}
      blockStyles={theme.blockStyles}
      formDefinitions={formDefinitions}
    />
  );
}
