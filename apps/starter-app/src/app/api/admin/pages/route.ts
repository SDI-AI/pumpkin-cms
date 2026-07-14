import { NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { revalidatePublicPages } from '@/lib/public-page-cache';
import { createStarterAdminPage, getStarterAdminPages } from '@/lib/starter-admin-pages';
import type { Page } from 'pumpkin-ts-models';

export async function GET() {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await getStarterAdminPages();
    return NextResponse.json({
      ...result,
      count: result.pages.length,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load pages.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const page = (await request.json()) as Page;
    const created = await createStarterAdminPage(page);
    revalidatePublicPages(created.pageSlug);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to create page.' },
      { status: 500 },
    );
  }
}
