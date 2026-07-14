import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminPages } from '@/lib/starter-admin-pages';
import { PageFlowMapView } from './_components/PageFlowMapView';

export default async function StarterAdminPageMapPage() {
  await requireStarterAdmin();

  const { pages, unavailablePages } = await getStarterAdminPages();

  return (
    <section className="relative left-1/2 -my-8 flex h-[calc(100vh-4rem)] w-screen -translate-x-1/2 flex-col overflow-hidden bg-neutral-100">
      <PageFlowMapView pages={pages} unavailablePages={unavailablePages} />
    </section>
  );
}
