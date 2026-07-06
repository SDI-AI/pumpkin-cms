import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';

export default function StarterAdminThemesPage() {
  return (
    <AdminPlaceholder
      nextPhase="Phase 4"
      title="Themes"
      description="This route is ready for starter theme management once the runtime theme contract is tightened."
      items={[
        'Show active and installed themes for this deployment.',
        'Activate bundled compiled theme CSS files instantly.',
        'Edit header, footer, menu, and runtime CSS variables.',
        'Leave theme plugin install/build triggers for a later pass.',
      ]}
    />
  );
}
