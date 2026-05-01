import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.toString();
  return proxyToHqx(`/api/v1/admin/agents${search ? `?${search}` : ''}`);
}
