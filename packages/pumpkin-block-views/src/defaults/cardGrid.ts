export const cardGridDefaults = {
  root: 'w-full py-12',
  container: 'max-w-6xl mx-auto px-6',
  header: 'text-center mb-10',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
  card: 'bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow',
  cardImage: 'w-full h-48 object-cover',
  cardBody: 'p-5',
  cardIcon: 'text-2xl mb-2',
  cardTitle: 'text-lg font-semibold text-neutral-900',
  cardDescription: 'text-sm text-neutral-600 mt-1',
  cardLink: 'inline-block mt-3 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors',
};

export type CardGridClassNames = Partial<typeof cardGridDefaults>;
