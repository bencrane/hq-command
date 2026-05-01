import { proxyToHqx } from '@/lib/voice-agents/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return proxyToHqx(
    `/api/v1/admin/initiatives/${encodeURIComponent(id)}/start-pipeline`,
    { method: 'POST', body: body || '{}' },
  );
}
