import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const search = url.searchParams.toString();
  return proxyToHqx(
    `/api/v1/admin/agents/${encodeURIComponent(slug)}/versions${search ? `?${search}` : ''}`,
  );
}
