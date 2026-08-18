export const socialLinksDefaults = {
  root: 'w-full py-10',
  container: 'max-w-6xl mx-auto px-6',
  header: 'text-center mb-6',
  title: 'text-2xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  list: 'flex flex-wrap items-center justify-center gap-3',
  listGrid: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4',
  listStack: 'grid gap-3 max-w-xl mx-auto',
  link: 'inline-flex items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 shadow-sm hover:border-neutral-300 hover:bg-neutral-50',
  icon: 'text-neutral-700',
  label: 'truncate',
  empty: 'rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500',
};

export type SocialLinksClassNames = Partial<typeof socialLinksDefaults>;
