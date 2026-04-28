'use client';

import type { FilterField } from './registry';

export const DEFAULT_LIMIT = 25;
export const DEFAULT_OFFSET = 0;

export interface FormValues {
  [field: string]: string | string[] | boolean | undefined;
}

export interface PageState {
  values: FormValues;
  limit: number;
  offset: number;
}

/**
 * Parse search-params (URLSearchParams or ReadonlyURLSearchParams) into a typed
 * form-values object based on the endpoint's filter schema. Unknown keys are
 * dropped — switching endpoints clears params from previous endpoints.
 */
export function parseSearchParams(
  sp: URLSearchParams | { get(name: string): string | null; getAll(name: string): string[] },
  fields: FilterField[],
): PageState {
  const values: FormValues = {};
  for (const f of fields) {
    if (f.kind === 'multiselect') {
      const all = sp.getAll(f.name).flatMap((v) => v.split(',').filter(Boolean));
      if (all.length) values[f.name] = all;
    } else {
      const raw = sp.get(f.name);
      if (raw == null || raw === '') continue;
      if (f.kind === 'boolean') {
        values[f.name] = raw === 'true' ? true : raw === 'false' ? false : undefined;
      } else {
        values[f.name] = raw;
      }
    }
  }
  const limit = Math.max(1, Math.min(500, Number(sp.get('limit')) || DEFAULT_LIMIT));
  const offset = Math.max(0, Number(sp.get('offset')) || DEFAULT_OFFSET);
  return { values, limit, offset };
}

/**
 * Serialize page state into URL search params, dropping empties so URLs stay clean.
 */
export function serializeState(state: PageState, fields: FilterField[]): URLSearchParams {
  const sp = new URLSearchParams();
  for (const f of fields) {
    const v = state.values[f.name];
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(f.name, v.join(','));
      continue;
    }
    if (typeof v === 'boolean') {
      sp.set(f.name, v ? 'true' : 'false');
      continue;
    }
    if (v === '') continue;
    sp.set(f.name, String(v));
  }
  if (state.limit !== DEFAULT_LIMIT) sp.set('limit', String(state.limit));
  if (state.offset !== DEFAULT_OFFSET) sp.set('offset', String(state.offset));
  return sp;
}

/**
 * Build the request body sent to DEX. Numeric fields parsed; empties dropped;
 * `limit` and `offset` always included.
 */
export function toRequestBody(state: PageState, fields: FilterField[]): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const v = state.values[f.name];
    if (v == null) continue;
    if (Array.isArray(v)) {
      if (v.length) body[f.name] = v;
      continue;
    }
    if (typeof v === 'boolean') {
      body[f.name] = v;
      continue;
    }
    if (v === '') continue;
    if (f.kind === 'number') {
      const n = Number(v);
      if (Number.isFinite(n)) body[f.name] = n;
      continue;
    }
    body[f.name] = v;
  }
  body.limit = state.limit;
  body.offset = state.offset;
  return body;
}
