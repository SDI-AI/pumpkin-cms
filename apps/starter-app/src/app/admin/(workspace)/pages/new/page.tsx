import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { createStarterAdminPageDraft } from '@/lib/starter-admin-pages';
import { loadTenantConfig } from '@/lib/tenant-config';
import { PageVisualEditor } from '../_components/PageVisualEditor';

interface StarterAdminNewPagePageProps {
  searchParams?: {
    hubPageSlug?: string;
    pageSlug?: string;
  };
}

export default function StarterAdminNewPagePage({ searchParams }: StarterAdminNewPagePageProps) {
  const config = loadTenantConfig();
  if (!config) {
    throw new Error('Pumpkin tenant configuration is missing.');
  }

  const draft = createStarterAdminPageDraft({
    tenantId: config.tenantId,
    pageSlug: searchParams?.pageSlug,
    hubPageSlug: searchParams?.hubPageSlug,
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
