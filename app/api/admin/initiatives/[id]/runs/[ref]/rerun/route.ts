import { proxyToHqx } from '@/lib/voice-agents/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; ref: string }> },
) {
  const { id, ref } = await params;
  return proxyToHqx(
    `/api/v1/admin/initiatives/${encodeURIComponent(id)}/runs/${encodeURIComponent(ref)}/rerun`,
    { method: 'POST', body: '{}' },
  );
}
