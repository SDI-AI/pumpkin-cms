export const videoDefaults = {
  root: 'w-full py-12',
  container: 'max-w-5xl mx-auto px-6',
  header: 'text-center mb-8',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  frameWrapper: 'overflow-hidden rounded-lg bg-neutral-950 shadow-sm',
  frame: 'h-full w-full border-0',
  caption: 'mt-3 text-center text-sm text-neutral-600',
  fallback: 'flex min-h-64 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 text-center text-sm text-neutral-500',
  fallbackLink: 'font-semibold text-orange-600 hover:text-orange-700',
};

export type VideoClassNames = Partial<typeof videoDefaults>;
