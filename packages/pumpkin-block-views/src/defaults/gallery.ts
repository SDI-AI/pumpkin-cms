export const galleryDefaults = {
  root: 'w-full py-12',
  container: 'max-w-6xl mx-auto px-6',
  header: 'text-center mb-10',
  title: 'text-3xl font-bold text-neutral-900',
  subtitle: 'text-base text-neutral-600 mt-2',
  grid: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
  imageWrapper: 'relative rounded-lg overflow-hidden shadow-sm group cursor-pointer',
  image: 'w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300',
  caption: 'absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity',
};

export type GalleryClassNames = Partial<typeof galleryDefaults>;
