import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import {
  deleteStarterAdminTheme,
  getStarterAdminTheme,
  updateStarterAdminTheme,
} from '@/lib/starter-admin-themes';
import type { Theme } from 'pumpkin-ts-models';

interface ThemeRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: ThemeRouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const theme = await getStarterAdminTheme(id);
    return NextResponse.json(theme);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load theme.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: ThemeRouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const theme = (await request.json()) as Theme;
    const { id } = await params;
    const updated = await updateStarterAdminTheme(id, theme);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to save theme.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: ThemeRouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await deleteStarterAdminTheme(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to delete theme.' },
      { status: 500 },
    );
  }
}
