import { revalidatePath } from 'next/cache';

export function revalidatePublicPages(...slugs: Array<string | null | undefined>) {
  const paths = new Set(
    slugs
      .map(slugToPublicPath)
      .filter((path): path is string => Boolean(path)),
  );

  for (const path of paths) {
    revalidatePath(path);
  }
}

function slugToPublicPath(slug?: string | null) {
  const normalized = slug?.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!normalized) return null;
  return normalized === 'home' ? '/' : `/${normalized}`;
}
