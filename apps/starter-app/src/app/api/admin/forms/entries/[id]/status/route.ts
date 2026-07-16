import { NextResponse } from 'next/server';
import type { FormEntryStatus } from 'pumpkin-ts-models';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { updateStarterAdminFormEntryStatus } from '@/lib/starter-admin-forms';

const statuses = new Set<FormEntryStatus>(['new', 'read', 'actioned', 'archived']);

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as { status?: FormEntryStatus };
    if (!body.status || !statuses.has(body.status)) {
      return NextResponse.json({ message: 'Select a valid entry status.' }, { status: 400 });
    }
    const { id } = await params;
    const entry = await updateStarterAdminFormEntryStatus(id, body.status);
    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to update form entry.' },
      { status: 500 },
    );
  }
}
