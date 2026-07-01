import type { Page, Theme } from 'pumpkin-ts-models';

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5064';
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

interface AdminEnvelope<T> {
  pages?: Page[];
  themes?: Theme[];
  count?: number;
  tenantId?: string;
  data?: T;
}

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  expiresAt?: string;
}

class AdminApiClient {
  private async request<T>(endpoint: string, token?: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('X-API-Key', ADMIN_API_KEY);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${ADMIN_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(message || `Request failed with ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  login(credentials: AdminCredentials): Promise<AdminLoginResponse> {
    return this.request<AdminLoginResponse>('/api/auth/login', undefined, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getPages(token: string, tenantId: string): Promise<Page[]> {
    const result = await this.request<AdminEnvelope<Page[]>>(
      `/api/admin/pages?tenantId=${encodeURIComponent(tenantId)}`,
      token
    );
    return result.pages ?? [];
  }

  createPage(token: string, tenantId: string, page: Page): Promise<Page> {
    return this.request<Page>(`/api/admin/pages/${encodeURIComponent(tenantId)}`, token, {
      method: 'POST',
      body: JSON.stringify(page),
    });
  }

  updatePage(token: string, tenantId: string, pageSlug: string, page: Page): Promise<Page> {
    return this.request<Page>(
      `/api/admin/pages/${encodeURIComponent(tenantId)}/${encodeURIComponent(pageSlug)}`,
      token,
      {
        method: 'PUT',
        body: JSON.stringify(page),
      }
    );
  }

  async getThemes(token: string, tenantId: string): Promise<Theme[]> {
    const result = await this.request<AdminEnvelope<Theme[]>>(
      `/api/admin/themes/${encodeURIComponent(tenantId)}`,
      token
    );
    return result.themes ?? [];
  }

  getActiveTheme(token: string, tenantId: string): Promise<Theme> {
    return this.request<Theme>(`/api/admin/themes/${encodeURIComponent(tenantId)}/active`, token);
  }

  createTheme(token: string, tenantId: string, theme: Theme): Promise<Theme> {
    return this.request<Theme>(`/api/admin/themes/${encodeURIComponent(tenantId)}`, token, {
      method: 'POST',
      body: JSON.stringify(theme),
    });
  }

  updateTheme(token: string, tenantId: string, themeId: string, theme: Theme): Promise<Theme> {
    return this.request<Theme>(
      `/api/admin/themes/${encodeURIComponent(tenantId)}/${encodeURIComponent(themeId)}`,
      token,
      {
        method: 'PUT',
        body: JSON.stringify(theme),
      }
    );
  }
}

export const adminApiClient = new AdminApiClient();
