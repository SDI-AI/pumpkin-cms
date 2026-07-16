import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { activateStarterAdminThemeCssRevision } from '@/lib/starter-admin-themes';

interface RouteContext {
  params: Promise<{ id: string; revisionId: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, revisionId } = await params;
    const result = await activateStarterAdminThemeCssRevision(id, revisionId);
    revalidatePath('/', 'layout');
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to activate CSS revision.' },
      { status: 500 },
    );
  }
}
