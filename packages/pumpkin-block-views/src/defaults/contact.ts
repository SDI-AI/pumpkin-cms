export const contactDefaults = {
  root: 'w-full py-12',
  container: 'max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10',
  infoSection: 'space-y-5',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600',
  infoItem: 'flex items-start gap-3',
  infoLabel: 'text-sm font-semibold text-neutral-900',
  infoValue: 'text-sm text-neutral-600',
  socialLinks: 'flex gap-3 mt-4',
  socialLink: 'w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 hover:bg-orange-500 hover:text-white transition-colors',
  form: 'space-y-4',
  fieldWrapper: '',
  fieldLabel: 'block text-sm font-medium text-neutral-700 mb-1',
  fieldInput: 'w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400',
  fieldTextarea: 'w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 min-h-[100px]',
  submitButton: 'w-full px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors',
};

export type ContactClassNames = Partial<typeof contactDefaults>;
