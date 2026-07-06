import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { getStarterAdminContext, requireStarterAdmin } from '@/lib/admin-auth';

export default function StarterAdminLayout({ children }: { children: ReactNode }) {
  requireStarterAdmin();

  return (
    <AdminShell context={getStarterAdminContext()}>
      {children}
    </AdminShell>
  );
}
