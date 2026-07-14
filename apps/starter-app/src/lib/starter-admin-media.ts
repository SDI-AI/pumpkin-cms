import type { MediaAsset } from 'pumpkin-ts-models';
import { getStarterAdminApiContext, starterAdminFetch } from '@/lib/starter-admin-api';

interface MediaAssetsResponse {
  assets: MediaAsset[];
  count: number;
  tenantId: string;
  folder?: string;
  contentType?: string;
}

export async function getStarterAdminMediaAssets(filters: { folder?: string; contentType?: string } = {}) {
  const { tenantId } = await getStarterAdminApiContext();
  const search = new URLSearchParams();
  if (filters.folder) search.set('folder', filters.folder);
  if (filters.contentType) search.set('contentType', filters.contentType);
  const query = search.toString();

  const response = await starterAdminFetch<MediaAssetsResponse>(
    `/api/admin/media/${encodeURIComponent(tenantId)}${query ? `?${query}` : ''}`,
  );

  return response.assets;
}

export async function uploadStarterAdminMediaAsset(formData: FormData) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<MediaAsset>(
    `/api/admin/media/${encodeURIComponent(tenantId)}/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export async function updateStarterAdminMediaAsset(id: string, asset: MediaAsset) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<MediaAsset>(
    `/api/admin/media/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    },
  );
}

export async function deleteStarterAdminMediaAsset(id: string) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<{ message: string }>(
    `/api/admin/media/${encodeURIComponent(tenantId)}/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
