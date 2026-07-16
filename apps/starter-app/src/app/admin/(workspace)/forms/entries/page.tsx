import Link from 'next/link';
import { ListTree } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminFormEntries } from '@/lib/starter-admin-forms';
import { FormEntriesManager } from './_components/FormEntriesManager';

export default async function FormEntriesPage() {
  await requireStarterAdmin();
  const entries = await getStarterAdminFormEntries();

  return (
    <section>
      <AdminPageHeader
        eyebrow="Forms"
        title="Form Entries"
        description="Review submissions, search submitted values, and manage their workflow status."
        actions={(
          <Link href="/admin/forms" className="inline-flex h-10 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
            <ListTree className="h-4 w-4" />
            Form Definitions
          </Link>
        )}
      />
      <FormEntriesManager initialEntries={entries} />
    </section>
  );
}
