import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import {
  deleteStarterAdminFormDefinition,
  getStarterAdminFormDefinition,
  updateStarterAdminFormDefinition,
} from '@/lib/starter-admin-forms';
import type { FormDefinition } from 'pumpkin-ts-models';

interface FormDefinitionRouteContext {
  params: {
    id: string;
  };
}

export async function GET(_request: NextRequest, { params }: FormDefinitionRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const definition = await getStarterAdminFormDefinition(params.id);
    return NextResponse.json(definition);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load form definition.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: FormDefinitionRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const definition = (await request.json()) as FormDefinition;
    const updated = await updateStarterAdminFormDefinition(params.id, definition);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to save form definition.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: FormDefinitionRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await deleteStarterAdminFormDefinition(params.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to delete form definition.' },
      { status: 500 },
    );
  }
}
