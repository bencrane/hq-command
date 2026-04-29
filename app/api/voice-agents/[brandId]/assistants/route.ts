import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ brandId: string }> },
) {
  const { brandId } = await params;
  return proxyToHqx(
    `/api/brands/${encodeURIComponent(brandId)}/voice-ai/assistants`,
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ brandId: string }> },
) {
  const { brandId } = await params;
  const body = await req.text();
  return proxyToHqx(
    `/api/brands/${encodeURIComponent(brandId)}/voice-ai/assistants`,
    { method: 'POST', body },
  );
}
