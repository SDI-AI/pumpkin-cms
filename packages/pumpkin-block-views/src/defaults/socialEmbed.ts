export const socialEmbedDefaults = {
  root: 'w-full py-12',
  container: 'max-w-6xl mx-auto px-6',
  header: 'text-center mb-8',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  grid: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
  stack: 'grid gap-6 max-w-3xl mx-auto',
  carousel: 'flex gap-5 overflow-x-auto snap-x pb-2',
  item: 'min-w-0 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm',
  itemCarousel: 'min-w-[320px] max-w-[420px] snap-start',
  embedWrapper: 'min-h-80 w-full overflow-hidden rounded-md bg-neutral-100',
  embedFrame: 'h-full min-h-80 w-full border-0',
  caption: 'mt-3 text-sm text-neutral-600',
  fallback: 'flex min-h-40 items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 text-center text-sm text-neutral-500',
  fallbackLink: 'font-semibold text-orange-600 hover:text-orange-700',
};

export type SocialEmbedClassNames = Partial<typeof socialEmbedDefaults>;
