import type { Theme, ThemeCustomCss } from 'pumpkin-ts-models';
import { getStarterAdminApiContext, starterAdminFetch } from '@/lib/starter-admin-api';

interface ThemesResponse {
  themes: Theme[];
  count: number;
  tenantId: string;
  activeThemeId?: string;
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

export interface ThemeCssResponse {
  css: string;
  customCss: ThemeCustomCss;
  theme?: Theme;
}

export async function getStarterAdminThemes() {
  const { tenantId } = await getStarterAdminApiContext();
  const response = await starterAdminFetch<ThemesResponse>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}`,
  );

  return {
    themes: response.themes,
    activeThemeId: response.activeThemeId,
  };
}

export async function getStarterAdminTheme(id: string) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<Theme>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}`,
  );
}

export async function createStarterAdminTheme(theme: Theme) {
  const { tenantId } = await getStarterAdminApiContext();
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
  const { tenantId } = await getStarterAdminApiContext();
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
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<Theme>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}/activate`,
    { method: 'POST' },
  );
}

export async function installStarterAdminThemePackage(formData: FormData) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<ThemeInstallResponse>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/install`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export async function deleteStarterAdminTheme(id: string) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<{ message: string }>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

export async function getStarterAdminThemeCss(id: string) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<ThemeCssResponse>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}/css`,
  );
}

export async function publishStarterAdminThemeCss(id: string, css: string, note: string) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<ThemeCssResponse>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}/css`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ css, note }),
    },
  );
}

export async function activateStarterAdminThemeCssRevision(id: string, revisionId: string) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<ThemeCssResponse>(
    `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}/css/${encodeURIComponent(revisionId)}/activate`,
    { method: 'POST' },
  );
}
