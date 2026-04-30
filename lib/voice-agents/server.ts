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

  const url = `${env.HQX_API_BASE_URL}${path}`;
  const method = (init.method ?? 'GET').toUpperCase();
  const r = await fetch(url, {
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
    // Operator-facing trace so any non-2xx leaves a paper trail in server
    // logs. Truncate the body to keep the line readable; full body is in the
    // response itself.
    console.error(
      '[proxyToHqx]',
      JSON.stringify({
        method,
        url,
        status: r.status,
        statusText: r.statusText,
        contentType: r.headers.get('content-type'),
        bodyPreview: text.slice(0, 1000),
      }),
    );

    const headers = { 'x-hqx-status-text': r.statusText || '' };
    if (!text) {
      return NextResponse.json(
        { detail: { error: 'upstream_error', message: r.statusText || '(empty response body)' } },
        { status: r.status, headers },
      );
    }
    try {
      const json = JSON.parse(text) as unknown;
      return NextResponse.json(json, { status: r.status, headers });
    } catch {
      // Non-JSON body — wrap as an envelope so clients can rely on the shape.
      return NextResponse.json(
        { detail: { error: 'upstream_error', message: text } },
        { status: r.status, headers },
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
