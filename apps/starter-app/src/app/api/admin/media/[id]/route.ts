import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import {
  deleteStarterAdminMediaAsset,
  updateStarterAdminMediaAsset,
} from '@/lib/starter-admin-media';
import type { MediaAsset } from 'pumpkin-ts-models';

interface MediaRouteContext {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: MediaRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const asset = (await request.json()) as MediaAsset;
    const updated = await updateStarterAdminMediaAsset(params.id, asset);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to update media asset.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: MediaRouteContext) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await deleteStarterAdminMediaAsset(params.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to delete media asset.' },
      { status: 500 },
    );
  }
}
