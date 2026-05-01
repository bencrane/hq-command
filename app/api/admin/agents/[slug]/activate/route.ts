import { proxyToHqx } from '@/lib/voice-agents/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = await request.text();
  return proxyToHqx(
    `/api/v1/admin/agents/${encodeURIComponent(slug)}/activate`,
    { method: 'POST', body: body || '{}' },
  );
}
