import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminApiContext } from '@/lib/starter-admin-api';
import { FormDefinitionEditor, createFormDefinition } from '../_components/FormDefinitionEditor';

export default function StarterAdminNewFormPage() {
  requireStarterAdmin();

  const { tenantId } = getStarterAdminApiContext();

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 4"
        title="New Form"
        description="Create a tenant form definition that can be rendered by starter pages and blocks."
      />
      <FormDefinitionEditor initialDefinition={createFormDefinition(tenantId)} mode="create" />
    </section>
  );
}
