import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getStarterAdminThemes } from '@/lib/starter-admin-themes';
import { ThemeList } from './_components/ThemeList';

export default async function StarterAdminThemesPage() {
  const themes = await getStarterAdminThemes();

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 4"
        title="Themes"
        description="Manage installed runtime themes, activate a theme, and edit tenant theme JSON."
      />
      <ThemeList themes={themes} />
    </section>
  );
}
