import { proxyToHqx } from '@/lib/voice-agents/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; slug: string }> },
) {
  const { id, slug } = await params;
  return proxyToHqx(
    `/api/v1/admin/initiatives/${encodeURIComponent(id)}/runs/${encodeURIComponent(slug)}/rerun`,
    { method: 'POST', body: '{}' },
  );
}
