import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { revalidatePublicPages } from '@/lib/public-page-cache';
import { getStarterAdminPage, updateStarterAdminPage } from '@/lib/starter-admin-pages';
import type { Page } from 'pumpkin-ts-models';

interface PageRouteContext {
  params: Promise<{
    slug: string[];
  }>;
}

export async function GET(_request: NextRequest, { params }: PageRouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const page = await getStarterAdminPage(decodeSlug(slug));
    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load page.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: PageRouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const page = (await request.json()) as Page;
    const { slug } = await params;
    const originalSlug = decodeSlug(slug);
    const updated = await updateStarterAdminPage(originalSlug, page);
    revalidatePublicPages(originalSlug, updated.pageSlug);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to save page.' },
      { status: 500 },
    );
  }
}

function decodeSlug(slug: string[]) {
  return slug.map((segment) => decodeURIComponent(segment)).join('/');
}
