import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export async function proxyToHqx(path: string, init: RequestInit = {}): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const r = await fetch(`${env.HQX_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: 'no-store',
  });

  if (r.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await r.text();

  // Pass the upstream body through verbatim — hq-x ships a structured error
  // envelope ({detail: {error, message, request_id, ...}}) that the client
  // needs to render in full. Wrapping it here would obscure the real error.
  if (!r.ok) {
    if (!text) {
      return NextResponse.json(
        { detail: { error: 'upstream_error', message: r.statusText } },
        { status: r.status },
      );
    }
    try {
      const json = JSON.parse(text) as unknown;
      return NextResponse.json(json, { status: r.status });
    } catch {
      // Non-JSON body — wrap as an envelope so clients can rely on the shape.
      return NextResponse.json(
        { detail: { error: 'upstream_error', message: text } },
        { status: r.status },
      );
    }
  }

  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep string */
  }
  return NextResponse.json(body);
}
