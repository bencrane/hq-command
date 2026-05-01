import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  const { id, runId } = await params;
  return proxyToHqx(
    `/api/v1/admin/initiatives/${encodeURIComponent(id)}/runs/${encodeURIComponent(runId)}`,
  );
}
