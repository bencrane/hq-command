import { NextResponse } from 'next/server';
import { POSTCARD_SPECS } from '@/lib/dmaas/specs';

/**
 * Mirror of GET /direct-mail/specs in data-engine-x. Lives in hq-x today as
 * a static read so the designer paints without a network round-trip; when the
 * upstream endpoint stabilises this can switch to proxyToHqx().
 */
export async function GET() {
  return NextResponse.json({ specs: POSTCARD_SPECS });
}
