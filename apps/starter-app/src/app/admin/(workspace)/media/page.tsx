import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminMediaAssets } from '@/lib/starter-admin-media';
import { MediaLibraryView } from './_components/MediaLibraryView';

export default async function StarterAdminMediaPage() {
  requireStarterAdmin();

  const assets = await getStarterAdminMediaAssets();

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 4"
        title="Media Library"
        description="Upload tenant media, register asset metadata, and copy public asset URLs."
      />
      <MediaLibraryView assets={assets} />
    </section>
  );
}
