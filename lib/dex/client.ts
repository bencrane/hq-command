'use client';

import { createClient } from '@/lib/supabase/client';

export class DexAuthError extends Error {
  constructor(message = 'no session') {
    super(message);
    this.name = 'DexAuthError';
  }
}

export class DexRequestError extends Error {
  constructor(
    public path: string,
    public status: number,
    public body: unknown,
  ) {
    super(`dex ${path} ${status}`);
    this.name = 'DexRequestError';
  }
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_DEX_API_BASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_DEX_API_BASE_URL is not set');
  return url;
}

export async function dexFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new DexAuthError();

  const r = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: 'no-store',
  });

  if (!r.ok) {
    const body = await r.json().catch(async () => r.text().catch(() => ''));
    throw new DexRequestError(path, r.status, body);
  }
  return (await r.json()) as T;
}

export function dexPost<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  return dexFetch<TRes>(path, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

export function dexGet<TRes>(path: string): Promise<TRes> {
  return dexFetch<TRes>(path);
}

export function describeDexError(err: unknown): string {
  if (err instanceof DexAuthError) return 'Not signed in.';
  if (err instanceof DexRequestError) {
    if (err.status === 401) return 'Session expired or unauthorized.';
    if (err.status === 403) return 'Access denied.';
    const detail =
      typeof err.body === 'string' ? err.body : JSON.stringify(err.body);
    return `DEX error ${err.status}: ${detail}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export interface DataEnvelope<T> {
  data: T;
}
