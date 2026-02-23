export const localProTipsDefaults = {
  root: 'w-full py-12 bg-neutral-50',
  container: 'max-w-5xl mx-auto px-6',
  title: 'text-3xl font-bold text-neutral-900 text-center mb-10',
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  item: 'bg-white rounded-xl shadow-sm border border-neutral-200 p-5 flex gap-4',
  itemImage: 'w-16 h-16 rounded-lg object-cover shrink-0',
  itemIcon: 'text-3xl shrink-0',
  itemBody: 'flex-1',
  itemTitle: 'text-base font-semibold text-neutral-900',
  itemText: 'text-sm text-neutral-600 mt-1',
};

export type LocalProTipsClassNames = Partial<typeof localProTipsDefaults>;
