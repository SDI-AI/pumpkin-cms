import { NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { getStarterAdminPages } from '@/lib/starter-admin-pages';

export async function GET() {
  if (!isStarterAdminAuthenticated()) {
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
