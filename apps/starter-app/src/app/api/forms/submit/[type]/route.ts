import { NextRequest, NextResponse } from 'next/server';
import { loadTenantConfig } from '@/lib/tenant-config';

interface SubmitRouteContext {
  params: {
    type: string;
  };
}

export async function POST(request: NextRequest, { params }: SubmitRouteContext) {
  const config = loadTenantConfig();

  if (!config) {
    return NextResponse.json(
      { message: 'Pumpkin tenant configuration is missing.' },
      { status: 500 },
    );
  }

  const formData = await request.json();
  const response = await fetch(
    `${config.apiUrl}/api/forms/${encodeURIComponent(config.tenantId)}/submit/${encodeURIComponent(params.type)}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    },
  );

  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? 'application/json';

  return new NextResponse(text, {
    status: response.status,
    headers: {
      'Content-Type': contentType,
    },
  });
}
