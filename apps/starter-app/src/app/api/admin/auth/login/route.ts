import { NextRequest, NextResponse } from 'next/server';
import {
  getStarterAdminCookieOptions,
  starterAdminTokenCookieName,
  starterAdminUserCookieName,
} from '@/lib/admin-auth';
import { loadTenantConfig } from '@/lib/tenant-config';
import type { LoginResponse } from 'pumpkin-ts-models';

export async function POST(request: NextRequest) {
  const config = loadTenantConfig();

  if (!config) {
    return NextResponse.json(
      { message: 'Pumpkin tenant configuration is missing.' },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;

  if (!body?.email || !body.password) {
    return NextResponse.json(
      { message: 'Email and password are required.' },
      { status: 400 },
    );
  }

  const authResponse = await fetch(`${config.apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
    }),
  });

  if (!authResponse.ok) {
    return NextResponse.json(
      { message: await getAuthError(authResponse) },
      { status: authResponse.status },
    );
  }

  const login = (await authResponse.json()) as LoginResponse;
  const role = login.user.role;
  const canAccessTenant = login.user.tenantId === config.tenantId || role === 'SuperAdmin';

  if (!canAccessTenant) {
    return NextResponse.json(
      { message: 'This user does not have access to the configured starter tenant.' },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ ok: true });
  const cookieOptions = getStarterAdminCookieOptions();
  response.cookies.set(starterAdminTokenCookieName, login.token, cookieOptions);
  response.cookies.set(starterAdminUserCookieName, JSON.stringify(login.user), cookieOptions);

  return response;
}

async function getAuthError(response: Response) {
  const text = await response.text().catch(() => '');
  if (!text) return 'Login failed.';

  try {
    const data = JSON.parse(text) as { message?: string; detail?: string; title?: string };
    return data.message || data.detail || data.title || 'Login failed.';
  } catch {
    return text;
  }
}
