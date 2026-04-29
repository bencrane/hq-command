import { describe, expect, it } from 'vitest';

import { DEFAULT_LIMIT, type AudienceQuery } from '@/lib/audience-builder/schema';
import {
  parseAudienceUrl,
  roundTrip,
  serializeAudienceUrl,
} from '@/lib/audience-builder/url-state';

const empty: AudienceQuery = {
  criteria: [],
  limit: DEFAULT_LIMIT,
  offset: 0,
};

const cases: { name: string; query: AudienceQuery; rowId?: string }[] = [
  {
    name: 'empty query',
    query: empty,
  },
  {
    name: 'single multiselect criterion',
    query: {
      ...empty,
      criteria: [{ key: 'physical_state', op: 'in', values: ['CA', 'TX'] }],
    },
  },
  {
    name: 'multiple criteria with mixed ops',
    query: {
      ...empty,
      criteria: [
        { key: 'physical_state', op: 'in', values: ['CA'] },
        { key: 'min_obligation_12mo', op: 'gte', value: 1_000_000 },
        { key: 'is_first_time_winner', op: 'eq', value: true },
      ],
    },
  },
  {
    name: 'array values with special characters',
    query: {
      ...empty,
      criteria: [{ key: 'agencies_any', op: 'in', values: ['Health & Human', 'D&D'] }],
    },
  },
  {
    name: 'boolean true',
    query: {
      ...empty,
      criteria: [{ key: 'sam_active', op: 'eq', value: true }],
    },
  },
  {
    name: 'boolean false',
    query: {
      ...empty,
      criteria: [{ key: 'is_mailable_us', op: 'eq', value: false }],
    },
  },
  {
    name: 'pagination — non-default limit and offset',
    query: { ...empty, limit: 100, offset: 200 },
  },
  {
    name: 'sort by single key',
    query: {
      ...empty,
      sort: [{ key: 'obligation_12mo', dir: 'desc' }],
    },
  },
  {
    name: 'sort by multiple keys',
    query: {
      ...empty,
      sort: [
        { key: 'obligation_12mo', dir: 'desc' },
        { key: 'physical_state', dir: 'asc' },
      ],
    },
  },
  {
    name: 'with row id (drawer open)',
    query: empty,
    rowId: 'uei:ABC123',
  },
  {
    name: 'criteria + sort + pagination + drawer',
    query: {
      criteria: [
        { key: 'min_fleet_power_units', op: 'gte', value: 5 },
        { key: 'naics_sector', op: 'in', values: ['48'] },
      ],
      limit: 100,
      offset: 50,
      sort: [{ key: 'obligation_12mo', dir: 'desc' }],
    },
    rowId: 'dot:1234567',
  },
  {
    name: 'currency criterion',
    query: {
      ...empty,
      criteria: [{ key: 'min_obligation_12mo', op: 'gte', value: 250_000 }],
    },
  },
];

describe('audience-builder url-state', () => {
  for (const c of cases) {
    it(`round-trips: ${c.name}`, () => {
      const result = roundTrip(c.query, c.rowId);
      expect(result.query.criteria).toEqual(c.query.criteria);
      expect(result.query.limit).toBe(c.query.limit);
      expect(result.query.offset).toBe(c.query.offset);
      if (c.query.sort) {
        expect(result.query.sort).toEqual(c.query.sort);
      }
      if (c.rowId) {
        expect(result.rowId).toBe(c.rowId);
      }
    });
  }

  it('produces clean URL for an empty query (no params)', () => {
    const sp = serializeAudienceUrl({ query: empty });
    expect(sp.toString()).toBe('');
  });

  it('omits limit and offset when defaults', () => {
    const sp = serializeAudienceUrl({ query: empty });
    expect(sp.has('limit')).toBe(false);
    expect(sp.has('offset')).toBe(false);
  });

  it('parses a URL with no q param into an empty query', () => {
    const parsed = parseAudienceUrl(new URLSearchParams(''));
    expect(parsed.query.criteria).toEqual([]);
    expect(parsed.query.limit).toBe(DEFAULT_LIMIT);
  });

  it('extracts the starter slug', () => {
    const parsed = parseAudienceUrl(
      new URLSearchParams('starter=fmcsa-new-entrants-90d'),
    );
    expect(parsed.starter).toBe('fmcsa-new-entrants-90d');
  });

  it('safely ignores a malformed q param', () => {
    const parsed = parseAudienceUrl(new URLSearchParams('q=not-base64!!!'));
    expect(parsed.query.criteria).toEqual([]);
  });
});
