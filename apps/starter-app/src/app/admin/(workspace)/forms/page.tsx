import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireStarterAdmin } from '@/lib/admin-auth';
import { getStarterAdminFormDefinitions } from '@/lib/starter-admin-forms';
import { FormDefinitionsList } from './_components/FormDefinitionsList';

export default async function StarterAdminFormsPage() {
  await requireStarterAdmin();

  const definitions = await getStarterAdminFormDefinitions();

  return (
    <section>
      <AdminPageHeader
        eyebrow="Phase 4"
        title="Form Definitions"
        description="Build tenant form schemas, field layout, submit behavior, and validation settings."
        actions={(
          <Link href="/admin/forms/entries" className="inline-flex h-10 items-center gap-2 rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700">
            <Inbox className="h-4 w-4" />
            Review Entries
          </Link>
        )}
      />
      <FormDefinitionsList definitions={definitions} />
    </section>
  );
}
