const menuItems = [
  { label: 'Home', url: '/', target: '_self', visible: true },
  { label: 'Features', url: '/features', target: '_self', visible: true },
  { label: 'Contact', url: '/contact', target: '_self', visible: true },
];

export default function AdminNavigationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-neutral-950">Header, Footer, Menu</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
          Theme documents own brand, CTA, footer, and menu data so a tenant can ship navigation changes without a front-end deploy.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-black text-neutral-950">Header</h3>
          <div className="mt-4 grid gap-4">
            <input className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue="Pumpkin CMS" aria-label="Logo alt text" />
            <input className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue="Get Started" aria-label="CTA text" />
            <input className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue="/contact" aria-label="CTA URL" />
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-black text-neutral-950">Footer</h3>
          <div className="mt-4 grid gap-4">
            <textarea className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue="An API-first CMS for fast tenant sites." aria-label="Footer description" />
            <input className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue="c {year} Pumpkin CMS." aria-label="Copyright" />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h3 className="text-base font-black text-neutral-950">Main Menu</h3>
        </div>
        <div className="divide-y divide-neutral-100">
          {menuItems.map((item, index) => (
            <div key={item.label} className="grid gap-3 px-5 py-4 md:grid-cols-[4rem_1fr_1fr_8rem_6rem]">
              <span className="text-sm font-bold text-neutral-400">#{index + 1}</span>
              <input className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue={item.label} aria-label="Menu label" />
              <input className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue={item.url} aria-label="Menu URL" />
              <select className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue={item.target} aria-label="Menu target">
                <option value="_self">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
              <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <input type="checkbox" defaultChecked={item.visible} className="rounded border-neutral-300 text-orange-600" />
                Visible
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
