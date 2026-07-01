export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-neutral-950">Settings</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
          Tenant runtime settings for API endpoints, tenant identity, deployment mode, preview behavior, and CLI-generated instance metadata.
        </p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase text-neutral-500">Tenant ID</span>
            <input className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue="pumpkin" />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase text-neutral-500">API URL</span>
            <input className="rounded-md border border-neutral-300 px-3 py-2 text-sm" defaultValue="http://localhost:5064" />
          </label>
        </div>
      </section>
    </div>
  );
}
