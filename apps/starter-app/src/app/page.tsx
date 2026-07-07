import type { Metadata } from 'next';
import { PageRenderer } from '@/components/PageRenderer';
import { fallbackHomePage } from '@/data';
import { buildMetadata } from '@/lib/metadata';
import { fetchPumpkinPage, getFormDefinitionsForPage, getSiteTheme } from '@/lib/pumpkin-api';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = (await fetchPumpkinPage('home')) ?? fallbackHomePage;
  return buildMetadata(page);
}

export default async function HomePage() {
  const [page, theme] = await Promise.all([
    fetchPumpkinPage('home'),
    getSiteTheme(),
  ]);
  const pageToRender = page ?? fallbackHomePage;
  const formDefinitions = await getFormDefinitionsForPage(pageToRender);

  return (
    <PageRenderer
      page={pageToRender}
      blockStyles={theme.blockStyles}
      formDefinitions={formDefinitions}
    />
  );
}
