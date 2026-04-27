import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export class HqxAuthError extends Error {
  constructor(message = 'no session') {
    super(message);
    this.name = 'HqxAuthError';
  }
}

export class HqxRequestError extends Error {
  constructor(
    public path: string,
    public status: number,
    public body: string,
  ) {
    super(`hqx ${path} ${status}`);
    this.name = 'HqxRequestError';
  }
}

export type HqxFetcher = typeof fetch;

export interface HqxFetchOptions extends RequestInit {
  fetchImpl?: HqxFetcher;
  accessToken?: string;
}

export async function hqxFetch<T>(path: string, init: HqxFetchOptions = {}): Promise<T> {
  const { fetchImpl, accessToken: providedToken, ...rest } = init;

  let token = providedToken;
  if (!token) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new HqxAuthError();
    token = session.access_token;
  }

  const f = fetchImpl ?? fetch;
  const r = await f(`${env.HQX_API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new HqxRequestError(path, r.status, body);
  }
  return (await r.json()) as T;
}
