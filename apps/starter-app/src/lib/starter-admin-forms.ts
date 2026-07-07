import type { FormDefinition } from 'pumpkin-ts-models';
import { getStarterAdminApiContext, starterAdminFetch } from '@/lib/starter-admin-api';

interface FormDefinitionsResponse {
  definitions: FormDefinition[];
  count: number;
  tenantId: string;
}

export async function getStarterAdminFormDefinitions() {
  const { tenantId } = getStarterAdminApiContext();
  const response = await starterAdminFetch<FormDefinitionsResponse>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/definitions`,
  );

  return response.definitions;
}

export async function getStarterAdminFormDefinition(id: string) {
  const { tenantId } = getStarterAdminApiContext();
  return starterAdminFetch<FormDefinition>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/definitions/${encodeURIComponent(id)}`,
  );
}

export async function createStarterAdminFormDefinition(definition: FormDefinition) {
  const { tenantId } = getStarterAdminApiContext();
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
  const { tenantId } = getStarterAdminApiContext();
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
  const { tenantId } = getStarterAdminApiContext();
  return starterAdminFetch<{ message: string }>(
    `/api/admin/forms/${encodeURIComponent(tenantId)}/definitions/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
