import { NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { getStarterAdminFormEntries } from '@/lib/starter-admin-forms';

export async function GET(request: Request) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const type = new URL(request.url).searchParams.get('type') || undefined;
    const entries = await getStarterAdminFormEntries(type);
    return NextResponse.json({ entries, count: entries.length });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load form entries.' },
      { status: 500 },
    );
  }
}
