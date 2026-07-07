'use client';

import { useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Code2, Eye, Save } from 'lucide-react';
import type { IHtmlBlock, Page } from 'pumpkin-ts-models';
import { ContentBlocksEditor } from '@/components/blocks';

interface PageVisualEditorProps {
  initialPage: Page;
  mode: 'create' | 'edit';
  originalSlug?: string;
}

type SectionKey = 'basic' | 'metadata' | 'contentBlocks' | 'search' | 'seo' | 'relationships';

const sectionLabels: Record<SectionKey, string> = {
  basic: 'Basic',
  metadata: 'Metadata',
  contentBlocks: 'Blocks',
  search: 'Search',
  seo: 'SEO',
  relationships: 'Relationships',
};

export function PageVisualEditor({ initialPage, mode, originalSlug }: PageVisualEditorProps) {
  const router = useRouter();
  const [page, setPage] = useState(() => normalizePage(initialPage));
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    basic: true,
    metadata: true,
    contentBlocks: true,
    search: false,
    seo: false,
    relationships: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const blockTypes = useMemo(
    () => Array.from(new Set(page.ContentData.ContentBlocks.map((block) => block.type))),
    [page.ContentData.ContentBlocks],
  );

  const updateField = (path: string, value: unknown) => {
    setPage((currentPage) => {
      const updated = structuredClone(currentPage) as Page;
      const keys = path.split('.');
      let target: Record<string, unknown> = updated as unknown as Record<string, unknown>;

      for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        target = target[key] as Record<string, unknown>;
      }

      target[keys[keys.length - 1]] = value;
      updated.MetaData.updatedAt = new Date().toISOString();

      if (path === 'isPublished') {
        updated.publishedAt = value && !updated.publishedAt ? new Date().toISOString() : updated.publishedAt;
      }

      return updated;
    });
  };

  const handleBlocksChange = (blocks: IHtmlBlock[]) => {
    setPage((currentPage) => ({
      ...currentPage,
      ContentData: { ...currentPage.ContentData, ContentBlocks: blocks },
      searchData: {
        ...currentPage.searchData,
        blockTypes: Array.from(new Set(blocks.map((block) => block.type))),
      },
      MetaData: { ...currentPage.MetaData, updatedAt: new Date().toISOString() },
    }));
  };

  const save = async () => {
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const pageToSave = normalizePage({
        ...page,
        pageSlug: normalizeSlug(page.pageSlug || page.MetaData.title),
        MetaData: {
          ...page.MetaData,
          updatedAt: new Date().toISOString(),
        },
        searchData: {
          ...page.searchData,
          blockTypes,
        },
      });

      if (!pageToSave.pageSlug) {
        throw new Error('Page slug is required.');
      }

      if (!pageToSave.MetaData.title.trim()) {
        throw new Error('Page title is required.');
      }

      pageToSave.id = pageToSave.id || `${pageToSave.tenantId}-${pageToSave.pageSlug}`;
      pageToSave.PageId = pageToSave.PageId || pageToSave.id;

      const endpoint = mode === 'create'
        ? '/api/admin/pages'
        : `/api/admin/pages/${encodeSlugPath(originalSlug || pageToSave.pageSlug)}`;
      const response = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageToSave),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to save page.');
      }

      const updated = normalizePage((await response.json()) as Page);
      setPage(updated);
      setMessage('Page saved.');
      router.refresh();

      if (mode === 'create' || updated.pageSlug !== originalSlug) {
        router.replace(`/admin/pages/${encodeSlugPath(updated.pageSlug)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save page.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 rounded-lg border border-neutral-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <StatusButton published={page.isPublished} onClick={() => updateField('isPublished', !page.isPublished)} />
            <ToolbarStat label="Blocks" value={String(page.ContentData.ContentBlocks.length)} />
            <ToolbarStat label="Types" value={String(blockTypes.length)} />
            <ToolbarStat label="Version" value={String(page.PageVersion || 1)} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {message && (
              <span className="inline-flex h-10 items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 text-sm font-semibold text-green-700">
                <Check className="h-4 w-4" aria-hidden="true" />
                {message}
              </span>
            )}
            {error && (
              <span className="inline-flex min-h-10 items-center rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700">
                {error}
              </span>
            )}
            <a
              href={page.pageSlug ? `/${page.pageSlug}` : '/'}
              target="_blank"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span>View</span>
            </a>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-pumpkin-600 px-4 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Page'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-4">
          <EditorSection section="basic" expandedSections={expandedSections} setExpandedSections={setExpandedSections}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Page Slug" value={page.pageSlug} onChange={(value) => updateField('pageSlug', value)} required />
              <SelectField
                label="Layout"
                value={page.Layout || 'standard'}
                onChange={(value) => updateField('Layout', value)}
                options={['standard', 'full-width', 'sidebar', 'landing']}
              />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={page.includeInSitemap}
                onChange={(event) => updateField('includeInSitemap', event.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-pumpkin-600 focus:ring-pumpkin-500"
              />
              Include in sitemap
            </label>
          </EditorSection>

          <EditorSection section="metadata" expandedSections={expandedSections} setExpandedSections={setExpandedSections}>
            <div className="space-y-4">
              <TextField label="Title" value={page.MetaData.title} onChange={(value) => updateField('MetaData.title', value)} required />
              <TextAreaField label="Description" value={page.MetaData.description} onChange={(value) => updateField('MetaData.description', value)} rows={3} />
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Page Type"
                  value={page.MetaData.pageType || 'Keyword'}
                  onChange={(value) => updateField('MetaData.pageType', value)}
                  options={['Keyword', 'Hub', 'Spoke', 'Landing', 'Static']}
                />
                <TextField label="Category" value={page.MetaData.category} onChange={(value) => updateField('MetaData.category', value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <TextField label="Product" value={page.MetaData.product} onChange={(value) => updateField('MetaData.product', value)} />
                <TextField label="Keyword" value={page.MetaData.keyword} onChange={(value) => updateField('MetaData.keyword', value)} />
                <TextField label="Author" value={page.MetaData.author} onChange={(value) => updateField('MetaData.author', value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Language" value={page.MetaData.language} onChange={(value) => updateField('MetaData.language', value)} />
                <TextField label="Market" value={page.MetaData.market} onChange={(value) => updateField('MetaData.market', value)} />
              </div>
            </div>
          </EditorSection>

          <EditorSection section="contentBlocks" expandedSections={expandedSections} setExpandedSections={setExpandedSections}>
            <ContentBlocksEditor blocks={page.ContentData.ContentBlocks} onChange={handleBlocksChange} />
          </EditorSection>

          <EditorSection section="search" expandedSections={expandedSections} setExpandedSections={setExpandedSections}>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="State" value={page.searchData.state} onChange={(value) => updateField('searchData.state', value)} />
                <TextField label="City" value={page.searchData.city} onChange={(value) => updateField('searchData.city', value)} />
                <TextField label="Metro" value={page.searchData.metro} onChange={(value) => updateField('searchData.metro', value)} />
                <TextField label="County" value={page.searchData.county} onChange={(value) => updateField('searchData.county', value)} />
              </div>
              <TextField label="Search Keyword" value={page.searchData.keyword} onChange={(value) => updateField('searchData.keyword', value)} />
              <TextField label="Tags" value={page.searchData.tags.join(', ')} onChange={(value) => updateField('searchData.tags', splitCommaList(value))} />
              <TextAreaField label="Content Summary" value={page.searchData.contentSummary} onChange={(value) => updateField('searchData.contentSummary', value)} rows={3} />
            </div>
          </EditorSection>

          <EditorSection section="seo" expandedSections={expandedSections} setExpandedSections={setExpandedSections}>
            <div className="space-y-4">
              <TextField label="Meta Title" value={page.seo.metaTitle} onChange={(value) => updateField('seo.metaTitle', value)} />
              <TextAreaField label="Meta Description" value={page.seo.metaDescription} onChange={(value) => updateField('seo.metaDescription', value)} rows={3} />
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Canonical URL" value={page.seo.canonicalUrl} onChange={(value) => updateField('seo.canonicalUrl', value)} />
                <TextField label="Robots" value={page.seo.robots} onChange={(value) => updateField('seo.robots', value)} />
              </div>
              <TextField label="Keywords" value={page.seo.keywords.join(', ')} onChange={(value) => updateField('seo.keywords', splitCommaList(value))} />
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Open Graph Image" value={page.seo.openGraph['og:image']} onChange={(value) => updateField('seo.openGraph.og:image', value)} />
                <TextField label="Twitter Image" value={page.seo.twitterCard['twitter:image']} onChange={(value) => updateField('seo.twitterCard.twitter:image', value)} />
              </div>
            </div>
          </EditorSection>

          <EditorSection section="relationships" expandedSections={expandedSections} setExpandedSections={setExpandedSections}>
            <div className="space-y-4">
              <label className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800">
                <input
                  type="checkbox"
                  checked={page.contentRelationships.isHub}
                  onChange={(event) => updateField('contentRelationships.isHub', event.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-pumpkin-600 focus:ring-pumpkin-500"
                />
                Hub page
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Hub Page Slug" value={page.contentRelationships.hubPageSlug} onChange={(value) => updateField('contentRelationships.hubPageSlug', value)} />
                <TextField label="Topic Cluster" value={page.contentRelationships.topicCluster} onChange={(value) => updateField('contentRelationships.topicCluster', value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Spoke Priority" type="number" value={String(page.contentRelationships.spokePriority)} onChange={(value) => updateField('contentRelationships.spokePriority', Number.parseInt(value, 10) || 0)} />
                <TextField label="Related Hubs" value={page.contentRelationships.relatedHubs.join(', ')} onChange={(value) => updateField('contentRelationships.relatedHubs', splitCommaList(value))} />
              </div>
            </div>
          </EditorSection>
        </div>

        <aside className="min-h-[640px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-950 shadow-sm xl:sticky xl:top-24 xl:h-[calc(100vh-7rem)]">
          <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-100">
              <Code2 className="h-4 w-4" aria-hidden="true" />
              JSON Preview
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(page, null, 2))}
              className="h-8 rounded-md bg-neutral-800 px-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
            >
              Copy
            </button>
          </div>
          <pre className="h-full overflow-auto p-4 text-xs leading-5 text-neutral-200">
            {JSON.stringify(page, null, 2)}
          </pre>
        </aside>
      </div>
    </div>
  );
}

function EditorSection({
  children,
  expandedSections,
  section,
  setExpandedSections,
}: {
  children: ReactNode;
  expandedSections: Record<SectionKey, boolean>;
  section: SectionKey;
  setExpandedSections: Dispatch<SetStateAction<Record<SectionKey, boolean>>>;
}) {
  const expanded = expandedSections[section];

  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpandedSections((current) => ({ ...current, [section]: !expanded }))}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <h2 className="text-base font-bold text-neutral-950">{sectionLabels[section]}</h2>
        <span className="text-sm font-semibold text-neutral-500">{expanded ? 'Hide' : 'Show'}</span>
      </button>
      {expanded && <div className="border-t border-neutral-100 px-5 py-5">{children}</div>}
    </section>
  );
}

function TextField({
  label,
  onChange,
  required,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
        {label}{required ? ' *' : ''}
      </span>
      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  rows,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  rows: number;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">{label}</span>
      <textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm leading-6 outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function StatusButton({ published, onClick }: { published: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex h-10 items-center rounded-md px-3 text-sm font-bold',
        published ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      ].join(' ')}
    >
      {published ? 'Published' : 'Draft'}
    </button>
  );
}

function ToolbarStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex h-10 items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-sm font-bold text-neutral-950">{value}</span>
    </div>
  );
}

function normalizePage(page: Page): Page {
  const now = new Date().toISOString();
  const defaultMetaData: Page['MetaData'] = {
    category: '',
    product: '',
    keyword: '',
    pageType: 'Keyword',
    title: '',
    description: '',
    createdAt: now,
    updatedAt: now,
    author: '',
    language: 'en',
    market: 'us',
  };
  const defaultSearchData: Page['searchData'] = {
    state: '',
    city: '',
    metro: '',
    county: '',
    keyword: '',
    tags: [],
    contentSummary: '',
    blockTypes: [],
  };
  const defaultContentData: Page['ContentData'] = {
    ContentBlocks: [],
  };
  const defaultRelationships: Page['contentRelationships'] = {
    isHub: false,
    hubPageSlug: '',
    topicCluster: '',
    relatedHubs: [],
    spokePriority: 0,
  };
  const defaultOpenGraph: Page['seo']['openGraph'] = {
    'og:title': '',
    'og:description': '',
    'og:type': 'website',
    'og:url': '',
    'og:image': '',
    'og:image:alt': '',
    'og:site_name': '',
    'og:locale': 'en_US',
  };
  const defaultTwitterCard: Page['seo']['twitterCard'] = {
    'twitter:card': 'summary_large_image',
    'twitter:title': '',
    'twitter:description': '',
    'twitter:image': '',
    'twitter:site': '',
    'twitter:creator': '',
  };
  const defaultSeo: Page['seo'] = {
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    robots: 'index, follow',
    canonicalUrl: '',
    alternateUrls: [],
    structuredData: [],
    openGraph: defaultOpenGraph,
    twitterCard: defaultTwitterCard,
  };
  const incomingSeo = page.seo ?? defaultSeo;

  return {
    ...page,
    PageVersion: page.PageVersion || 1,
    Layout: page.Layout || 'standard',
    MetaData: { ...defaultMetaData, ...page.MetaData },
    searchData: { ...defaultSearchData, ...page.searchData },
    ContentData: { ...defaultContentData, ...page.ContentData },
    contentRelationships: { ...defaultRelationships, ...page.contentRelationships },
    seo: {
      ...defaultSeo,
      ...incomingSeo,
      openGraph: { ...defaultOpenGraph, ...incomingSeo.openGraph },
      twitterCard: { ...defaultTwitterCard, ...incomingSeo.twitterCard },
    },
    isPublished: page.isPublished ?? false,
    publishedAt: page.publishedAt ?? null,
    includeInSitemap: page.includeInSitemap ?? true,
  };
}

function splitCommaList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|-+$/g, '')
    .replace(/(^|\/)-+/g, '$1')
    .replace(/-+(\/|$)/g, '$1');
}

function encodeSlugPath(slug: string) {
  return slug.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}
