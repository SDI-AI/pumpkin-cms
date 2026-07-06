import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getStarterAdminPages } from '@/lib/starter-admin-pages';
import { PageMapView } from './_components/PageMapView';

export default async function StarterAdminPageMapPage() {
  const { pages, unavailablePages } = await getStarterAdminPages();

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 2"
        title="Page Map"
        description="Review the tenant page hierarchy by hub, spoke, orphaned page, and related hub references."
      />
      <PageMapView pages={pages} unavailablePages={unavailablePages} />
    </section>
  );
}
