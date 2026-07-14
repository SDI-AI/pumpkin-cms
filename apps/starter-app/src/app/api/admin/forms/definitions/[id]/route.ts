import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import {
  deleteStarterAdminFormDefinition,
  getStarterAdminFormDefinition,
  updateStarterAdminFormDefinition,
} from '@/lib/starter-admin-forms';
import type { FormDefinition } from 'pumpkin-ts-models';

interface FormDefinitionRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: FormDefinitionRouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const definition = await getStarterAdminFormDefinition(id);
    return NextResponse.json(definition);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load form definition.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: FormDefinitionRouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const definition = (await request.json()) as FormDefinition;
    const { id } = await params;
    const updated = await updateStarterAdminFormDefinition(id, definition);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to save form definition.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: FormDefinitionRouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await deleteStarterAdminFormDefinition(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to delete form definition.' },
      { status: 500 },
    );
  }
}
