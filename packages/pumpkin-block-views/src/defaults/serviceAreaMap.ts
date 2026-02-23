export const serviceAreaMapDefaults = {
  root: 'w-full py-12',
  container: 'max-w-5xl mx-auto px-6',
  header: 'text-center mb-8',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  mapWrapper: 'w-full rounded-xl overflow-hidden shadow-md border border-neutral-200',
  mapIframe: 'w-full h-80 md:h-[450px] border-0',
  lists: 'mt-8 grid grid-cols-1 md:grid-cols-3 gap-6',
  listSection: '',
  listTitle: 'text-sm font-bold uppercase tracking-wider text-neutral-500 mb-2',
  listItems: 'flex flex-wrap gap-2',
  listItem: 'text-sm bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full',
};

export type ServiceAreaMapClassNames = Partial<typeof serviceAreaMapDefaults>;
