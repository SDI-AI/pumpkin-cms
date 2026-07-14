import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminFormDefinition } from '@/lib/starter-admin-forms';
import { FormDefinitionEditor } from '../_components/FormDefinitionEditor';

interface StarterAdminFormEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StarterAdminFormEditPage({ params }: StarterAdminFormEditPageProps) {
  await requireStarterAdmin();

  const { id } = await params;
  const definition = await getStarterAdminFormDefinition(id);

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
