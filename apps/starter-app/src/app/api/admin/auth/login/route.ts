import { NextRequest, NextResponse } from 'next/server';
import {
  createStarterAdminSession,
  getStarterAdminCookieOptions,
  isStarterAdminConfigured,
  starterAdminCookieName,
  verifyStarterAdminPassword,
} from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!isStarterAdminConfigured()) {
    return NextResponse.json(
      { message: 'Starter admin is missing PUMPKIN_ADMIN_PASSWORD.' },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;

  if (!verifyStarterAdminPassword(body?.password || '')) {
    return NextResponse.json(
      { message: 'Invalid admin password.' },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    starterAdminCookieName,
    createStarterAdminSession(),
    getStarterAdminCookieOptions(),
  );

  return response;
}
