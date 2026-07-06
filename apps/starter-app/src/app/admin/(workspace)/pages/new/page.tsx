import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export default function StarterAdminNewPagePage() {
  return (
    <AdminPlaceholder
      nextPhase="Phase 3"
      title="New Page"
      description="This route is reserved for the visual page creation flow from the current admin."
      items={[
        'Create a complete Page document from defaults.',
        'Honor hubPageSlug query parameters from the page map.',
        'Save through the starter server-side API route.',
        'Redirect into the page editor after creation.',
      ]}
    />
  );
}
