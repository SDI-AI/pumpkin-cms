export const breadcrumbsDefaults = {
  root: 'w-full py-3',
  container: 'max-w-6xl mx-auto px-6',
  list: 'flex items-center flex-wrap gap-1 text-sm',
  item: 'text-neutral-500 hover:text-neutral-800 transition-colors',
  itemCurrent: 'text-neutral-900 font-medium',
  separator: 'text-neutral-400 mx-1',
  link: 'hover:underline',
};

export type BreadcrumbsClassNames = Partial<typeof breadcrumbsDefaults>;
