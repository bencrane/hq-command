import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Stub for the eventual HQ-X audience-draft save endpoint.
 *
 * TODO(hq-x): replace this handler with a forwarder to HQ-X
 * (e.g. POST {HQX_API_BASE_URL}/proposals/audience-drafts) once that endpoint
 * exists. The HQ-X side is a separate directive — this route only logs the
 * payload so the UI flow is end-to-end testable today.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }

  console.info('[audiences:draft] received', { userId: user.id, payload });

  return NextResponse.json({ ok: true, persisted: false });
}
