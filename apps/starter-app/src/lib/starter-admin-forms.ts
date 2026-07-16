import type { FormDefinition, FormEntry, FormEntryStatus } from 'pumpkin-ts-models';
import { getStarterAdminApiContext, starterAdminFetch } from '@/lib/starter-admin-api';

interface FormDefinitionsResponse {
  definitions: FormDefinition[];
  count: number;
  tenantId: string;
}

interface FormEntriesResponse {
  entries: FormEntry[];
  count: number;
  tenantId: string;
  type: string;
}

export async function getStarterAdminFormDefinitions() {
  const { tenantId } = await getStarterAdminApiContext();
  const response = await starterAdminFetch<FormDefinitionsResponse>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/definitions`,
  );

  return response.definitions;
}

export async function getStarterAdminFormDefinition(id: string) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<FormDefinition>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/definitions/${encodeURIComponent(id)}`,
  );
}

export async function createStarterAdminFormDefinition(definition: FormDefinition) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<FormDefinition>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/definitions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(definition),
    },
  );
}

export async function updateStarterAdminFormDefinition(id: string, definition: FormDefinition) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<FormDefinition>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/definitions/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(definition),
    },
  );
}

export async function deleteStarterAdminFormDefinition(id: string) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<{ message: string }>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/definitions/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

export async function getStarterAdminFormEntries(type?: string) {
  const { tenantId } = await getStarterAdminApiContext();
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  const response = await starterAdminFetch<FormEntriesResponse>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/entries${query}`,
  );
  return response.entries;
}

export async function updateStarterAdminFormEntryStatus(id: string, status: FormEntryStatus) {
  const { tenantId } = await getStarterAdminApiContext();
  return starterAdminFetch<FormEntry>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/entries/${encodeURIComponent(id)}/status`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  );
}
