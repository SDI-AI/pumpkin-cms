import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { createStarterAdminPageDraft, getStarterAdminPages } from '@/lib/starter-admin-pages';
import { getStarterAdminTheme, getStarterAdminThemes } from '@/lib/starter-admin-themes';
import { fallbackTheme } from '@/data';
import { getThemeStylesheet, resolveThemePlugin } from '@/themes/registry';
import { loadTenantConfig } from '@/lib/tenant-config';
import { PageVisualEditor } from '../_components/PageVisualEditor';

interface StarterAdminNewPagePageProps {
  searchParams?: Promise<{
    hubPageSlug?: string;
    pageSlug?: string;
  }>;
}

export default async function StarterAdminNewPagePage({ searchParams }: StarterAdminNewPagePageProps) {
  await requireStarterAdmin();
  const query = await searchParams;

  const config = loadTenantConfig();
  if (!config) {
    throw new Error('Pumpkin tenant configuration is missing.');
  }

  const draft = createStarterAdminPageDraft({
    tenantId: config.tenantId,
    pageSlug: query?.pageSlug,
    hubPageSlug: query?.hubPageSlug,
  });

  const [pagesResult, themeResult] = await Promise.all([getStarterAdminPages(), getStarterAdminThemes()]);
  const activeThemeId = themeResult.activeThemeId || themeResult.themes.find((theme) => theme.isActive)?.themeId;
  const activeTheme = resolveThemePlugin(activeThemeId ? await getStarterAdminTheme(activeThemeId) : fallbackTheme);

  return (
    <section>
      <AdminPageHeader
        eyebrow="Page Editor"
        title="New Page"
        description="Create a page for this starter tenant."
      />
      <PageVisualEditor
        initialPage={draft}
        initialTheme={activeTheme}
        mode="create"
        stylesheet={getThemeStylesheet(activeTheme)}
        menuPages={pagesResult.pages.map((item) => ({ pageSlug: item.pageSlug, title: item.MetaData.title, isPublished: item.isPublished }))}
      />
    </section>
  );
}
