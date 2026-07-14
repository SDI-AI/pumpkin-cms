import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { getStarterAdminMediaAssets } from '@/lib/starter-admin-media';

export async function GET(request: NextRequest) {
  if (!(await isStarterAdminAuthenticated())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const assets = await getStarterAdminMediaAssets({
      folder: searchParams.get('folder') || undefined,
      contentType: searchParams.get('contentType') || undefined,
    });
    return NextResponse.json({ assets, count: assets.length });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to load media assets.' },
      { status: 500 },
    );
  }
}
