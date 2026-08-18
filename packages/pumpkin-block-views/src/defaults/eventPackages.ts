export const eventPackagesDefaults = {
  root: 'w-full py-12',
  container: 'max-w-6xl mx-auto px-6',
  header: 'text-center mb-10',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  grid: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
  compact: 'grid gap-4 max-w-4xl mx-auto',
  card: 'overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm',
  cardHighlighted: 'ring-2 ring-orange-500',
  image: 'h-52 w-full object-cover',
  body: 'p-6',
  packageName: 'text-xl font-semibold text-neutral-900',
  description: 'mt-2 text-sm leading-6 text-neutral-600',
  price: 'mt-4 text-lg font-semibold text-neutral-900',
  priceNote: 'mt-1 text-sm text-neutral-500',
  features: 'mt-5 grid gap-2 text-sm text-neutral-700',
  feature: 'flex items-start gap-2',
  cta: 'mt-6 inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800',
  empty: 'rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500',
};

export type EventPackagesClassNames = Partial<typeof eventPackagesDefaults>;
