import { NextResponse } from 'next/server';
import type { MailerDesign } from '@/lib/dmaas/types';

declare global {

  var __dmaasDesignStore: Map<string, MailerDesign> | undefined;
}

const store: Map<string, MailerDesign> =
  globalThis.__dmaasDesignStore ?? (globalThis.__dmaasDesignStore = new Map());

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const design = store.get(id);
  if (!design) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ design });
}
