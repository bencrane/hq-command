import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return proxyToHqx(`/api/v1/admin/agents/${encodeURIComponent(slug)}`);
}
