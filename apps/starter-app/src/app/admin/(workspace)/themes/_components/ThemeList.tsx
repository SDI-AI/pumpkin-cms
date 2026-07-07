'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Palette, Search } from 'lucide-react';
import type { Theme } from 'pumpkin-ts-models';

interface ThemeListProps {
  themes: Theme[];
}

export function ThemeList({ themes }: ThemeListProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activatingId, setActivatingId] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = themes
    .filter((theme) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return true;

      return [
        theme.name,
        theme.label,
        theme.themeId,
        theme.category,
        theme.description,
        ...(theme.tags ?? []),
      ].filter(Boolean).join(' ').toLowerCase().includes(normalized);
    })
    .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name));

  const activate = async (theme: Theme) => {
    setMessage('');
    setError('');
    setActivatingId(theme.themeId);

    try {
      const response = await fetch(`/api/admin/themes/${encodeURIComponent(theme.themeId)}/activate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to activate theme.');
      }

      setMessage(`${theme.name} activated.`);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to activate theme.');
    } finally {
      setActivatingId('');
    }
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

      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search themes"
              className="h-10 w-full rounded-md border border-neutral-300 px-3 pl-9 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
            />
          </div>
          <Link
            href="/admin/themes/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700"
          >
            <Palette className="h-4 w-4" aria-hidden="true" />
            <span>New Theme</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((theme) => (
          <article key={theme.themeId} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-950">{theme.name}</h2>
                  {theme.isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-600">{theme.description || theme.label}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {(theme.preview?.palette ?? []).slice(0, 5).map((color) => (
                  <span
                    key={color}
                    className="h-5 w-5 rounded-full border border-neutral-200"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600">
              <span className="rounded-full bg-neutral-100 px-2 py-1">{theme.category || 'uncategorized'}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-1">v{theme.version}</span>
              {theme.isSystem && <span className="rounded-full bg-neutral-100 px-2 py-1">system</span>}
              {theme.isCustom && <span className="rounded-full bg-neutral-100 px-2 py-1">custom</span>}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Link
                href={`/admin/themes/${encodeURIComponent(theme.themeId)}`}
                className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => activate(theme)}
                disabled={theme.isActive || activatingId === theme.themeId || isPending}
                className="inline-flex h-9 items-center rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activatingId === theme.themeId ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-base font-bold text-neutral-950">No themes found</h2>
          <p className="mt-2 text-sm text-neutral-600">Create or install a theme for this starter deployment.</p>
        </div>
      )}
    </div>
  );
}
