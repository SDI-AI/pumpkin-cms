import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadTenantConfig, getMissingTenantConfigKeys } from '@/lib/tenant-config';
import type { UserInfo } from 'pumpkin-ts-models';

export const starterAdminTokenCookieName = 'pumpkin_starter_admin_token';
export const starterAdminUserCookieName = 'pumpkin_starter_admin_user';

const sessionMaxAgeSeconds = 60 * 60 * 8;

export interface StarterAdminContext {
  siteName: string;
  tenantId: string;
  apiUrl: string;
  configSource: string;
  adminConfigured: boolean;
  missingConfigKeys: string[];
  user: UserInfo | null;
}

export function isStarterAdminConfigured() {
  return Boolean(loadTenantConfig());
}

export function getStarterAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAgeSeconds,
  };
}

export function isStarterAdminAuthenticated() {
  return Boolean(getStarterAdminToken());
}

export function requireStarterAdmin() {
  if (!isStarterAdminAuthenticated()) {
    redirect('/admin/login');
  }
}

export function getStarterAdminToken() {
  return cookies().get(starterAdminTokenCookieName)?.value || '';
}

export function getStarterAdminUser(): UserInfo | null {
  const raw = cookies().get(starterAdminUserCookieName)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export function getStarterAdminContext(): StarterAdminContext {
  const tenantConfig = loadTenantConfig();
  const missingConfigKeys = getMissingTenantConfigKeys();

  return {
    siteName: tenantConfig?.siteName || 'Pumpkin Starter',
    tenantId: tenantConfig?.tenantId || 'Not configured',
    apiUrl: tenantConfig?.apiUrl || 'Not configured',
    configSource: tenantConfig?.source || 'missing',
    adminConfigured: isStarterAdminConfigured(),
    missingConfigKeys,
    user: getStarterAdminUser(),
  };
}
