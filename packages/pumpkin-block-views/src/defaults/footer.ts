export const footerDefaults = {
  root: 'w-full bg-neutral-900 text-neutral-300 pt-12 pb-6',
  container: 'max-w-6xl mx-auto px-6',
  topSection: 'grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-neutral-700',
  brandSection: 'md:col-span-1',
  brandLogoWrapper: 'flex items-center gap-2 mb-3',
  brandLogoIcon: 'text-2xl',
  brandLogoImage: 'h-8 w-auto',
  brandLogoText: 'text-lg font-bold text-white',
  brandDescription: 'text-sm leading-relaxed text-neutral-400',
  columnsSection: 'md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8',
  columnTitle: 'text-sm font-semibold uppercase tracking-wider text-white mb-3',
  columnList: 'space-y-2',
  columnLink: 'text-sm hover:text-orange-400 transition-colors',
  bottomBar: 'mt-8 pt-6 border-t border-neutral-700',
  bottomBarInner: 'flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500',
  copyright: '',
  builtWith: 'hover:text-orange-400 transition-colors',
};

export type FooterClassNames = Partial<typeof footerDefaults>;
