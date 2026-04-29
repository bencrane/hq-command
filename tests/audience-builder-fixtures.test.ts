import { describe, expect, it } from 'vitest';

import {
  fixtureCount,
  fixtureEntity,
  fixtureResolve,
  fixtureRowCount,
  fixtureSchema,
} from '@/lib/audience-builder/fixtures';
import { DEFAULT_LIMIT, type AudienceQuery } from '@/lib/audience-builder/schema';

const empty: AudienceQuery = { criteria: [], limit: DEFAULT_LIMIT, offset: 0 };

describe('audience-builder fixtures', () => {
  it('generates at least 200 rows across mixed bridge cases', () => {
    expect(fixtureRowCount).toBeGreaterThanOrEqual(200);
  });

  it('ships full v1 schema with all required groups', () => {
    const groupIds = fixtureSchema.groups.map((g) => g.id);
    expect(groupIds).toContain('geography');
    expect(groupIds).toContain('industry');
    expect(groupIds).toContain('fmcsa');
    expect(groupIds).toContain('usaspending');
    expect(groupIds).toContain('sam');
  });

  it('schema has approximately 25 criteria', () => {
    expect(fixtureSchema.criteria.length).toBeGreaterThanOrEqual(25);
  });

  it('every criterion declares supported_sources', () => {
    for (const c of fixtureSchema.criteria) {
      expect(c.supported_sources.length).toBeGreaterThan(0);
    }
  });

  it('count matches the number of resolved rows for an unfiltered query', () => {
    const resolve = fixtureResolve({ ...empty, limit: 500 });
    const count = fixtureCount(empty);
    expect(count.total).toBe(resolve.total);
  });

  it('resolver filters by physical_state', () => {
    const resolve = fixtureResolve({
      ...empty,
      limit: 500,
      criteria: [{ key: 'physical_state', op: 'in', values: ['CA'] }],
    });
    expect(resolve.items.length).toBeGreaterThan(0);
    for (const r of resolve.items) {
      expect(r.physical_state).toBe('CA');
    }
  });

  it('count filter matches resolver filter', () => {
    const q = {
      ...empty,
      criteria: [{ key: 'physical_state' as const, op: 'in' as const, values: ['CA'] }],
    };
    const count = fixtureCount(q);
    const resolve = fixtureResolve({ ...q, limit: 500 });
    expect(count.total).toBe(resolve.total);
  });

  it('resolver filters by min_fleet_power_units', () => {
    const resolve = fixtureResolve({
      ...empty,
      limit: 500,
      criteria: [{ key: 'min_fleet_power_units', op: 'gte', value: 50 }],
    });
    for (const r of resolve.items) {
      expect(r.fmcsa).not.toBeNull();
      expect(Number(r.fmcsa?.power_unit_count)).toBeGreaterThanOrEqual(50);
    }
  });

  it('reports applied_sources with single source for FMCSA-only query', () => {
    const resolve = fixtureResolve({
      ...empty,
      criteria: [{ key: 'min_fleet_power_units', op: 'gte', value: 1 }],
    });
    expect(resolve.applied_sources).toContain('fmcsa');
    expect(resolve.join_strategy).toBe('single_source');
  });

  it('reports pdl_bridge strategy for FMCSA + USAspending criteria', () => {
    const resolve = fixtureResolve({
      ...empty,
      criteria: [
        { key: 'min_fleet_power_units', op: 'gte', value: 1 },
        { key: 'min_obligation_12mo', op: 'gte', value: 1 },
      ],
    });
    expect(resolve.join_strategy).toBe('pdl_bridge');
  });

  it('reports uei_bridge strategy for USAspending + SAM criteria', () => {
    const resolve = fixtureResolve({
      ...empty,
      criteria: [
        { key: 'min_obligation_12mo', op: 'gte', value: 1 },
        { key: 'sam_active', op: 'eq', value: true },
      ],
    });
    expect(resolve.join_strategy).toBe('uei_bridge');
  });

  it('entity lookup returns null for missing id', () => {
    expect(fixtureEntity('uei:DOES_NOT_EXIST')).toBeNull();
  });

  it('entity lookup finds existing rows', () => {
    const some = fixtureResolve({ ...empty, limit: 1 }).items[0];
    expect(some).toBeDefined();
    const found = fixtureEntity(some.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(some.id);
  });

  it('resolve respects limit and offset', () => {
    const first = fixtureResolve({ ...empty, limit: 5, offset: 0 });
    const second = fixtureResolve({ ...empty, limit: 5, offset: 5 });
    expect(first.items.length).toBe(5);
    expect(second.items.length).toBe(5);
    expect(first.items[0].id).not.toBe(second.items[0].id);
  });
});
