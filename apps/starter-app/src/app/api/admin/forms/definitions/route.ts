import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import {
  createStarterAdminFormDefinition,
  getStarterAdminFormDefinitions,
} from '@/lib/starter-admin-forms';
import type { FormDefinition } from 'pumpkin-ts-models';

export async function GET() {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const definitions = await getStarterAdminFormDefinitions();
    return NextResponse.json({ definitions, count: definitions.length });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load form definitions.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const definition = (await request.json()) as FormDefinition;
    const created = await createStarterAdminFormDefinition(definition);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to create form definition.' },
      { status: 500 },
    );
  }
}
