'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, GitBranch, Plus } from 'lucide-react';
import type { Page } from 'pumpkin-ts-models';

interface PageMapViewProps {
  pages: Page[];
  unavailablePages: string[];
}

export function PageMapView({ pages, unavailablePages }: PageMapViewProps) {
  const [query, setQuery] = useState('');
  const graph = useMemo(() => buildPageGraph(pages, query), [pages, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Pages" value={String(pages.length)} />
            <Stat label="Hubs" value={String(graph.hubs.length)} />
            <Stat label="Spokes" value={String(graph.spokeCount)} />
            <Stat label="Orphans" value={String(graph.orphans.length)} />
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter pages"
            className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100 lg:w-72"
          />
        </div>

        {unavailablePages.length > 0 && (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Some sitemap entries could not be loaded: {unavailablePages.join(', ')}
          </p>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
          <GitBranch className="mx-auto h-8 w-8 text-neutral-400" aria-hidden="true" />
          <h2 className="mt-4 text-base font-bold text-neutral-950">No published pages found</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Published sitemap pages will appear here once content is available for this tenant.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {graph.hubs.map((hub) => (
            <HubGroup key={hub.pageSlug} hub={hub} spokes={graph.spokesByHub.get(hub.pageSlug) ?? []} />
          ))}

          {graph.orphans.length > 0 && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">Orphaned Pages</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {graph.orphans.map((page) => (
                  <PageCard key={page.pageSlug} page={page} tone="orphan" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function HubGroup({ hub, spokes }: { hub: Page; spokes: Page[] }) {
  return (
    <section className="rounded-lg border border-pumpkin-200 bg-white shadow-sm">
      <div className="border-b border-pumpkin-100 bg-pumpkin-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageCard page={hub} tone="hub" />
          <Link
            href={`/admin/pages/new?hubPageSlug=${encodeURIComponent(hub.pageSlug)}`}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Spoke</span>
          </Link>
        </div>
      </div>

      <div className="p-5">
        {spokes.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {spokes.map((spoke) => (
              <PageCard key={spoke.pageSlug} page={spoke} tone="spoke" />
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
            No spoke pages are attached to this hub.
          </p>
        )}
      </div>
    </section>
  );
}

function PageCard({ page, tone }: { page: Page; tone: 'hub' | 'spoke' | 'orphan' }) {
  const title = page.MetaData?.title || page.pageSlug;
  const relatedHubs = page.contentRelationships?.relatedHubs ?? [];

  return (
    <article
      className={[
        'rounded-md border bg-white p-4',
        tone === 'hub' ? 'border-pumpkin-300' : '',
        tone === 'spoke' ? 'border-neutral-200' : '',
        tone === 'orphan' ? 'border-amber-300' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{tone}</p>
          <h3 className="mt-1 text-sm font-bold leading-5 text-neutral-950">{title}</h3>
          <p className="mt-1 text-xs text-neutral-500">/{page.pageSlug}</p>
        </div>
        <FileText className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{page.isPublished ? 'Published' : 'Draft'}</Badge>
        {page.contentRelationships?.topicCluster && <Badge>{page.contentRelationships.topicCluster}</Badge>}
      </div>

      {page.contentRelationships?.hubPageSlug && tone === 'orphan' && (
        <p className="mt-3 text-xs text-amber-800">
          Missing hub: {page.contentRelationships.hubPageSlug}
        </p>
      )}

      {relatedHubs.length > 0 && (
        <p className="mt-3 text-xs text-blue-700">
          Related: {relatedHubs.join(', ')}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Link
          href={`/admin/pages/${encodeURIComponent(page.pageSlug)}`}
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
    </article>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
      {children}
    </span>
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

function buildPageGraph(pages: Page[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchingPages = normalizedQuery
    ? pages.filter((page) => {
        const text = [
          page.pageSlug,
          page.MetaData?.title,
          page.MetaData?.description,
          page.contentRelationships?.topicCluster,
        ].filter(Boolean).join(' ').toLowerCase();

        return text.includes(normalizedQuery);
      })
    : pages;

  const pageSlugs = new Set(pages.map((page) => page.pageSlug));
  const hubs = matchingPages
    .filter((page) => page.contentRelationships?.isHub)
    .sort(comparePages);

  const spokesByHub = new Map<string, Page[]>();
  let spokeCount = 0;

  hubs.forEach((hub) => {
    const spokes = matchingPages
      .filter((page) => page.contentRelationships?.hubPageSlug === hub.pageSlug && !page.contentRelationships?.isHub)
      .sort(comparePages);
    spokesByHub.set(hub.pageSlug, spokes);
    spokeCount += spokes.length;
  });

  const groupedSpokeSlugs = new Set(
    Array.from(spokesByHub.values()).flatMap((spokes) => spokes.map((page) => page.pageSlug)),
  );

  const orphans = matchingPages
    .filter((page) => {
      if (page.contentRelationships?.isHub) return false;

      const hubSlug = page.contentRelationships?.hubPageSlug;
      return !hubSlug || !pageSlugs.has(hubSlug) || !groupedSpokeSlugs.has(page.pageSlug);
    })
    .sort(comparePages);

  return { hubs, spokesByHub, spokeCount, orphans };
}

function comparePages(a: Page, b: Page) {
  const priorityDelta = (a.contentRelationships?.spokePriority ?? 0) - (b.contentRelationships?.spokePriority ?? 0);
  if (priorityDelta !== 0) return priorityDelta;

  return (a.MetaData?.title || a.pageSlug).localeCompare(b.MetaData?.title || b.pageSlug);
}
