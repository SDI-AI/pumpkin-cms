'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Plus } from 'lucide-react';
import type { Page } from 'pumpkin-ts-models';

interface PageListViewProps {
  pages: Page[];
  unavailablePages: string[];
}

export function PageListView({ pages, unavailablePages }: PageListViewProps) {
  const [query, setQuery] = useState('');
  const filteredPages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [...pages].sort(comparePages);

    return pages
      .filter((page) => {
        const haystack = [
          page.pageSlug,
          page.MetaData?.title,
          page.MetaData?.description,
          page.MetaData?.pageType,
          page.contentRelationships?.topicCluster,
        ].filter(Boolean).join(' ').toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .sort(comparePages);
  }, [pages, query]);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Stat label="Pages" value={String(pages.length)} />
            <Stat label="Published" value={String(pages.filter((page) => page.isPublished).length)} />
            <Stat label="Hubs" value={String(pages.filter((page) => page.contentRelationships?.isHub).length)} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter pages"
              className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100 sm:w-72"
            />
            <Link
              href="/admin/pages/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>New Page</span>
            </Link>
          </div>
        </div>

        {unavailablePages.length > 0 && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Some sitemap entries could not be loaded: {unavailablePages.join(', ')}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {filteredPages.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-neutral-400" aria-hidden="true" />
            <h2 className="mt-4 text-base font-bold text-neutral-950">No pages found</h2>
            <p className="mt-2 text-sm text-neutral-600">Try a different filter or create a page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <HeaderCell>Title</HeaderCell>
                  <HeaderCell>Slug</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Type</HeaderCell>
                  <HeaderCell>Updated</HeaderCell>
                  <HeaderCell />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredPages.map((page) => (
                  <tr key={page.pageSlug} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/pages/${page.pageSlug}`} className="font-semibold text-neutral-950 hover:text-pumpkin-700">
                        {page.MetaData?.title || 'Untitled'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">/{page.pageSlug}</td>
                    <td className="px-4 py-3">
                      <span className={[
                        'rounded-full px-2 py-1 text-xs font-semibold',
                        page.isPublished ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800',
                      ].join(' ')}>
                        {page.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{page.MetaData?.pageType || 'Page'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{formatDate(page.MetaData?.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/pages/${page.pageSlug}`}
                          className="inline-flex h-8 items-center rounded-md border border-neutral-300 px-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/${page.pageSlug}`}
                          target="_blank"
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-neutral-300 px-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          View
                        </Link>
                      </div>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-neutral-950">{value}</p>
    </div>
  );
}

function comparePages(a: Page, b: Page) {
  return (a.MetaData?.title || a.pageSlug).localeCompare(b.MetaData?.title || b.pageSlug);
}

function formatDate(value?: string) {
  if (!value) return 'Never';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
