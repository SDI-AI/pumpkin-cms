'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { History, Image as ImageIcon, RotateCcw, Upload } from 'lucide-react';
import type { MediaAsset, Theme, ThemeCustomCss } from 'pumpkin-ts-models';
import { fallbackTheme } from '@/data';
import { MediaPickerDialog } from '@/components/admin/MediaPickerDialog';
import { PageLinkField } from '@/components/admin/PageLinkField';
import { getThemeStylesheet } from '@/themes/registry';

interface ThemeEditorProps {
  initialTheme: Theme;
  mode: 'create' | 'edit';
}

interface ThemeCssResponse {
  css: string;
  customCss: ThemeCustomCss;
  theme?: Theme;
}

export function ThemeEditor({ initialTheme, mode }: ThemeEditorProps) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [advancedJson, setAdvancedJson] = useState(() => JSON.stringify(initialTheme, null, 2));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cssDraft, setCssDraft] = useState('');
  const [publishedCss, setPublishedCss] = useState('');
  const [cssNote, setCssNote] = useState('');
  const [cssLoading, setCssLoading] = useState(mode === 'edit');
  const [cssPublishing, setCssPublishing] = useState(false);
  const [cssMessage, setCssMessage] = useState('');
  const [cssError, setCssError] = useState('');

  useEffect(() => {
    if (mode !== 'edit') return;
    let active = true;
    void fetch(`/api/admin/themes/${encodeURIComponent(initialTheme.themeId)}/css`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null) as ThemeCssResponse | { message?: string } | null;
        if (!response.ok || !data || !('css' in data)) {
          throw new Error(data && 'message' in data ? data.message : 'Unable to load custom CSS.');
        }
        if (!active) return;
        setCssDraft(data.css);
        setPublishedCss(data.css);
        setTheme((current) => {
          const next = { ...current, customCss: data.customCss };
          setAdvancedJson(JSON.stringify(next, null, 2));
          return next;
        });
      })
      .catch((loadError) => {
        if (active) setCssError(loadError instanceof Error ? loadError.message : 'Unable to load custom CSS.');
      })
      .finally(() => {
        if (active) setCssLoading(false);
      });
    return () => { active = false; };
  }, [initialTheme.themeId, mode]);

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

  const applyCssResponse = (data: ThemeCssResponse) => {
    setCssDraft(data.css);
    setPublishedCss(data.css);
    setTheme((current) => syncJson(data.theme ?? { ...current, customCss: data.customCss }));
  };

  const publishCss = async () => {
    if (mode !== 'edit') return;
    setCssPublishing(true);
    setCssMessage('');
    setCssError('');
    try {
      const response = await fetch(`/api/admin/themes/${encodeURIComponent(initialTheme.themeId)}/css`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ css: cssDraft, note: cssNote }),
      });
      const data = await response.json().catch(() => null) as ThemeCssResponse | { message?: string } | null;
      if (!response.ok || !data || !('css' in data)) {
        throw new Error(data && 'message' in data ? data.message : 'Unable to publish custom CSS.');
      }
      applyCssResponse(data);
      setCssNote('');
      setCssMessage('Custom CSS published. The previous version remains available below.');
      router.refresh();
    } catch (publishError) {
      setCssError(publishError instanceof Error ? publishError.message : 'Unable to publish custom CSS.');
    } finally {
      setCssPublishing(false);
    }
  };

  const activateCssRevision = async (revisionId: string) => {
    if (cssDraft !== publishedCss && !window.confirm('Discard the unpublished CSS draft and activate this version?')) return;
    setCssPublishing(true);
    setCssMessage('');
    setCssError('');
    try {
      const response = await fetch(
        `/api/admin/themes/${encodeURIComponent(initialTheme.themeId)}/css/${encodeURIComponent(revisionId)}/activate`,
        { method: 'POST' },
      );
      const data = await response.json().catch(() => null) as ThemeCssResponse | { message?: string } | null;
      if (!response.ok || !data || !('css' in data)) {
        throw new Error(data && 'message' in data ? data.message : 'Unable to activate CSS revision.');
      }
      applyCssResponse(data);
      setCssMessage(revisionId === 'original' ? 'Original theme CSS restored.' : 'CSS revision activated.');
      router.refresh();
    } catch (activateError) {
      setCssError(activateError instanceof Error ? activateError.message : 'Unable to activate CSS revision.');
    } finally {
      setCssPublishing(false);
    }
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-950">Custom CSS</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
              Overrides load after the original theme stylesheet. Publishing creates an immutable version so you can restore any prior revision or return to the untouched original.
            </p>
          </div>
          <span className={[
            'w-fit rounded-full px-2.5 py-1 text-xs font-bold',
            cssDraft !== publishedCss ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
          ].join(' ')}>
            {cssDraft !== publishedCss ? 'Unpublished draft' : 'Published'}
          </span>
        </div>

        {(cssMessage || cssError) && (
          <p className={[
            'mt-4 rounded-md border px-3 py-2 text-sm',
            cssError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700',
          ].join(' ')}>{cssError || cssMessage}</p>
        )}

        {mode === 'create' ? (
          <p className="mt-4 rounded-md bg-neutral-50 p-4 text-sm text-neutral-600">Save the new theme before publishing custom CSS.</p>
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]">
            <div className="min-w-0">
              <label className="block">
                <span className="text-sm font-semibold text-neutral-800">CSS overrides</span>
                <textarea
                  value={cssDraft}
                  onChange={(event) => setCssDraft(event.target.value)}
                  disabled={cssLoading || cssPublishing}
                  spellCheck={false}
                  placeholder={":root {\n  --pk-color-primary: #ea580c;\n}\n\n.pk-hero__headline {\n  letter-spacing: -0.03em;\n}"}
                  className="mt-2 min-h-[30rem] w-full rounded-md border border-neutral-300 bg-neutral-950 p-4 font-mono text-sm leading-6 text-neutral-50 outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100 disabled:opacity-60"
                />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <TextField label="Revision note" value={cssNote} onChange={setCssNote} />
                <button
                  type="button"
                  onClick={publishCss}
                  disabled={cssLoading || cssPublishing || cssDraft === publishedCss}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-pumpkin-600 px-4 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {cssPublishing ? 'Publishing…' : 'Publish CSS'}
                </button>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Maximum 256 KB. Imports, script-like values, and unsafe legacy CSS constructs are rejected.</p>
            </div>

            <div className="min-w-0 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Live preview</h3>
                <p className="mt-1 text-xs text-neutral-500">The draft is isolated in a preview frame and does not affect the live site until published.</p>
                <ThemeCssPreview baseCssHref={getThemeStylesheet(theme).href} css={cssDraft} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-pumpkin-600" />
                  <h3 className="text-sm font-bold text-neutral-900">Version history</h3>
                </div>
                <div className="mt-3 overflow-hidden rounded-md border border-neutral-200">
                  <CssHistoryRow
                    title="Original theme"
                    detail="No custom CSS overrides"
                    active={!theme.customCss?.activeRevisionId}
                    disabled={cssPublishing}
                    onActivate={() => activateCssRevision('original')}
                  />
                  {[...(theme.customCss?.revisions ?? [])].sort((left, right) => right.version - left.version).map((revision) => (
                    <CssHistoryRow
                      key={revision.revisionId}
                      title={`Version ${revision.version}`}
                      detail={[revision.note, formatDateTime(revision.createdAt)].filter(Boolean).join(' · ')}
                      active={theme.customCss?.activeRevisionId === revision.revisionId}
                      disabled={cssPublishing}
                      onActivate={() => activateCssRevision(revision.revisionId)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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
          <PageLinkField label="CTA URL or page" value={theme.header.ctaUrl} onChange={(value) => update('header', { ...theme.header, ctaUrl: value })} />
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

function ThemeCssPreview({ baseCssHref, css }: { baseCssHref: string; css: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const document = frameRef.current?.contentDocument;
    if (!document) return;

    document.open();
    document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>');
    document.close();

    const structure = document.createElement('style');
    structure.textContent = 'body{margin:0}.preview-shell{min-height:100vh}.preview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.preview-grid .pk-card-grid__card{min-width:0}@media(max-width:480px){.preview-grid{grid-template-columns:1fr}}';
    document.head.appendChild(structure);

    const base = document.createElement('link');
    base.rel = 'stylesheet';
    base.href = baseCssHref;
    document.head.appendChild(base);

    const draft = document.createElement('style');
    draft.dataset.themeDraft = 'true';
    draft.textContent = css;
    document.head.appendChild(draft);

    document.body.innerHTML = '<div class="preview-shell"><header class="pk-header"><div class="pk-header__container"><span class="pk-header__logo-text">Theme preview</span><a class="pk-header__cta" href="#">Get started</a></div></header><section class="pk-hero"><div class="pk-hero__container"><div><p class="pk-hero__eyebrow">Custom CSS</p><h1 class="pk-hero__headline">See changes before publishing</h1><p class="pk-hero__subheadline">Edit variables, typography, spacing, and component selectors.</p><a class="pk-hero__button" href="#">Preview button</a></div></div></section><section class="pk-card-grid"><div class="pk-card-grid__container"><div class="preview-grid"><article class="pk-card-grid__card"><div class="pk-card-grid__card-body"><h2 class="pk-card-grid__card-title">Example card</h2><p class="pk-card-grid__card-description">A compact component for checking borders, colors, type, and shadows.</p></div></article><article class="pk-card-grid__card"><div class="pk-card-grid__card-body"><h2 class="pk-card-grid__card-title">Second card</h2><p class="pk-card-grid__card-description">Published CSS loads after the original stylesheet.</p></div></article></div></div></section></div>';
  }, [baseCssHref, css]);

  return (
    <iframe
      ref={frameRef}
      title="Custom CSS live preview"
      sandbox="allow-same-origin"
      className="mt-3 h-[32rem] w-full rounded-md border border-neutral-300 bg-white"
    />
  );
}

function CssHistoryRow({
  active,
  detail,
  disabled,
  onActivate,
  title,
}: {
  active: boolean;
  detail: string;
  disabled: boolean;
  onActivate: () => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-white px-3 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-neutral-900">{title}</p>
          {active && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">Active</span>}
        </div>
        <p className="mt-1 truncate text-xs text-neutral-500">{detail}</p>
      </div>
      {!active && (
        <button
          type="button"
          onClick={onActivate}
          disabled={disabled}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 px-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restore
        </button>
      )}
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
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
