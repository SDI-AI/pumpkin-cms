import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { getStarterAdminPage, updateStarterAdminPage } from '@/lib/starter-admin-pages';
import type { Page } from 'pumpkin-ts-models';

interface PageRouteContext {
  params: {
    slug: string[];
  };
}

export async function GET(_request: NextRequest, { params }: PageRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const page = await getStarterAdminPage(decodeSlug(params.slug));
    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load page.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: PageRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const page = (await request.json()) as Page;
    const updated = await updateStarterAdminPage(decodeSlug(params.slug), page);
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
