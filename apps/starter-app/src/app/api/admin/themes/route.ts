import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { createStarterAdminTheme, getStarterAdminThemes } from '@/lib/starter-admin-themes';
import type { Theme } from 'pumpkin-ts-models';

export async function GET() {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { themes, activeThemeId } = await getStarterAdminThemes();
    return NextResponse.json({ themes, count: themes.length, activeThemeId });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load themes.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const theme = (await request.json()) as Theme;
    const created = await createStarterAdminTheme(theme);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to create theme.' },
      { status: 500 },
    );
  }
}
