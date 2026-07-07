import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminPages } from '@/lib/starter-admin-pages';
import { PageListView } from './_components/PageListView';

export default async function StarterAdminPagesPage() {
  requireStarterAdmin();

  const { pages, unavailablePages } = await getStarterAdminPages();

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 3"
        title="Pages"
        description="Manage the tenant pages available to this starter deployment."
      />
      <PageListView pages={pages} unavailablePages={unavailablePages} />
    </section>
  );
}
