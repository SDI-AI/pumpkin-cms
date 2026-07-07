import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import {
  deleteStarterAdminTheme,
  getStarterAdminTheme,
  updateStarterAdminTheme,
} from '@/lib/starter-admin-themes';
import type { Theme } from 'pumpkin-ts-models';

interface ThemeRouteContext {
  params: {
    id: string;
  };
}

export async function GET(_request: NextRequest, { params }: ThemeRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const theme = await getStarterAdminTheme(params.id);
    return NextResponse.json(theme);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load theme.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: ThemeRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const theme = (await request.json()) as Theme;
    const updated = await updateStarterAdminTheme(params.id, theme);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to save theme.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: ThemeRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await deleteStarterAdminTheme(params.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to delete theme.' },
      { status: 500 },
    );
  }
}
