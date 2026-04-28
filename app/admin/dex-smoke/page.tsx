'use client';

import { useState } from 'react';
import { dexFetch, describeDexError } from '@/lib/dex';

const SMOKE_PATH = '/api/v1/fmcsa/audiences/new-entrants-90d';
const SMOKE_BODY = { limit: 5 };

export default function DexSmokePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await dexFetch(SMOKE_PATH, {
        method: 'POST',
        body: JSON.stringify(SMOKE_BODY),
      });
      setResult(data);
    } catch (err) {
      setError(describeDexError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pt-20 pb-12">
      <h1 className="text-2xl font-semibold tracking-tight">DEX smoke test</h1>
      <p className="mt-2 text-sm text-neutral-400">
        POST {SMOKE_PATH} with body{' '}
        <code className="text-neutral-300">{JSON.stringify(SMOKE_BODY)}</code>
      </p>

      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="mt-6 rounded bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {loading ? 'Calling DEX…' : 'Call DEX'}
      </button>

      {error && (
        <pre className="mt-6 whitespace-pre-wrap rounded border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </pre>
      )}

      {result !== null && (
        <pre className="mt-6 max-h-[60vh] overflow-auto rounded border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-200">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
