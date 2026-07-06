import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export default function StarterAdminFormsPage() {
  return (
    <AdminPlaceholder
      nextPhase="Phase 4"
      title="Form Definitions"
      description="This route is ready for the form definition builder."
      items={[
        'List tenant form definitions by form type.',
        'Edit fields, ordering, options, validation, hidden fields, and required flags.',
        'Control success message and submit behavior.',
        'Keep an advanced JSON view for escape-hatch edits.',
      ]}
    />
  );
}
