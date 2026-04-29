'use client';

import { dexFetch, type DataEnvelope } from '@/lib/dex/client';
import {
  fixtureCount,
  fixtureEntity,
  fixtureResolve,
  fixtureSchema,
} from './fixtures';
import type {
  AudienceQuery,
  AudienceRow,
  CountResponse,
  CriteriaSchema,
  ResolveResponse,
} from './schema';

const USE_FIXTURES = process.env.NEXT_PUBLIC_AUDIENCE_BUILDER_FIXTURES === '1';

const FIXTURE_LATENCY_MS = 80;

function withLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FIXTURE_LATENCY_MS));
}

export async function fetchCriteriaSchema(): Promise<CriteriaSchema> {
  if (USE_FIXTURES) return withLatency(fixtureSchema);
  const r = await dexFetch<DataEnvelope<CriteriaSchema>>(
    '/api/v1/audiences/criteria-schema',
  );
  return r.data;
}

export async function resolveAudience(query: AudienceQuery): Promise<ResolveResponse> {
  if (USE_FIXTURES) return withLatency(fixtureResolve(query));
  const r = await dexFetch<DataEnvelope<ResolveResponse>>(
    '/api/v1/audiences/resolve',
    {
      method: 'POST',
      body: JSON.stringify(query),
    },
  );
  return r.data;
}

export async function countAudience(query: AudienceQuery): Promise<CountResponse> {
  if (USE_FIXTURES) return withLatency(fixtureCount(query));
  const r = await dexFetch<DataEnvelope<CountResponse>>('/api/v1/audiences/count', {
    method: 'POST',
    body: JSON.stringify(query),
  });
  return r.data;
}

export async function fetchAudienceEntity(id: string): Promise<AudienceRow | null> {
  if (USE_FIXTURES) return withLatency(fixtureEntity(id));
  try {
    const r = await dexFetch<DataEnvelope<AudienceRow>>(
      `/api/v1/audiences/entities/${encodeURIComponent(id)}`,
    );
    return r.data;
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 404
    ) {
      return null;
    }
    throw err;
  }
}
