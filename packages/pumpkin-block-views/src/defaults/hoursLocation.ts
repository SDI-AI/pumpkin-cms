export const hoursLocationDefaults = {
  root: 'w-full py-12',
  container: 'max-w-6xl mx-auto px-6',
  header: 'text-center mb-10',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  content: 'grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start',
  details: 'grid gap-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm',
  detailGroup: 'grid gap-2',
  detailLabel: 'text-xs font-semibold uppercase tracking-wide text-neutral-500',
  detailValue: 'text-base text-neutral-800',
  address: 'not-italic text-base leading-7 text-neutral-800',
  hoursList: 'grid gap-2',
  hoursItem: 'flex items-start justify-between gap-4 border-b border-neutral-100 pb-2 text-sm last:border-0 last:pb-0',
  hoursLabel: 'font-semibold text-neutral-800',
  hoursValue: 'text-right text-neutral-600',
  actions: 'flex flex-wrap gap-3',
  cta: 'inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800',
  mapWrapper: 'min-h-80 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 shadow-sm',
  mapIframe: 'h-full min-h-80 w-full border-0',
};

export type HoursLocationClassNames = Partial<typeof hoursLocationDefaults>;
