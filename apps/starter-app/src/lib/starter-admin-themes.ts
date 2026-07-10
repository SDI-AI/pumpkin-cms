import type { Theme } from 'pumpkin-ts-models';
import { getStarterAdminApiContext, starterAdminFetch } from '@/lib/starter-admin-api';

interface ThemesResponse {
  themes: Theme[];
  count: number;
  tenantId: string;
}

export interface ThemeInstallResponse {
  created: boolean;
  theme: Theme;
  storage: {
    tenantThemePath: string;
    cssBlobPath: string;
    manifestBlobPath: string;
    packageBlobPath: string;
    assetBlobPaths: string[];
  };
}

export async function getStarterAdminThemes() {
  const { tenantId } = getStarterAdminApiContext();
  const response = await starterAdminFetch<ThemesResponse>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}`,
  );

  return response.themes;
}

export async function getStarterAdminTheme(id: string) {
  const { tenantId } = getStarterAdminApiContext();
  return starterAdminFetch<Theme>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}`,
  );
}

export async function createStarterAdminTheme(theme: Theme) {
  const { tenantId } = getStarterAdminApiContext();
  return starterAdminFetch<Theme>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme),
    },
  );
}

export async function updateStarterAdminTheme(id: string, theme: Theme) {
  const { tenantId } = getStarterAdminApiContext();
  return starterAdminFetch<Theme>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme),
    },
  );
}

export async function activateStarterAdminTheme(id: string) {
  const { tenantId } = getStarterAdminApiContext();
  return starterAdminFetch<Theme>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}/activate`,
    { method: 'POST' },
  );
}

export async function installStarterAdminThemePackage(formData: FormData) {
  const { tenantId } = getStarterAdminApiContext();
  return starterAdminFetch<ThemeInstallResponse>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/install`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export async function deleteStarterAdminTheme(id: string) {
  const { tenantId } = getStarterAdminApiContext();
  return starterAdminFetch<{ message: string }>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
