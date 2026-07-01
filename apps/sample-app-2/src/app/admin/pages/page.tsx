const pageRows = [
  { slug: 'home', title: 'Home', type: 'landing', status: 'Published' },
  { slug: 'features', title: 'Features', type: 'hub', status: 'Draft' },
  { slug: 'contact', title: 'Contact', type: 'page', status: 'Published' },
];

export default function AdminPagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-neutral-950">Pages</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
            Page CRUD should operate directly on Pumpkin Page documents, including metadata, SEO, block data, sitemap flags, and hub/spoke relationships.
          </p>
        </div>
        <button className="rounded-md bg-orange-600 px-4 py-2 text-sm font-black text-white hover:bg-orange-700">
          New Page
        </button>
      </div>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pageRows.map((page) => (
              <tr key={page.slug}>
                <td className="px-5 py-4 font-mono text-neutral-700">/{page.slug === 'home' ? '' : page.slug}</td>
                <td className="px-5 py-4 font-semibold text-neutral-950">{page.title}</td>
                <td className="px-5 py-4 text-neutral-600">{page.type}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-700">{page.status}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="text-sm font-bold text-orange-700 hover:text-orange-900">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
