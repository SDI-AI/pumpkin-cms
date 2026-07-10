import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { uploadStarterAdminMediaAsset } from '@/lib/starter-admin-media';

export async function POST(request: NextRequest) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const asset = await uploadStarterAdminMediaAsset(formData);
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to upload media asset.' },
      { status: 500 },
    );
  }
}
