export const primaryCtaDefaults = {
  root: 'relative w-full bg-cover bg-center overflow-hidden',
  overlay: 'absolute inset-0 bg-black/50',
  container: 'relative z-10 max-w-4xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-10',
  textWrapper: 'flex-1 text-center md:text-left',
  title: 'text-3xl md:text-4xl font-bold text-white',
  description: 'text-lg text-white/90 mt-3',
  button: 'inline-block mt-6 px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors',
  secondaryWrapper: 'mt-4 text-sm text-white/80',
  secondaryLink: 'underline hover:text-white transition-colors',
  mainImage: 'flex-shrink-0 rounded-lg shadow-xl max-w-xs h-auto',
};

export type PrimaryCtaClassNames = Partial<typeof primaryCtaDefaults>;
