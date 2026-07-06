import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export default function StarterAdminPageMapPage() {
  return (
    <AdminPlaceholder
      nextPhase="Phase 2"
      title="Page Map"
      description="This route is ready for the existing page-map workflow to move into the starter app with single-tenant context."
      items={[
        'Reuse the current admin page-map view and actions.',
        'Remove tenant switching and read tenant identity from starter config.',
        'Keep page hierarchy, route, status, and navigation editing together.',
        'Save through starter server routes so secrets stay server-side.',
      ]}
    />
  );
}
