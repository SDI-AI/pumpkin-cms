import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getStarterAdminPage } from '@/lib/starter-admin-pages';
import { PageVisualEditor } from '../_components/PageVisualEditor';

interface StarterAdminPageEditorProps {
  params: {
    slug: string[];
  };
}

export default async function StarterAdminPageEditor({ params }: StarterAdminPageEditorProps) {
  const pageSlug = params.slug.map((segment) => decodeURIComponent(segment)).join('/');
  const page = await getStarterAdminPage(pageSlug);

  return (
    <section>
      <AdminPageHeader
        eyebrow="Page Editor"
        title={page.MetaData?.title || page.pageSlug}
        description={`/${page.pageSlug}`}
        actions={
          <Link
            href={`/${page.pageSlug}`}
            target="_blank"
            className="inline-flex h-10 items-center rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            View Page
          </Link>
        }
      />
      <PageVisualEditor initialPage={page} mode="edit" originalSlug={page.pageSlug} />
    </section>
  );
}
