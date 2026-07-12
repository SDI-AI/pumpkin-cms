export const hubSpokesDefaults = {
  root: 'w-full py-12',
  container: 'max-w-6xl mx-auto px-6',
  header: 'mb-8',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'mt-2 max-w-3xl text-base text-neutral-600',
  grid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
  list: 'divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white',
  card: 'rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
  listItem: 'block p-5 transition-colors hover:bg-neutral-50',
  compactItem: 'inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:border-orange-300 hover:text-orange-700',
  itemTitle: 'text-base font-bold text-neutral-950',
  itemDescription: 'mt-2 text-sm leading-6 text-neutral-600',
  itemMeta: 'mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500',
  itemLink: 'mt-4 inline-flex text-sm font-semibold text-orange-600 hover:text-orange-700',
  empty: 'rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500',
};

export type HubSpokesClassNames = Partial<typeof hubSpokesDefaults>;
