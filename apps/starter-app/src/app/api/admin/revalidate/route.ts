import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import {
  revalidatePublicForms,
  revalidatePublicPages,
  revalidatePublicTheme,
} from '@/lib/public-page-cache';

const MAX_TARGETED_PATHS = 25;

interface RevalidateRequestBody {
  forms?: boolean;
  formType?: string;
  formTypes?: string[];
  path?: string;
  paths?: string[];
  slug?: string;
  slugs?: string[];
  theme?: boolean;
}

export async function POST(request: NextRequest) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await readBody(request);
  const paths = resolveTargetPaths(body);
  const slugs = resolveTargetSlugs(body);

  if (paths.length > MAX_TARGETED_PATHS) {
    return NextResponse.json(
      { message: `Revalidation is limited to ${MAX_TARGETED_PATHS} targeted paths per request.` },
      { status: 400 },
    );
  }

  revalidatePublicPages(...slugs);

  if (body?.theme) {
    revalidatePublicTheme();
  }

  if (body?.forms || body?.formType || body?.formTypes?.length) {
    revalidatePublicForms(body.formType, ...(body.formTypes ?? []));
  }

  return NextResponse.json({
    ok: true,
    revalidatedAt: new Date().toISOString(),
    scope: body ? 'targeted' : 'home',
    forms: Boolean(body?.forms || body?.formType || body?.formTypes?.length),
    paths,
    theme: Boolean(body?.theme),
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
  return resolveTargetSlugs(body)
    .map(slugToPath)
    .filter((path): path is string => Boolean(path));
}

function resolveTargetSlugs(body: RevalidateRequestBody | null) {
  if (!body) {
    return ['home'];
  }

  const candidates = [
    pathToSlug(body.path),
    ...(body.paths ?? []).map(pathToSlug),
    body.slug,
    ...(body.slugs ?? []),
  ];

  const slugs = candidates
    .map(normalizeSlug)
    .filter((slug): slug is string => Boolean(slug));

  return slugs.length === 0
    ? ['home']
    : Array.from(new Set(slugs)).sort();
}

function slugToPath(slug?: string) {
  if (!slug) {
    return undefined;
  }

  const normalized = slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  return normalized === 'home' ? '/' : `/${normalized}`;
}

function pathToSlug(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return undefined;
  }

  const path = trimmed.replace(/\/{2,}/g, '/').replace(/^\/+|\/+$/g, '').toLowerCase();
  return path || 'home';
}

function normalizeSlug(value?: string) {
  const normalized = value?.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  return normalized || undefined;
}
