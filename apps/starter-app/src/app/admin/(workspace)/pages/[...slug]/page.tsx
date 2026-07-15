import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminPage, getStarterAdminPages } from '@/lib/starter-admin-pages';
import { getStarterAdminTheme, getStarterAdminThemes } from '@/lib/starter-admin-themes';
import { fallbackTheme } from '@/data';
import { getThemeStylesheet, resolveThemePlugin } from '@/themes/registry';
import { PageVisualEditor } from '../_components/PageVisualEditor';

interface StarterAdminPageEditorProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function StarterAdminPageEditor({ params }: StarterAdminPageEditorProps) {
  await requireStarterAdmin();

  const { slug } = await params;
  const pageSlug = slug.map((segment) => decodeURIComponent(segment)).join('/');
  const [page, pagesResult, themeResult] = await Promise.all([
    getStarterAdminPage(pageSlug),
    getStarterAdminPages(),
    getStarterAdminThemes(),
  ]);
  const activeThemeId = themeResult.activeThemeId || themeResult.themes.find((theme) => theme.isActive)?.themeId;
  const activeTheme = resolveThemePlugin(activeThemeId ? await getStarterAdminTheme(activeThemeId) : fallbackTheme);
  const stylesheet = getThemeStylesheet(activeTheme);

  return (
    <section>
      <AdminPageHeader
        eyebrow="Page Editor"
        title={page.MetaData?.title || page.pageSlug}
        description={`/${page.pageSlug}`}
        actions={
          <Link
            href={`/${page.pageSlug}`}
            target="_blank"
            className="inline-flex h-10 items-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            View Page
          </Link>
        }
      />
      <PageVisualEditor
        initialPage={page}
        initialTheme={activeTheme}
        mode="edit"
        originalSlug={page.pageSlug}
        stylesheet={stylesheet}
        menuPages={pagesResult.pages.map((item) => ({ pageSlug: item.pageSlug, title: item.MetaData.title, isPublished: item.isPublished }))}
      />
    </section>
  );
}
