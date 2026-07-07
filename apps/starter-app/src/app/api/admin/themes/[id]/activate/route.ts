import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { activateStarterAdminTheme } from '@/lib/starter-admin-themes';

interface ActivateThemeRouteContext {
  params: {
    id: string;
  };
}

export async function POST(_request: NextRequest, { params }: ActivateThemeRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const theme = await activateStarterAdminTheme(params.id);
    return NextResponse.json(theme);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to activate theme.' },
      { status: 500 },
    );
  }
}
