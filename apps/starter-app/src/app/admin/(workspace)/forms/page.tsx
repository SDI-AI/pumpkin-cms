import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getStarterAdminFormDefinitions } from '@/lib/starter-admin-forms';
import { FormDefinitionsList } from './_components/FormDefinitionsList';

export default async function StarterAdminFormsPage() {
  const definitions = await getStarterAdminFormDefinitions();

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 4"
        title="Form Definitions"
        description="Build tenant form schemas, field layout, submit behavior, and validation settings."
      />
      <FormDefinitionsList definitions={definitions} />
    </section>
  );
}
