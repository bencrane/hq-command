import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ category: string; variant: string }> },
) {
  const { category, variant } = await params;
  return proxyToHqx(
    `/direct-mail/specs/${encodeURIComponent(category)}/${encodeURIComponent(variant)}`,
  );
}
