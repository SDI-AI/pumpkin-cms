export const howItWorksDefaults = {
  root: 'w-full py-12',
  container: 'max-w-5xl mx-auto px-6',
  title: 'text-3xl font-bold text-neutral-900 text-center mb-10',
  steps: 'grid grid-cols-1 md:grid-cols-3 gap-8',
  step: 'flex flex-col items-center text-center',
  stepImage: 'w-20 h-20 rounded-full object-cover mb-4',
  stepNumber: 'w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center mb-3',
  stepTitle: 'text-lg font-semibold text-neutral-900',
  stepText: 'text-sm text-neutral-600 mt-1',
};

export type HowItWorksClassNames = Partial<typeof howItWorksDefaults>;
