import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminApiContext } from '@/lib/starter-admin-api';
import { ThemeEditor, createTheme } from '../_components/ThemeEditor';

export default function StarterAdminNewThemePage() {
  requireStarterAdmin();

  const { tenantId } = getStarterAdminApiContext();

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
