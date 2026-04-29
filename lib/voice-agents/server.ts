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
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep string */
  }

  if (!r.ok) {
    return NextResponse.json(
      { error: 'hqx_error', status: r.status, detail: body },
      { status: r.status },
    );
  }
  return NextResponse.json(body);
}
