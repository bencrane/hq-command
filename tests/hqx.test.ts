import { describe, expect, it, vi, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'pk_test';
  process.env.HQX_API_BASE_URL = 'https://hq-x.test';
  process.env.APP_ENV = 'dev';
});

describe('hqxFetch', () => {
  it('attaches Authorization: Bearer <token> and JSON content-type', async () => {
    const { hqxFetch } = await import('@/lib/hqx');

    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const result = await hqxFetch<{ ok: boolean }>('/admin/me', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      accessToken: 'jwt-abc',
    });

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://hq-x.test/admin/me');
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer jwt-abc');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('throws HqxRequestError on non-2xx', async () => {
    const { hqxFetch, HqxRequestError } = await import('@/lib/hqx');

    const fetchImpl = vi.fn(async () => new Response('boom', { status: 500 }));

    await expect(
      hqxFetch('/admin/me', {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        accessToken: 'jwt-abc',
      }),
    ).rejects.toBeInstanceOf(HqxRequestError);
  });

  it('throws HqxAuthError when no token is supplied and no session exists', async () => {
    vi.resetModules();
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: async () => ({
        auth: { getSession: async () => ({ data: { session: null } }) },
      }),
    }));
    const { hqxFetch, HqxAuthError } = await import('@/lib/hqx');

    await expect(hqxFetch('/admin/me')).rejects.toBeInstanceOf(HqxAuthError);
  });
});
