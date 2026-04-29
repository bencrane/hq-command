import { proxyToHqx } from '@/lib/voice-agents/server';

export async function GET() {
  return proxyToHqx('/admin/brands');
}
