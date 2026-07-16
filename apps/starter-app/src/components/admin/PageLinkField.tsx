'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Page } from 'pumpkin-ts-models';

export interface PageLinkOption {
  pageSlug: string;
  title: string;
  isPublished: boolean;
}

interface PageLinkFieldProps {
  label: string;
  onChange: (value: string) => void;
  pages?: PageLinkOption[];
  placeholder?: string;
  value: string;
  valueFormat?: 'url' | 'slug';
}

let pageOptionsRequest: Promise<PageLinkOption[]> | null = null;

export function PageLinkField({
  label,
  onChange,
  pages,
  placeholder = 'Enter a URL or choose a page',
  value,
  valueFormat = 'url',
}: PageLinkFieldProps) {
  const [loadedPages, setLoadedPages] = useState<PageLinkOption[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (pages) return;

    let active = true;
    void loadPageOptions()
      .then((options) => {
        if (active) setLoadedPages(options);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, [pages]);

  const options = useMemo(
    () => [...(pages ?? loadedPages)].sort((left, right) => left.title.localeCompare(right.title)),
    [loadedPages, pages],
  );
  const selectedValue = options
    .map((page) => formatPageValue(page.pageSlug, valueFormat))
    .find((pageValue) => pageValue === value) ?? '';
  const selectedPage = options.find((page) => formatPageValue(page.pageSlug, valueFormat) === value);

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      <div className="grid gap-2">
        <input
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
        />
        <select
          aria-label={`Choose ${label} from tenant pages`}
          value={selectedValue}
          onChange={(event) => event.target.value && onChange(event.target.value)}
          className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
        >
          <option value="">{loadFailed ? 'Page lookup unavailable' : 'Choose a page…'}</option>
          {options.map((page) => {
            const pageValue = formatPageValue(page.pageSlug, valueFormat);
            return (
              <option key={page.pageSlug} value={pageValue}>
                {page.title || page.pageSlug} — {pageValue}{page.isPublished ? '' : ' (draft)'}
              </option>
            );
          })}
        </select>
      </div>
      {selectedPage && !selectedPage.isPublished && (
        <span className="mt-1 block text-xs font-semibold text-amber-700">Destination is currently a draft.</span>
      )}
    </label>
  );
}

export function formatPageValue(pageSlug: string, valueFormat: 'url' | 'slug' = 'url') {
  const slug = pageSlug.trim().replace(/^\/+|\/+$/g, '') || 'home';
  if (valueFormat === 'slug') return slug;
  return slug === 'home' ? '/' : `/${slug}`;
}

async function loadPageOptions() {
  if (!pageOptionsRequest) {
    pageOptionsRequest = fetch('/api/admin/pages', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load tenant pages.');
        const data = await response.json() as { pages?: Page[] };
        return (data.pages ?? []).map((page) => ({
          pageSlug: page.pageSlug,
          title: page.MetaData?.title || page.pageSlug,
          isPublished: page.isPublished,
        }));
      })
      .catch((error) => {
        pageOptionsRequest = null;
        throw error;
      });
  }
  return pageOptionsRequest;
}
