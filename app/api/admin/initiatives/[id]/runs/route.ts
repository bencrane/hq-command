import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const search = url.searchParams.toString();
  return proxyToHqx(
    `/api/v1/admin/initiatives/${encodeURIComponent(id)}/runs${search ? `?${search}` : ''}`,
  );
}
