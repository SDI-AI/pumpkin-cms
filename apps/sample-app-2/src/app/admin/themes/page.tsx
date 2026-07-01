import { defaultPumpkinTokens } from '@/lib/pumpkin-theme';

const tokenRows = [
  ['colorPrimary', 'Primary brand color'],
  ['colorPrimaryHover', 'Primary hover color'],
  ['colorAccent', 'Accent color'],
  ['colorBackground', 'Page background'],
  ['colorSurface', 'Card and nav surface'],
  ['colorSurfaceMuted', 'Muted section surface'],
  ['colorText', 'Main text'],
  ['colorTextMuted', 'Secondary text'],
  ['colorBorder', 'Borders'],
  ['radiusMd', 'Default radius'],
  ['shadowMd', 'Raised shadow'],
  ['maxWidth', 'Content width'],
] as const;

export default function AdminThemesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-neutral-950">Theme Studio</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
          Runtime tenant themes should change Pumpkin tokens and semantic slot presets first. Raw Tailwind strings remain available for curated classes, but arbitrary database-authored utilities will not exist after build.
        </p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tokenRows.map(([key, label]) => (
            <label key={key} className="grid gap-1.5">
              <span className="text-xs font-bold uppercase text-neutral-500">{label}</span>
              <input
                defaultValue={defaultPumpkinTokens[key]}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-black text-neutral-950">Header Slots</h3>
          <textarea
            rows={10}
            defaultValue={JSON.stringify(
              {
                root: 'pk-site-header',
                ctaButton: 'pk-button pk-button--primary',
              },
              null,
              2
            )}
            className="mt-4 w-full rounded-md border border-neutral-300 p-3 font-mono text-sm"
          />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-black text-neutral-950">Block Presets</h3>
          <textarea
            rows={10}
            defaultValue={JSON.stringify(
              {
                Hero: { root: 'pk-hero', headline: 'pk-hero__headline' },
                CardGrid: { card: 'pk-card', cardLink: 'pk-link' },
              },
              null,
              2
            )}
            className="mt-4 w-full rounded-md border border-neutral-300 p-3 font-mono text-sm"
          />
        </div>
      </section>
    </div>
  );
}
