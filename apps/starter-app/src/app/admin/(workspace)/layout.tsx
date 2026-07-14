import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { getStarterAdminContext, requireStarterAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function StarterAdminLayout({ children }: { children: ReactNode }) {
  await requireStarterAdmin();

  return (
    <AdminShell context={await getStarterAdminContext()}>
      {children}
    </AdminShell>
  );
}
