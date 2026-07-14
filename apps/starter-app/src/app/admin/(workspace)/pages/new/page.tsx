import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { createStarterAdminPageDraft } from '@/lib/starter-admin-pages';
import { loadTenantConfig } from '@/lib/tenant-config';
import { PageVisualEditor } from '../_components/PageVisualEditor';

interface StarterAdminNewPagePageProps {
  searchParams?: Promise<{
    hubPageSlug?: string;
    pageSlug?: string;
  }>;
}

export default async function StarterAdminNewPagePage({ searchParams }: StarterAdminNewPagePageProps) {
  await requireStarterAdmin();
  const query = await searchParams;

  const config = loadTenantConfig();
  if (!config) {
    throw new Error('Pumpkin tenant configuration is missing.');
  }

  const draft = createStarterAdminPageDraft({
    tenantId: config.tenantId,
    pageSlug: query?.pageSlug,
    hubPageSlug: query?.hubPageSlug,
  });

  return (
    <section>
      <AdminPageHeader
        eyebrow="Page Editor"
        title="New Page"
        description="Create a page for this starter tenant."
      />
      <PageVisualEditor initialPage={draft} mode="create" />
    </section>
  );
}
