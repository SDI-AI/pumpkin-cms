export const testimonialsDefaults = {
  root: 'w-full py-12 bg-neutral-50',
  container: 'max-w-5xl mx-auto px-6',
  header: 'text-center mb-10',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  card: 'bg-white rounded-xl shadow-sm border border-neutral-200 p-6',
  quote: 'text-sm text-neutral-700 italic leading-relaxed',
  stars: 'flex gap-0.5 mt-3',
  star: 'w-4 h-4 text-amber-400',
  starEmpty: 'w-4 h-4 text-neutral-300',
  author: 'mt-4 text-sm font-semibold text-neutral-900',
  eventType: 'text-xs text-neutral-500',
};

export type TestimonialsClassNames = Partial<typeof testimonialsDefaults>;
