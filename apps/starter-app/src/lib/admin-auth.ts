import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { loadTenantConfig, getMissingTenantConfigKeys } from '@/lib/tenant-config';

export const starterAdminCookieName = 'pumpkin_starter_admin';

const sessionMaxAgeSeconds = 60 * 60 * 8;

export interface StarterAdminContext {
  siteName: string;
  tenantId: string;
  apiUrl: string;
  configSource: string;
  adminConfigured: boolean;
  missingConfigKeys: string[];
}

export function getStarterAdminPassword() {
  return process.env.PUMPKIN_ADMIN_PASSWORD?.trim() || '';
}

export function isStarterAdminConfigured() {
  return Boolean(getStarterAdminPassword());
}

export function verifyStarterAdminPassword(password: string) {
  const expected = getStarterAdminPassword();
  if (!expected || !password) return false;

  return safeEqual(password, expected);
}

export function createStarterAdminSession() {
  const expiresAt = Date.now() + sessionMaxAgeSeconds * 1000;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function verifyStarterAdminSession(value?: string) {
  if (!value) return false;

  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  return safeEqual(signature, sign(payload));
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
  return verifyStarterAdminSession(cookies().get(starterAdminCookieName)?.value);
}

export function requireStarterAdmin() {
  if (!isStarterAdminAuthenticated()) {
    redirect('/admin/login');
  }
}

export function getStarterAdminContext(): StarterAdminContext {
  const tenantConfig = loadTenantConfig();
  const missingConfigKeys = getMissingTenantConfigKeys();

  if (!isStarterAdminConfigured()) {
    missingConfigKeys.push('PUMPKIN_ADMIN_PASSWORD');
  }

  return {
    siteName: tenantConfig?.siteName || 'Pumpkin Starter',
    tenantId: tenantConfig?.tenantId || 'Not configured',
    apiUrl: tenantConfig?.apiUrl || 'Not configured',
    configSource: tenantConfig?.source || 'missing',
    adminConfigured: isStarterAdminConfigured(),
    missingConfigKeys,
  };
}

function sign(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function getSessionSecret() {
  return (
    process.env.PUMPKIN_ADMIN_SESSION_SECRET ||
    process.env.PUMPKIN_API_KEY ||
    getStarterAdminPassword() ||
    'starter-admin-dev-secret'
  );
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}
