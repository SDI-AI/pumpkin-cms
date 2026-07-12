import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getStarterAdminContext, requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminTheme, getStarterAdminThemes } from '@/lib/starter-admin-themes';
import { NavigationEditor } from './_components/NavigationEditor';

export default async function StarterAdminNavigationPage() {
  requireStarterAdmin();

  const context = getStarterAdminContext();
  const { themes, activeThemeId } = await getStarterAdminThemes();
  const activeId = activeThemeId || themes.find((theme) => theme.isActive)?.themeId;
  const activeTheme = activeId ? await getStarterAdminTheme(activeId) : null;

  return (
    <section>
      <AdminPageHeader
        eyebrow="Site"
        title="Navigation"
        description="Edit the public header menu for the active tenant theme."
      />

      {activeTheme ? (
        <NavigationEditor initialTheme={activeTheme} tenantId={context.tenantId} />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-neutral-950">No active theme</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Activate a theme before editing the public navigation menu.
          </p>
          <Link
            href="/admin/themes"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-pumpkin-600 px-4 text-sm font-semibold text-white hover:bg-pumpkin-700"
          >
            Manage Themes
          </Link>
        </div>
      )}
    </section>
  );
}
