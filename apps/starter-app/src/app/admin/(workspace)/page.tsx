import Link from 'next/link';
import { AlertTriangle, CheckCircle2, FileText, FormInput, Map, Palette } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getStarterAdminContext } from '@/lib/admin-auth';

const workflowCards = [
  {
    title: 'Page Map',
    href: '/admin/page-map',
    icon: Map,
    description: 'Move the existing page-map workflow into the starter admin.',
  },
  {
    title: 'Pages',
    href: '/admin/pages',
    icon: FileText,
    description: 'Bring over page editing, block editing, and publish/save actions.',
  },
  {
    title: 'Forms',
    href: '/admin/forms',
    icon: FormInput,
    description: 'Add the form definition builder for fields, validation, and submit behavior.',
  },
  {
    title: 'Themes',
    href: '/admin/themes',
    icon: Palette,
    description: 'Manage active themes, installed themes, and runtime theme tokens.',
  },
];

export default function StarterAdminDashboardPage() {
  const context = getStarterAdminContext();
  const configured = context.missingConfigKeys.length === 0;

  return (
    <section>
      <AdminPageHeader
        eyebrow="Starter Admin"
        title="Tenant workspace"
        description="Single-tenant administration for this deployed starter app. The workflows here are scoped to the configured tenant and can later roll up into the multi-tenant admin."
      />

      <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          {configured ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" aria-hidden="true" />
          )}
          <div>
            <h2 className="text-sm font-bold text-neutral-950">
              {configured ? 'Starter admin is configured' : 'Configuration needs attention'}
            </h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-medium text-neutral-500">Tenant</dt>
                <dd className="mt-1 font-semibold text-neutral-900">{context.tenantId}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-500">API URL</dt>
                <dd className="mt-1 truncate font-semibold text-neutral-900">{context.apiUrl}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-500">Config source</dt>
                <dd className="mt-1 font-semibold text-neutral-900">{context.configSource}</dd>
              </div>
            </dl>
            {!configured && (
              <p className="mt-3 text-sm text-amber-700">
                Missing: {context.missingConfigKeys.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {workflowCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:border-pumpkin-300 hover:bg-pumpkin-50"
            >
              <Icon className="h-5 w-5 text-pumpkin-600" aria-hidden="true" />
              <h2 className="mt-4 text-base font-bold text-neutral-950">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
