import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mailerDesignSchema, type MailerDesign } from '@/lib/dmaas/types';

/**
 * Persistence endpoint. The real implementation will proxy to hq-x's
 * mailer_designs table (versioned: every save inserts a new row, latest
 * is active). Until that endpoint exists, we keep designs in a process-local
 * Map so the round-trip works in dev. Survives a single Next.js dev server
 * — no further.
 */

declare global {

  var __dmaasDesignStore: Map<string, MailerDesign> | undefined;
}

const store: Map<string, MailerDesign> =
  globalThis.__dmaasDesignStore ?? (globalThis.__dmaasDesignStore = new Map());

const upsertSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1).max(120),
  specCategory: z.literal('postcard'),
  specVariant: z.string().min(1),
  brand: mailerDesignSchema.shape.brand,
  config: mailerDesignSchema.shape.config,
});

export async function GET() {
  const designs = Array.from(store.values()).sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  return NextResponse.json({ designs });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 });
  }
  const now = new Date().toISOString();
  const existing = parsed.data.id ? store.get(parsed.data.id) : undefined;
  const design: MailerDesign = {
    id: parsed.data.id ?? cryptoRandomId(),
    name: parsed.data.name,
    specCategory: 'postcard',
    specVariant: parsed.data.specVariant,
    brand: parsed.data.brand,
    config: parsed.data.config,
    versionNumber: (existing?.versionNumber ?? 0) + 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  store.set(design.id, design);
  return NextResponse.json({ design });
}

function cryptoRandomId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
