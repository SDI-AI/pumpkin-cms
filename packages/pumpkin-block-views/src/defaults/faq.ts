export const faqDefaults = {
  root: 'w-full py-12',
  container: 'max-w-3xl mx-auto px-6',
  header: 'text-center mb-10',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  list: 'space-y-4',
  item: 'border border-neutral-200 rounded-lg overflow-hidden',
  question: 'w-full flex items-center justify-between px-5 py-4 text-left font-medium text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer',
  questionIcon: 'ml-3 text-neutral-400 shrink-0 transition-transform',
  answer: 'px-5 pb-4 text-sm text-neutral-600 leading-relaxed',
};

export type FaqClassNames = Partial<typeof faqDefaults>;
