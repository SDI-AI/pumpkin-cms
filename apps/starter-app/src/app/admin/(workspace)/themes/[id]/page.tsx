import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminTheme } from '@/lib/starter-admin-themes';
import { ThemeEditor } from '../_components/ThemeEditor';

interface StarterAdminThemeEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StarterAdminThemeEditPage({ params }: StarterAdminThemeEditPageProps) {
  await requireStarterAdmin();

  const { id } = await params;
  const theme = await getStarterAdminTheme(id);

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 4"
        title={theme.name || 'Edit Theme'}
        description="Update runtime theme data, CSS variables, header/footer settings, and JSON."
      />
      <ThemeEditor initialTheme={theme} mode="edit" />
    </section>
  );
}
