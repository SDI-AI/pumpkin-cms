import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';

const MAX_TARGETED_PATHS = 25;

interface RevalidateRequestBody {
  path?: string;
  paths?: string[];
  slug?: string;
  slugs?: string[];
}

export async function POST(request: NextRequest) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await readBody(request);
  const paths = resolveTargetPaths(body);

  if (paths.length > MAX_TARGETED_PATHS) {
    return NextResponse.json(
      { message: `Revalidation is limited to ${MAX_TARGETED_PATHS} targeted paths per request.` },
      { status: 400 },
    );
  }

  revalidatePath('/', 'layout');
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    ok: true,
    revalidatedAt: new Date().toISOString(),
    scope: body ? 'targeted' : 'home',
    paths,
  });
}

async function readBody(request: NextRequest): Promise<RevalidateRequestBody | null> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return await request.json().catch(() => null) as RevalidateRequestBody | null;
}

function resolveTargetPaths(body: RevalidateRequestBody | null) {
  if (!body) {
    return ['/'];
  }

  const candidates = [
    body.path,
    ...(body.paths ?? []),
    slugToPath(body.slug),
    ...(body.slugs ?? []).map(slugToPath),
  ];

  const paths = candidates
    .map(normalizePath)
    .filter((path): path is string => Boolean(path));

  return paths.length === 0
    ? ['/']
    : Array.from(new Set(paths)).sort();
}

function slugToPath(slug?: string) {
  if (!slug) {
    return undefined;
  }

  return slug.trim().toLowerCase() === 'home' ? '/' : slug;
}

function normalizePath(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return undefined;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return path.replace(/\/{2,}/g, '/').replace(/\/+$/g, '') || '/';
}
