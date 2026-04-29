import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ brandId: string; id: string }> },
) {
  const { brandId, id } = await params;
  return proxyToHqx(
    `/api/brands/${encodeURIComponent(brandId)}/voice-ai/assistants/${encodeURIComponent(id)}`,
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ brandId: string; id: string }> },
) {
  const { brandId, id } = await params;
  const body = await req.text();
  return proxyToHqx(
    `/api/brands/${encodeURIComponent(brandId)}/voice-ai/assistants/${encodeURIComponent(id)}`,
    { method: 'PATCH', body },
  );
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ brandId: string; id: string }> },
) {
  const { brandId, id } = await params;
  return proxyToHqx(
    `/api/brands/${encodeURIComponent(brandId)}/voice-ai/assistants/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
