import { NextResponse } from 'next/server';
import { starterAdminTokenCookieName, starterAdminUserCookieName } from '@/lib/admin-auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  [starterAdminTokenCookieName, starterAdminUserCookieName, 'pumpkin_starter_admin'].forEach((name) => {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/admin',
      maxAge: 0,
    });
  });

  return response;
}
