import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export default function StarterAdminPagesPage() {
  return (
    <AdminPlaceholder
      nextPhase="Phase 3"
      title="Pages"
      description="This route is ready for the existing page editor and page list workflows."
      items={[
        'Port the current page list and editor components.',
        'Adapt API calls to the configured tenant instead of selected tenant context.',
        'Keep block editing, metadata editing, and publish/save states intact.',
        'Add preview links back to the public starter routes.',
      ]}
    />
  );
}
