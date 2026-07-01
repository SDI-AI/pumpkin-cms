import { AlertTriangle, CheckCircle2, Cloud, Database, ShieldCheck } from 'lucide-react';
import { getMissingTenantConfigKeys, loadTenantConfig, redactApiKey } from '@/lib/tenant-config';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const config = loadTenantConfig();

  if (!config) {
    const missingKeys = getMissingTenantConfigKeys();

    return (
      <main className="min-h-screen bg-neutral-100 px-4 py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_30rem]">
          <section className="flex min-h-[34rem] flex-col justify-between rounded-lg bg-neutral-950 p-8 text-white">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-red-300">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Configuration Missing
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-5xl">
                This starter app was deployed without tenant configuration.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300">
                Starter apps are passive at runtime. They read tenant configuration supplied by the deployment pipeline, Azure App Settings, container environment variables, or a CLI-generated local file.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <Database className="h-5 w-5 text-pumpkin-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold">Tenant exists</p>
                <p className="mt-1 text-xs leading-5 text-neutral-400">The app expects an existing Pumpkin tenant.</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <Cloud className="h-5 w-5 text-pumpkin-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold">Deploy configured</p>
                <p className="mt-1 text-xs leading-5 text-neutral-400">Initial deployments should include app settings.</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="h-5 w-5 text-pumpkin-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold">Read-only</p>
                <p className="mt-1 text-xs leading-5 text-neutral-400">The app does not write configuration.</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-neutral-950">Required Configuration</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Add these values to the deployment environment. This screen is informational only.
            </p>

            <div className="mt-5 space-y-3">
              {['NEXT_PUBLIC_PUMPKIN_API_URL', 'PUMPKIN_TENANT_ID', 'PUMPKIN_API_KEY'].map((key) => {
                const isMissing = missingKeys.includes(key);
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                      isMissing ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
                    }`}
                  >
                    <code className="text-xs font-bold text-neutral-900">{key}</code>
                    <span className={`text-xs font-black ${isMissing ? 'text-red-700' : 'text-emerald-700'}`}>
                      {isMissing ? 'Missing' : 'Present'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-black text-neutral-950">Azure/App Settings example</p>
              <pre className="mt-3 overflow-x-auto rounded-md bg-neutral-950 p-4 text-xs leading-6 text-neutral-100">
{`NEXT_PUBLIC_PUMPKIN_API_URL=https://your-pumpkin-api
PUMPKIN_TENANT_ID=existing-tenant-id
PUMPKIN_API_KEY=existing-tenant-api-key
PUMPKIN_SITE_NAME=Optional Site Name`}
              </pre>
            </div>

            <p className="mt-4 text-xs leading-5 text-neutral-500">
              For local CLI-generated instances, a tool may write `config/tenant.local.json` before the app starts. The app itself does not provide a runtime setup form.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase text-pumpkin-600">Starter App Configured</p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-neutral-950">
          {config.siteName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          This is a blank Pumpkin tenant app. Phase 1 stops here after reading its deployment-supplied tenant binding.
        </p>

        <dl className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <dt className="text-xs font-black uppercase text-neutral-500">Tenant ID</dt>
            <dd className="mt-1 font-mono text-sm text-neutral-950">{config.tenantId}</dd>
          </div>
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <dt className="text-xs font-black uppercase text-neutral-500">API URL</dt>
            <dd className="mt-1 font-mono text-sm text-neutral-950">{config.apiUrl}</dd>
          </div>
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <dt className="text-xs font-black uppercase text-neutral-500">API Key</dt>
            <dd className="mt-1 font-mono text-sm text-neutral-950">{redactApiKey(config.apiKey)}</dd>
          </div>
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <dt className="text-xs font-black uppercase text-neutral-500">Config Source</dt>
            <dd className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-neutral-950">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              {config.source}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
