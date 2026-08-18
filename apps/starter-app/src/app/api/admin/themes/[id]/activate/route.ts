import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { revalidatePublicTheme } from '@/lib/public-page-cache';
import { activateStarterAdminTheme } from '@/lib/starter-admin-themes';

interface ActivateThemeRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(_request: NextRequest, { params }: ActivateThemeRouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const theme = await activateStarterAdminTheme(id);
    revalidatePublicTheme();
    return NextResponse.json(theme);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to activate theme.' },
      { status: 500 },
    );
  }
}
