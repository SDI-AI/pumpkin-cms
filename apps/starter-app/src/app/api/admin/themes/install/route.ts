import { NextRequest, NextResponse } from 'next/server';
import { isStarterAdminAuthenticated } from '@/lib/admin-auth';
import { installStarterAdminThemePackage } from '@/lib/starter-admin-themes';

export async function POST(request: NextRequest) {
  if (!isStarterAdminAuthenticated()) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const result = await installStarterAdminThemePackage(formData);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Unable to install theme package.' },
      { status: 500 },
    );
  }
}
