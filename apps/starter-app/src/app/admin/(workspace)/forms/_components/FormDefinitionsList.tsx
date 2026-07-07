'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FilePlus2, Search } from 'lucide-react';
import type { FormDefinition } from 'pumpkin-ts-models';

interface FormDefinitionsListProps {
  definitions: FormDefinition[];
}

export function FormDefinitionsList({ definitions }: FormDefinitionsListProps) {
  const [query, setQuery] = useState('');
  const filtered = definitions
    .filter((definition) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return true;

      return [
        definition.name,
        definition.type,
        definition.formDefinitionId,
        definition.description,
      ].filter(Boolean).join(' ').toLowerCase().includes(normalized);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search forms"
              className="h-10 w-full rounded-md border border-neutral-300 px-3 pl-9 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
            />
          </div>
          <Link
            href="/admin/forms/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            <span>New Form</span>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-base font-bold text-neutral-950">No form definitions found</h2>
            <p className="mt-2 text-sm text-neutral-600">Create a form definition to render dynamic forms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <HeaderCell>Name</HeaderCell>
                  <HeaderCell>Type</HeaderCell>
                  <HeaderCell>Fields</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Updated</HeaderCell>
                  <HeaderCell />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filtered.map((definition) => (
                  <tr key={definition.formDefinitionId} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/forms/${encodeURIComponent(definition.formDefinitionId)}`}
                        className="font-semibold text-neutral-950 hover:text-pumpkin-700"
                      >
                        {definition.name}
                      </Link>
                      {definition.description && (
                        <p className="mt-1 max-w-md truncate text-xs text-neutral-500">{definition.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{definition.type}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{definition.fields?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={[
                        'rounded-full px-2 py-1 text-xs font-semibold',
                        definition.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-700',
                      ].join(' ')}>
                        {definition.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{formatDate(definition.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/forms/${encodeURIComponent(definition.formDefinitionId)}`}
                        className="inline-flex h-8 items-center rounded-md border border-neutral-300 px-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderCell({ children }: { children?: string }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-500">
      {children}
    </th>
  );
}

function formatDate(value?: string) {
  if (!value) return 'Never';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
