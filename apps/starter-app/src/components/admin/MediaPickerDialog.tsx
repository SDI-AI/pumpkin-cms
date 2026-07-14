'use client';

import { useEffect, useMemo, useState } from 'react';
import NextImage from 'next/image';
import { File, Image as ImageIcon, Search, X } from 'lucide-react';
import type { MediaAsset } from 'pumpkin-ts-models';

interface MediaPickerDialogProps {
  imagesOnly?: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  title?: string;
}

export function MediaPickerDialog({
  imagesOnly = true,
  onClose,
  onSelect,
  title = 'Select Media',
}: MediaPickerDialogProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/admin/media', { cache: 'no-store' });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(data?.message || 'Unable to load media.');
        }

        const data = (await response.json()) as { assets?: MediaAsset[] };
        if (!cancelled) {
          setAssets(data.assets ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load media.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return assets
      .filter((asset) => !imagesOnly || asset.contentType?.startsWith('image/'))
      .filter((asset) => {
        if (!normalized) return true;

        return [
          asset.fileName,
          asset.originalFileName,
          asset.altText,
          asset.caption,
          asset.folder,
          ...(asset.tags ?? []),
        ].filter(Boolean).join(' ').toLowerCase().includes(normalized);
      });
  }, [assets, imagesOnly, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-4">
      <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-neutral-950">{title}</h2>
            <p className="mt-1 text-xs font-medium text-neutral-500">{filteredAssets.length} assets</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close media picker"
            title="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="border-b border-neutral-200 px-5 py-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search media"
              className="h-10 w-full rounded-md border border-neutral-300 px-3 pl-9 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
            />
          </label>
        </div>

        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-10 text-center text-sm font-medium text-neutral-500">
              Loading media...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-10 text-center text-sm font-medium text-neutral-500">
              No media found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.mediaAssetId}
                  type="button"
                  onClick={() => onSelect(asset)}
                  className="overflow-hidden rounded-lg border border-neutral-200 bg-white text-left shadow-sm transition-colors hover:border-pumpkin-300 hover:bg-pumpkin-50"
                >
                  <div className="relative flex aspect-video items-center justify-center bg-neutral-100">
                    {asset.contentType?.startsWith('image/') ? (
                      <NextImage
                        src={asset.publicUrl}
                        alt={asset.altText || asset.fileName}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <File className="h-10 w-10 text-neutral-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-pumpkin-600" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-neutral-950">{asset.fileName}</p>
                        <p className="mt-1 truncate text-xs text-neutral-500">{asset.folder || asset.contentType}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
