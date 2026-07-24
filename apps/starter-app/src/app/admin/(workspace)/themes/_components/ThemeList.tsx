'use client';

import { ChangeEvent, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Download, Palette, Search, Upload } from 'lucide-react';
import type { Theme } from 'pumpkin-ts-models';
import { createTheme } from '@/lib/theme-factory';

interface ThemeListProps {
  themes: Theme[];
  tenantId: string;
  activeThemeId?: string;
}

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  palette: string[];
  cssVariables: Record<string, string>;
  tags: string[];
}

const themePresets: ThemePreset[] = [
  {
    id: 'pumpkin-classic',
    name: 'Pumpkin Classic',
    description: 'Warm editorial defaults with pumpkin accents and neutral content surfaces.',
    category: 'starter',
    palette: ['#f97316', '#171717', '#ffffff', '#15803d'],
    cssVariables: {
      '--color-background': '#ffffff',
      '--color-foreground': '#171717',
      '--color-primary': '#f97316',
      '--color-accent': '#15803d',
    },
    tags: ['starter', 'warm', 'default'],
  },
  {
    id: 'field-notes',
    name: 'Field Notes',
    description: 'Clean local-service styling with green accents and high-contrast text.',
    category: 'starter',
    palette: ['#166534', '#1f2937', '#f8fafc', '#ca8a04'],
    cssVariables: {
      '--color-background': '#f8fafc',
      '--color-foreground': '#1f2937',
      '--color-primary': '#166534',
      '--color-accent': '#ca8a04',
    },
    tags: ['service', 'green', 'local'],
  },
  {
    id: 'studio-light',
    name: 'Studio Light',
    description: 'Simple portfolio/product style with blue primary actions and quiet surfaces.',
    category: 'starter',
    palette: ['#2563eb', '#111827', '#f9fafb', '#db2777'],
    cssVariables: {
      '--color-background': '#f9fafb',
      '--color-foreground': '#111827',
      '--color-primary': '#2563eb',
      '--color-accent': '#db2777',
    },
    tags: ['studio', 'product', 'light'],
  },
];

export function ThemeList({ themes, tenantId, activeThemeId }: ThemeListProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activatingId, setActivatingId] = useState('');
  const [installingId, setInstallingId] = useState('');
  const [installingPackage, setInstallingPackage] = useState(false);
  const [isPending, startTransition] = useTransition();
  const packageInputRef = useRef<HTMLInputElement>(null);
  const installedThemeIds = new Set(themes.map((theme) => theme.themeId));
  const resolvedActiveThemeId = activeThemeId || themes.find((theme) => theme.isActive)?.themeId || '';

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
    .sort((a, b) =>
      Number(b.themeId === resolvedActiveThemeId) - Number(a.themeId === resolvedActiveThemeId) ||
      a.name.localeCompare(b.name),
    );

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

  const installPreset = async (preset: ThemePreset) => {
    setMessage('');
    setError('');
    setInstallingId(preset.id);

    try {
      const theme = createThemeFromPreset(tenantId, preset);
      const response = await fetch('/api/admin/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to install theme.');
      }

      setMessage(`${preset.name} installed.`);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to install theme.');
    } finally {
      setInstallingId('');
    }
  };

  const installPackage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage('');
    setError('');
    setInstallingPackage(true);

    try {
      const formData = new FormData();
      formData.append('package', file);

      const response = await fetch('/api/admin/themes/install', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to install theme package.');
      }

      const result = (await response.json()) as { theme?: Theme; created?: boolean };
      const themeName = result.theme?.name || result.theme?.themeId || file.name;
      setMessage(`${themeName} ${result.created ? 'installed' : 'updated'}.`);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to install theme package.');
    } finally {
      setInstallingPackage(false);
      event.target.value = '';
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

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-950">Install Theme Presets</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Install a prebuilt runtime theme document, then edit tokens, header, footer, and JSON.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={packageInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={installPackage}
            />
            <button
              type="button"
              onClick={() => packageInputRef.current?.click()}
              disabled={installingPackage || isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-bold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{installingPackage ? 'Installing...' : 'Install Package'}</span>
            </button>
            <Link
              href="/admin/themes/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-bold text-neutral-800 hover:bg-neutral-50"
            >
              <Palette className="h-4 w-4" aria-hidden="true" />
              <span>Custom Theme</span>
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {themePresets.map((preset) => {
            const installed = installedThemeIds.has(preset.id);

            return (
              <article key={preset.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-950">{preset.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-neutral-600">{preset.description}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {preset.palette.map((color) => (
                      <span
                        key={color}
                        className="h-5 w-5 rounded-full border border-neutral-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => installPreset(preset)}
                  disabled={installed || installingId === preset.id || isPending}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>{installed ? 'Installed' : installingId === preset.id ? 'Installing...' : 'Install'}</span>
                </button>
              </article>
            );
          })}
        </div>
      </section>

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
          <ThemeCard
            key={theme.themeId}
            theme={theme}
            isActive={theme.themeId === resolvedActiveThemeId}
            activatingId={activatingId}
            isPending={isPending}
            onActivate={activate}
          />
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

function ThemeCard({
  theme,
  isActive,
  activatingId,
  isPending,
  onActivate,
}: {
  theme: Theme;
  isActive: boolean;
  activatingId: string;
  isPending: boolean;
  onActivate: (theme: Theme) => void;
}) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-neutral-950">{theme.name}</h2>
            {isActive && (
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
          onClick={() => onActivate(theme)}
          disabled={isActive || activatingId === theme.themeId || isPending}
          className="inline-flex h-9 items-center rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {activatingId === theme.themeId ? 'Activating...' : 'Activate'}
        </button>
      </div>
    </article>
  );
}

function createThemeFromPreset(tenantId: string, preset: ThemePreset): Theme {
  const theme = createTheme(tenantId);
  const now = new Date().toISOString();

  return {
    ...theme,
    id: preset.id,
    themeId: preset.id,
    name: preset.name,
    label: preset.name,
    description: preset.description,
    category: preset.category,
    tags: preset.tags,
    isCustom: true,
    isSystem: false,
    version: 1,
    preview: {
      ...theme.preview,
      palette: preset.palette,
      background: preset.cssVariables['--color-background'],
      foreground: preset.cssVariables['--color-foreground'],
      primary: preset.cssVariables['--color-primary'],
      accent: preset.cssVariables['--color-accent'],
    },
    cssVariables: {
      ...theme.cssVariables,
      ...preset.cssVariables,
    },
    createdAt: now,
    updatedAt: now,
  };
}
