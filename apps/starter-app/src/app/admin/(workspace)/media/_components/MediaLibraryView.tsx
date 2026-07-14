'use client';

import { useMemo, useState, useTransition } from 'react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { Copy, File, Image as ImageIcon, Search, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import type { MediaAsset } from 'pumpkin-ts-models';

interface MediaLibraryViewProps {
  assets: MediaAsset[];
}

export function MediaLibraryView({ assets }: MediaLibraryViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assets;

    return assets.filter((asset) => [
      asset.fileName,
      asset.originalFileName,
      asset.altText,
      asset.caption,
      asset.folder,
      asset.contentType,
      ...(asset.tags ?? []),
    ].filter(Boolean).join(' ').toLowerCase().includes(normalized));
  }, [assets, query]);

  const imageCount = assets.filter((asset) => asset.contentType?.startsWith('image/')).length;
  const folderCount = new Set(assets.map((asset) => asset.folder).filter(Boolean)).size;

  const uploadAsset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }

    setMessage('');
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('altText', altText);
      formData.append('caption', caption);
      formData.append('tags', tags);

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to upload media asset.');
      }

      const uploaded = (await response.json()) as MediaAsset;
      setMessage(`${uploaded.fileName} uploaded.`);
      setFile(null);
      setFolder('');
      setAltText('');
      setCaption('');
      setTags('');
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload media asset.');
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (asset: MediaAsset) => {
    setMessage('');
    setError('');
    setDeletingId(asset.mediaAssetId);

    try {
      const response = await fetch(`/api/admin/media/${encodeURIComponent(asset.mediaAssetId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to delete media asset.');
      }

      setMessage(`${asset.fileName} deleted.`);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete media asset.');
    } finally {
      setDeletingId('');
    }
  };

  const copyUrl = async (asset: MediaAsset) => {
    await navigator.clipboard.writeText(asset.publicUrl);
    setMessage(`${asset.fileName} URL copied.`);
    setError('');
  };

  return (
    <div className="space-y-5">
      {(message || error) && (
        <p className={[
          'rounded-md border px-3 py-2 text-sm',
          error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700',
        ].join(' ')}>
          {error || message}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Stat label="Assets" value={String(assets.length)} />
              <Stat label="Images" value={String(imageCount)} />
              <Stat label="Folders" value={String(folderCount)} />
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search media"
                className="h-10 w-full rounded-md border border-neutral-300 px-3 pl-9 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
              />
            </div>
          </div>
        </section>

        <form onSubmit={uploadAsset} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-neutral-950">Upload Media</h2>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-800">File</span>
              <input
                type="file"
                onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-neutral-700 file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-pumpkin-600 file:px-3 file:text-sm file:font-bold file:text-white"
              />
            </label>
            <TextField label="Folder" value={folder} onChange={setFolder} placeholder="hero" />
            <TextField label="Alt Text" value={altText} onChange={setAltText} />
            <TextField label="Caption" value={caption} onChange={setCaption} />
            <TextField label="Tags" value={tags} onChange={setTags} placeholder="home, banner" />
          </div>
          <button
            type="submit"
            disabled={uploading || isPending}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>{uploading ? 'Uploading...' : 'Upload'}</span>
          </button>
        </form>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset) => (
          <article key={asset.mediaAssetId} className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
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
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-neutral-950">{asset.fileName}</h2>
                  <p className="mt-1 truncate text-xs text-neutral-500">{asset.contentType || 'application/octet-stream'}</p>
                </div>
                <ImageIcon className="h-4 w-4 shrink-0 text-pumpkin-600" aria-hidden="true" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
                <span className="rounded-full bg-neutral-100 px-2 py-1">{formatBytes(asset.sizeBytes)}</span>
                {asset.folder && <span className="rounded-full bg-neutral-100 px-2 py-1">{asset.folder}</span>}
                {(asset.tags ?? []).slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-neutral-100 px-2 py-1">{tag}</span>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => copyUrl(asset)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteAsset(asset)}
                  disabled={deletingId === asset.mediaAssetId || isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>{deletingId === asset.mediaAssetId ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {filteredAssets.length === 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-base font-bold text-neutral-950">No media found</h2>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-neutral-100 px-3 py-2">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="text-lg font-bold text-neutral-950">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-neutral-800">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
      />
    </label>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
