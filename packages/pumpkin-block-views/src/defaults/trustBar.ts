export const trustBarDefaults = {
  root: 'w-full py-8 bg-neutral-50 border-y border-neutral-200',
  container: 'max-w-6xl mx-auto px-6',
  grid: 'grid grid-cols-2 md:grid-cols-4 gap-6',
  item: 'flex flex-col items-center text-center',
  icon: 'w-10 h-10 mb-2',
  itemTitle: 'text-sm font-semibold text-neutral-900',
  itemText: 'text-xs text-neutral-500 mt-0.5',
};

export type TrustBarClassNames = Partial<typeof trustBarDefaults>;
