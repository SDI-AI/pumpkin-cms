import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminApiContext } from '@/lib/starter-admin-api';
import { createTheme } from '@/lib/theme-factory';
import { ThemeEditor } from '../_components/ThemeEditor';

export default async function StarterAdminNewThemePage() {
  await requireStarterAdmin();

  const { tenantId } = await getStarterAdminApiContext();

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 4"
        title="New Theme"
        description="Create runtime theme data for this starter deployment."
      />
      <ThemeEditor initialTheme={createTheme(tenantId)} mode="create" />
    </section>
  );
}
