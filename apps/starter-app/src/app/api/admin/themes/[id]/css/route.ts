import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { getStarterAdminThemeCss, publishStarterAdminThemeCss } from '@/lib/starter-admin-themes';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    return NextResponse.json(await getStarterAdminThemeCss(id));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load theme CSS.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as { css?: string; note?: string };
    const { id } = await params;
    const result = await publishStarterAdminThemeCss(id, body.css ?? '', body.note ?? '');
    revalidatePath('/', 'layout');
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to publish theme CSS.' },
      { status: 500 },
    );
  }
}
