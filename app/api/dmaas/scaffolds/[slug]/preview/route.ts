import { proxyToHqx } from '@/lib/voice-agents/server';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = await req.text();
  return proxyToHqx(
    `/api/v1/dmaas/scaffolds/${encodeURIComponent(slug)}/preview`,
    { method: 'POST', body },
  );
}
