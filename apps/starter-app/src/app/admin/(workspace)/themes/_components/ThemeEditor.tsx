'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon } from 'lucide-react';
import type { MediaAsset, Theme } from 'pumpkin-ts-models';
import { fallbackTheme } from '@/data';
import { MediaPickerDialog } from '@/components/admin/MediaPickerDialog';

interface ThemeEditorProps {
  initialTheme: Theme;
  mode: 'create' | 'edit';
}

export function ThemeEditor({ initialTheme, mode }: ThemeEditorProps) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [advancedJson, setAdvancedJson] = useState(() => JSON.stringify(initialTheme, null, 2));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof Theme>(key: K, value: Theme[K]) => {
    setTheme((current) => syncJson({ ...current, [key]: value }));
  };

  const updateCssVariable = (key: string, value: string) => {
    setTheme((current) => syncJson({
      ...current,
      cssVariables: {
        ...current.cssVariables,
        [key]: value,
      },
      preview: {
        ...current.preview,
        primary: key === '--color-primary' ? value : current.preview.primary,
        accent: key === '--color-accent' ? value : current.preview.accent,
        background: key === '--color-background' ? value : current.preview.background,
        foreground: key === '--color-foreground' ? value : current.preview.foreground,
      },
    }));
  };

  const updateCompiledAsset = (
    key: keyof NonNullable<Theme['compiledAssets']>,
    value: string,
  ) => {
    setTheme((current) => syncJson({
      ...current,
      compiledAssets: {
        mode: 'compiled',
        ...current.compiledAssets,
        [key]: value,
      },
    }));
  };

  const clearCompiledAssets = () => {
    setTheme((current) => {
      const { compiledAssets: _compiledAssets, ...next } = current;
      return syncJson(next);
    });
  };

  const applyAdvancedJson = () => {
    setError('');
    try {
      setTheme(JSON.parse(advancedJson) as Theme);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON.');
    }
  };

  const save = async () => {
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...theme,
        id: theme.id || theme.themeId,
        themeId: theme.themeId || theme.id,
        updatedAt: new Date().toISOString(),
      };
      const url = mode === 'create'
        ? '/api/admin/themes'
        : `/api/admin/themes/${encodeURIComponent(initialTheme.themeId)}`;
      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to save theme.');
      }

      const saved = (await response.json()) as Theme;
      setTheme(syncJson(saved));
      setMessage('Theme saved.');
      router.replace(`/admin/themes/${encodeURIComponent(saved.themeId)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save theme.');
    } finally {
      setSaving(false);
    }
  };

  const syncJson = (next: Theme) => {
    setAdvancedJson(JSON.stringify(next, null, 2));
    return next;
  };

  return (
    <div className="space-y-6">
      {(message || error) && (
        <p className={[
          'rounded-md border px-3 py-2 text-sm',
          error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700',
        ].join(' ')}>
          {error || message}
        </p>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-950">Theme Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="Name" value={theme.name} onChange={(value) => update('name', value)} />
          <TextField label="Theme ID" value={theme.themeId} onChange={(value) => update('themeId', value.trim())} disabled={mode === 'edit'} />
          <TextField label="Label" value={theme.label} onChange={(value) => update('label', value)} />
          <TextField label="Category" value={theme.category} onChange={(value) => update('category', value)} />
          <TextField label="Tags" value={(theme.tags ?? []).join(', ')} onChange={(value) => update('tags', splitTags(value))} />
          <TextField label="Version" value={String(theme.version)} onChange={(value) => update('version', Number(value) || 1)} />
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-800">Description</span>
          <textarea
            value={theme.description}
            onChange={(event) => update('description', event.target.value)}
            className="mt-2 min-h-24 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-4">
          <Checkbox label="Active" checked={theme.isActive} onChange={(checked) => update('isActive', checked)} />
          <Checkbox label="System" checked={theme.isSystem} onChange={(checked) => update('isSystem', checked)} />
          <Checkbox label="Custom" checked={theme.isCustom} onChange={(checked) => update('isCustom', checked)} />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-950">Runtime CSS Variables</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(theme.cssVariables ?? {}).map(([key, value]) => (
            <label key={key} className="block">
              <span className="text-sm font-semibold text-neutral-800">{key}</span>
              <div className="mt-2 flex gap-2">
                <input
                  value={value}
                  onChange={(event) => updateCssVariable(key, event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-md border border-neutral-300 px-3 text-sm"
                />
                <span
                  className="h-10 w-10 rounded-md border border-neutral-200"
                  style={{ backgroundColor: value }}
                  title={value}
                />
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-neutral-950">Compiled Assets</h2>
          {theme.compiledAssets && (
            <button
              type="button"
              onClick={clearCompiledAssets}
              className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Clear Assets
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-800">Mode</span>
            <select
              value={theme.compiledAssets?.mode ?? 'runtime'}
              onChange={(event) => updateCompiledAsset('mode', event.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
            >
              <option value="runtime">Runtime</option>
              <option value="compiled">Compiled</option>
            </select>
          </label>
          <TextField label="CSS URL" value={theme.compiledAssets?.cssUrl ?? ''} onChange={(value) => updateCompiledAsset('cssUrl', value)} />
          <TextField label="CSS Integrity" value={theme.compiledAssets?.cssIntegrity ?? ''} onChange={(value) => updateCompiledAsset('cssIntegrity', value)} />
          <TextField label="Assets Base URL" value={theme.compiledAssets?.assetsBaseUrl ?? ''} onChange={(value) => updateCompiledAsset('assetsBaseUrl', value)} />
          <TextField label="Manifest URL" value={theme.compiledAssets?.manifestUrl ?? ''} onChange={(value) => updateCompiledAsset('manifestUrl', value)} />
          <TextField label="Package URL" value={theme.compiledAssets?.packageUrl ?? ''} onChange={(value) => updateCompiledAsset('packageUrl', value)} />
          <TextField label="Compiled At" value={theme.compiledAssets?.compiledAt ?? ''} onChange={(value) => updateCompiledAsset('compiledAt', value)} />
          <TextField label="Compiler" value={theme.compiledAssets?.compiler ?? ''} onChange={(value) => updateCompiledAsset('compiler', value)} />
          <TextField label="Content Hash" value={theme.compiledAssets?.contentHash ?? ''} onChange={(value) => updateCompiledAsset('contentHash', value)} />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-950">Typography</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="Heading Font" value={theme.typography.headingFont} onChange={(value) => update('typography', { ...theme.typography, headingFont: value })} />
          <TextField label="Body Font" value={theme.typography.bodyFont} onChange={(value) => update('typography', { ...theme.typography, bodyFont: value })} />
          <TextField label="Sans Font Stack" value={theme.typography.fontSans} onChange={(value) => update('typography', { ...theme.typography, fontSans: value })} />
          <TextField label="Serif Font Stack" value={theme.typography.fontSerif} onChange={(value) => update('typography', { ...theme.typography, fontSerif: value })} />
          <TextField label="Mono Font Stack" value={theme.typography.fontMono} onChange={(value) => update('typography', { ...theme.typography, fontMono: value })} />
          <TextField label="Base Font Size" value={theme.typography.baseFontSize} onChange={(value) => update('typography', { ...theme.typography, baseFontSize: value })} />
          <TextField label="Line Height" value={theme.typography.lineHeight} onChange={(value) => update('typography', { ...theme.typography, lineHeight: value })} />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-950">Header</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <MediaField
            label="Logo URL"
            value={theme.header.logoUrl}
            onChange={(value) => update('header', { ...theme.header, logoUrl: value })}
            onSelect={(asset) => update('header', {
              ...theme.header,
              logoUrl: asset.publicUrl,
              logoAlt: theme.header.logoAlt || mediaAlt(asset),
            })}
          />
          <TextField label="Logo Alt" value={theme.header.logoAlt} onChange={(value) => update('header', { ...theme.header, logoAlt: value })} />
          <TextField label="CTA Text" value={theme.header.ctaText} onChange={(value) => update('header', { ...theme.header, ctaText: value })} />
          <TextField label="CTA URL" value={theme.header.ctaUrl} onChange={(value) => update('header', { ...theme.header, ctaUrl: value })} />
          <label className="block">
            <span className="text-sm font-semibold text-neutral-800">CTA Target</span>
            <select
              value={theme.header.ctaTarget}
              onChange={(event) => update('header', { ...theme.header, ctaTarget: event.target.value })}
              className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
            >
              <option value="_self">Same tab</option>
              <option value="_blank">New tab</option>
            </select>
          </label>
          <div className="pt-8">
            <Checkbox label="Sticky Header" checked={theme.header.sticky} onChange={(checked) => update('header', { ...theme.header, sticky: checked })} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-950">Footer</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="Copyright" value={theme.footer.copyright} onChange={(value) => update('footer', { ...theme.footer, copyright: value })} />
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-neutral-800">Description</span>
            <textarea
              value={theme.footer.description}
              onChange={(event) => update('footer', { ...theme.footer, description: event.target.value })}
              className="mt-2 min-h-24 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-950">Spacing, Borders, Shadows</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <TextField label="Base Spacing Unit" value={theme.spacing.baseUnit} onChange={(value) => update('spacing', { ...theme.spacing, baseUnit: value })} />
          <TextField label="Border Style" value={theme.borders.style} onChange={(value) => update('borders', { ...theme.borders, style: value })} />
          <TextField
            label="Radius MD"
            value={theme.borders.radius.md || ''}
            onChange={(value) => update('borders', { ...theme.borders, radius: { ...theme.borders.radius, md: value } })}
          />
          <TextField
            label="Shadow SM"
            value={theme.shadows.scale.sm || ''}
            onChange={(value) => update('shadows', { ...theme.shadows, scale: { ...theme.shadows.scale, sm: value } })}
          />
          <TextField
            label="Shadow MD"
            value={theme.shadows.scale.md || ''}
            onChange={(value) => update('shadows', { ...theme.shadows, scale: { ...theme.shadows.scale, md: value } })}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-950">Advanced JSON</h2>
          <button
            type="button"
            onClick={applyAdvancedJson}
            className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Apply JSON
          </button>
        </div>
        <textarea
          value={advancedJson}
          onChange={(event) => setAdvancedJson(event.target.value)}
          spellCheck={false}
          className="mt-4 min-h-96 w-full rounded-md border border-neutral-300 bg-neutral-950 p-4 font-mono text-sm leading-6 text-neutral-50"
        />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center rounded-md bg-pumpkin-600 px-4 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>
    </div>
  );
}

export function createTheme(tenantId: string): Theme {
  const now = new Date().toISOString();

  return {
    id: 'new-theme',
    themeId: 'new-theme',
    tenantId,
    name: 'New Theme',
    label: 'New Theme',
    description: '',
    category: 'custom',
    tags: [],
    isActive: false,
    isSystem: false,
    isCustom: true,
    createdByUserId: '',
    version: 1,
    preview: {
      palette: ['#f97316', '#111827', '#f8fafc', '#0f766e'],
      background: '#ffffff',
      foreground: '#111827',
      primary: '#f97316',
      accent: '#0f766e',
    },
    cssVariables: {
      '--color-background': '#ffffff',
      '--color-foreground': '#111827',
      '--color-primary': '#f97316',
      '--color-accent': '#0f766e',
    },
    typography: {
      fontSans: 'Inter, ui-sans-serif, system-ui',
      fontSerif: 'Georgia, serif',
      fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      headingFont: 'Inter, ui-sans-serif, system-ui',
      bodyFont: 'Inter, ui-sans-serif, system-ui',
      baseFontSize: '16px',
      lineHeight: '1.5',
      fontWeights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    spacing: {
      baseUnit: '4px',
      scale: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
    },
    borders: {
      radius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      width: {
        thin: '1px',
        thick: '2px',
      },
      style: 'solid',
    },
    shadows: {
      scale: {
        sm: '0 1px 2px rgb(15 23 42 / 0.08)',
        md: '0 8px 24px rgb(15 23 42 / 0.10)',
      },
    },
    header: {
      ...fallbackTheme.header,
      logoUrl: '',
      logoAlt: '',
      sticky: false,
      ctaText: '',
      ctaUrl: '',
      ctaTarget: '_self',
    },
    footer: {
      ...fallbackTheme.footer,
      copyright: '',
      description: '',
    },
    blockStyles: fallbackTheme.blockStyles,
    menu: fallbackTheme.menu,
    createdAt: now,
    updatedAt: now,
  };
}

function TextField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-neutral-800">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm disabled:bg-neutral-100"
      />
    </label>
  );
}

function MediaField({
  label,
  onChange,
  onSelect,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onSelect: (asset: MediaAsset) => void;
  value: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectAsset = (asset: MediaAsset) => {
    onSelect(asset);
    setPickerOpen(false);
  };

  return (
    <div className="block">
      <span className="text-sm font-semibold text-neutral-800">{label}</span>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-md border border-neutral-300 px-3 text-sm"
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          Media
        </button>
      </div>
      {value && !isEmoji(value) && (
        <div className="mt-3 flex h-20 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 p-2">
          {/* Theme media URLs may be remote tenant assets, so this preview intentionally uses img. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Current header logo preview" className="max-h-full max-w-full object-contain" />
        </div>
      )}
      {pickerOpen && (
        <MediaPickerDialog
          onClose={() => setPickerOpen(false)}
          onSelect={selectAsset}
          title="Select header logo"
        />
      )}
    </div>
  );
}

function mediaAlt(asset: MediaAsset) {
  return asset.altText || asset.caption || asset.fileName;
}

function isEmoji(value: string) {
  return /\p{Extended_Pictographic}/u.test(value) && !/^https?:\/\//i.test(value);
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function splitTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}
