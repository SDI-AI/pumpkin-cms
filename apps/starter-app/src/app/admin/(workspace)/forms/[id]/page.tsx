import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminFormDefinition } from '@/lib/starter-admin-forms';
import { FormDefinitionEditor } from '../_components/FormDefinitionEditor';

interface StarterAdminFormEditPageProps {
  params: {
    id: string;
  };
}

export default async function StarterAdminFormEditPage({ params }: StarterAdminFormEditPageProps) {
  requireStarterAdmin();

  const definition = await getStarterAdminFormDefinition(params.id);

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 4"
        title={definition.name || 'Edit Form'}
        description="Update fields, submit behavior, and the full form definition JSON."
      />
      <FormDefinitionEditor initialDefinition={definition} mode="edit" />
    </section>
  );
}
