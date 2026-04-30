import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  process.env.NEXT_PUBLIC_HQX_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_HQX_SUPABASE_PUBLISHABLE_KEY = 'pk_test';
  process.env.NEXT_PUBLIC_DEX_API_BASE_URL = 'https://dex.test';
  process.env.HQX_API_BASE_URL = 'https://hq-x.test';
  process.env.APP_ENV = 'dev';
});

beforeEach(() => {
  vi.resetModules();
});

function mockSession(token: string | null) {
  vi.doMock('@/lib/supabase/server', () => ({
    createClient: async () => ({
      auth: {
        getSession: async () => ({
          data: { session: token ? { access_token: token } : null },
        }),
      },
    }),
  }));
}

describe('proxyToHqx', () => {
  it('returns 401 envelope when no session', async () => {
    mockSession(null);
    const { proxyToHqx } = await import('@/lib/voice-agents/server');
    const res = await proxyToHqx('/api/v1/dmaas/scaffolds');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({
      detail: { error: 'unauthorized', method: 'GET', path: '/api/v1/dmaas/scaffolds' },
    });
  });

  it('surfaces network failure as 502 envelope (not bare 500)', async () => {
    mockSession('jwt-abc');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => {
      // Match undici's TypeError("fetch failed") with a cause object carrying
      // the OS-level error code — that's how Node.js surfaces ECONNREFUSED etc.
      const e = new TypeError('fetch failed', {
        cause: { code: 'ECONNREFUSED', message: '' },
      });
      throw e;
    }) as typeof fetch;

    try {
      const { proxyToHqx } = await import('@/lib/voice-agents/server');
      const res = await proxyToHqx('/api/v1/dmaas/scaffolds');
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.detail.error).toBe('upstream_unreachable');
      expect(body.detail.cause).toBe('ECONNREFUSED');
      expect(body.detail.upstream_url).toBe('https://hq-x.test/api/v1/dmaas/scaffolds');
      expect(body.detail.method).toBe('GET');
      expect(body.detail.path).toBe('/api/v1/dmaas/scaffolds');
      expect(body.detail.message).toContain('ECONNREFUSED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('passes upstream envelope through verbatim on 4xx', async () => {
    mockSession('jwt-abc');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ detail: { error: 'scaffold_not_found', slug: 'xyz' } }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
        statusText: 'Not Found',
      }),
    ) as typeof fetch;

    try {
      const { proxyToHqx } = await import('@/lib/voice-agents/server');
      const res = await proxyToHqx('/api/v1/dmaas/scaffolds/xyz');
      expect(res.status).toBe(404);
      expect(res.headers.get('x-hqx-status-text')).toBe('Not Found');
      const body = await res.json();
      expect(body).toEqual({ detail: { error: 'scaffold_not_found', slug: 'xyz' } });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('synthesizes envelope when upstream returns empty body', async () => {
    mockSession('jwt-abc');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () =>
      new Response('', { status: 500, statusText: 'Internal Server Error' }),
    ) as typeof fetch;

    try {
      const { proxyToHqx } = await import('@/lib/voice-agents/server');
      const res = await proxyToHqx('/admin/brands');
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.detail.error).toBe('upstream_error');
      expect(body.detail.upstream_status).toBe(500);
      expect(body.detail.path).toBe('/admin/brands');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
