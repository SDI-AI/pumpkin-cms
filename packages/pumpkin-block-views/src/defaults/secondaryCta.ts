export const secondaryCtaDefaults = {
  root: 'w-full bg-neutral-100 py-12',
  container: 'max-w-3xl mx-auto px-6 text-center',
  title: 'text-2xl md:text-3xl font-bold text-neutral-900',
  description: 'text-base text-neutral-600 mt-3 max-w-xl mx-auto',
  button: 'inline-block mt-6 px-6 py-2.5 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors',
};

export type SecondaryCtaClassNames = Partial<typeof secondaryCtaDefaults>;
