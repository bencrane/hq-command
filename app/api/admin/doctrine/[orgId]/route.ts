import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  return proxyToHqx(`/api/v1/admin/doctrine/${encodeURIComponent(orgId)}`);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const body = await request.text();
  return proxyToHqx(`/api/v1/admin/doctrine/${encodeURIComponent(orgId)}`, {
    method: 'POST',
    body: body || '{}',
  });
}
