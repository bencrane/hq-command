import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export async function proxyToHqx(path: string, init: RequestInit = {}): Promise<NextResponse> {
  const method = (init.method ?? 'GET').toUpperCase();
  const url = `${env.HQX_API_BASE_URL}${path}`;

  // Auth — failures here are 401, not 500. Wrap so a Supabase outage doesn't
  // bubble up as a bare Next 500.
  let accessToken: string;
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { detail: { error: 'unauthorized', message: 'No active session', method, path } },
        { status: 401 },
      );
    }
    accessToken = session.access_token;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[proxyToHqx] auth_error', JSON.stringify({ method, path, error: msg }));
    return NextResponse.json(
      {
        detail: {
          error: 'auth_error',
          message: `Failed to read session cookie: ${msg}`,
          method,
          path,
        },
      },
      { status: 500 },
    );
  }

  // Upstream call — the most common 500 cause is fetch throwing because hq-x
  // is unreachable (DNS, connection refused, timeout). Without this catch,
  // Next returns a bare 500 with no body, leaving the UI nothing to display.
  let r: Response;
  try {
    r = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });
  } catch (e) {
    const cause =
      e instanceof Error && 'cause' in e && e.cause && typeof e.cause === 'object'
        ? (e.cause as { code?: string; message?: string })
        : undefined;
    const code = cause?.code;
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      '[proxyToHqx] network_error',
      JSON.stringify({ method, url, error: msg, cause: code }),
    );
    return NextResponse.json(
      {
        detail: {
          error: 'upstream_unreachable',
          message: `Couldn't reach hq-x at ${url}${code ? ` (${code})` : ''}: ${msg}`,
          method,
          path,
          upstream_url: url,
          cause: code,
        },
      },
      { status: 502, headers: { 'x-hqx-status-text': 'Bad Gateway' } },
    );
  }

  if (r.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  let text: string;
  try {
    text = await r.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[proxyToHqx] body_read_error', JSON.stringify({ method, url, error: msg }));
    return NextResponse.json(
      {
        detail: {
          error: 'upstream_body_read_error',
          message: `Failed to read upstream response body: ${msg}`,
          method,
          path,
          upstream_status: r.status,
        },
      },
      { status: 502, headers: { 'x-hqx-status-text': r.statusText || 'Bad Gateway' } },
    );
  }

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
        {
          detail: {
            error: 'upstream_error',
            message: r.statusText || '(empty response body)',
            method,
            path,
            upstream_status: r.status,
          },
        },
        { status: r.status, headers },
      );
    }
    try {
      const json = JSON.parse(text) as unknown;
      return NextResponse.json(json, { status: r.status, headers });
    } catch {
      // Non-JSON body — wrap as an envelope so clients can rely on the shape.
      return NextResponse.json(
        {
          detail: {
            error: 'upstream_error',
            message: text,
            method,
            path,
            upstream_status: r.status,
          },
        },
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
