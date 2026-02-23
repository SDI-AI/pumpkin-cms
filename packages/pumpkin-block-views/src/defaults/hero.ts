export const heroDefaults = {
  root: 'relative w-full min-h-[400px] flex items-center bg-cover bg-center overflow-hidden',
  overlay: 'absolute inset-0 bg-black/40',
  container: 'relative z-10 max-w-5xl mx-auto px-6 py-16',
  headline: 'text-4xl md:text-5xl font-bold text-white leading-tight',
  subheadline: 'text-lg md:text-xl text-white/90 mt-3 max-w-2xl',
  mainImage: 'mt-8 rounded-lg shadow-xl max-w-full h-auto',
  button: 'inline-block mt-6 px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors',
};

export type HeroClassNames = Partial<typeof heroDefaults>;
