import { describe, expect, it } from 'vitest';

import {
  buildPreviewBody,
  computeOverrides,
  defaultsToFormValues,
  partitionFields,
  resolveFilters,
  validateAll,
  validateField,
} from '@/lib/audiences/schema';
import type { AttributeSchema, AudienceTemplateDetail } from '@/lib/dex-audiences';

const sampleSchema: Record<string, AttributeSchema> = {
  physical_state: {
    type: 'string_array',
    label: 'States',
    items: { type: 'string', pattern: '^[A-Z]{2}$' },
  },
  power_units_min: { type: 'integer', label: 'Min power units', min: 0 },
  power_units_max: { type: 'integer', label: 'Max power units', min: 1, max: 50000 },
  carrier_operation_code: {
    type: 'string_array',
    label: 'Operation type',
    items: { type: 'string', enum: ['A', 'B', 'C'] },
    enum_labels: { A: 'For-hire', B: 'Private', C: 'Exempt for-hire' },
  },
  authority_status: {
    type: 'string',
    label: 'Authority status',
    enum: ['active', 'inactive', 'any'],
  },
  added_date_from: { type: 'date', label: 'Added on or after' },
  added_date_to: { type: 'date', label: 'Added on or before' },
  hazmat_flag: { type: 'boolean', label: 'Hazmat' },
  limit: { type: 'integer', label: 'Limit', min: 1, max: 500 },
  offset: { type: 'integer', label: 'Offset', min: 0, max: 10000 },
};

const sampleDefaults = {
  power_units_min: 1,
  power_units_max: 20,
  carrier_operation_code: ['A'],
  authority_status: 'active',
  limit: 100,
  offset: 0,
};

const sampleTemplate: AudienceTemplateDetail = {
  id: 'tpl_1',
  slug: 'motor-carriers-new-entrants-90d',
  name: 'New Entrants',
  description: '...',
  source_endpoint: '/api/v1/fmcsa/audiences/new-entrants-90d',
  partner_types: ['factoring_company'],
  is_active: true,
  attribute_schema: sampleSchema,
  default_filters: sampleDefaults,
};

describe('defaultsToFormValues', () => {
  it('coerces defaults via the schema', () => {
    const v = defaultsToFormValues(sampleSchema, sampleDefaults);
    expect(v.power_units_min).toBe(1);
    expect(v.carrier_operation_code).toEqual(['A']);
    expect(v.authority_status).toBe('active');
  });
});

describe('computeOverrides', () => {
  it('returns empty when values match defaults', () => {
    const v = defaultsToFormValues(sampleSchema, sampleDefaults);
    expect(computeOverrides(v, sampleDefaults)).toEqual({});
  });

  it('captures only changed keys', () => {
    const v = defaultsToFormValues(sampleSchema, sampleDefaults);
    v.physical_state = ['TX', 'FL'];
    v.power_units_max = 50;
    expect(computeOverrides(v, sampleDefaults)).toEqual({
      physical_state: ['TX', 'FL'],
      power_units_max: 50,
    });
  });

  it('strips hidden pagination fields', () => {
    const v = { limit: 999, offset: 50 };
    expect(computeOverrides(v, sampleDefaults)).toEqual({});
  });

  it('skips empty/undefined values', () => {
    const v = { physical_state: [], authority_status: '', power_units_min: undefined };
    expect(computeOverrides(v, sampleDefaults)).toEqual({});
  });
});

describe('resolveFilters', () => {
  it('overlays overrides on defaults', () => {
    expect(
      resolveFilters({ power_units_max: 50 }, sampleDefaults),
    ).toEqual({ ...sampleDefaults, power_units_max: 50 });
  });
});

describe('buildPreviewBody', () => {
  it('pins limit=5, offset=0 regardless of resolved filters', () => {
    const body = buildPreviewBody({ ...sampleDefaults, limit: 100, offset: 200 });
    expect(body.limit).toBe(5);
    expect(body.offset).toBe(0);
    expect(body.power_units_min).toBe(1);
  });

  it('strips empty arrays/strings/undefined', () => {
    const body = buildPreviewBody({
      authority_status: 'active',
      physical_state: [],
      legal_name_contains: '',
      hazmat_flag: undefined,
    });
    expect(body).toEqual({ authority_status: 'active', limit: 5, offset: 0 });
  });
});

describe('validateField', () => {
  it('accepts integers within min/max', () => {
    expect(
      validateField({ type: 'integer', label: 'x', min: 0, max: 10 }, 5),
    ).toBeNull();
  });

  it('rejects integers above max', () => {
    expect(
      validateField({ type: 'integer', label: 'x', min: 0, max: 10 }, 200),
    ).toContain('≤ 10');
  });

  it('rejects strings outside enum', () => {
    expect(
      validateField(
        { type: 'string', label: 'x', enum: ['a', 'b'] },
        'c',
      ),
    ).toContain('one of');
  });

  it('rejects array entries that violate the items pattern', () => {
    expect(
      validateField(
        { type: 'string_array', label: 'states', items: { type: 'string', pattern: '^[A-Z]{2}$' } },
        ['TX', 'florida'],
      ),
    ).toContain('format');
  });

  it('treats undefined/empty values as valid (no-op)', () => {
    expect(
      validateField({ type: 'integer', label: 'x', min: 1 }, undefined),
    ).toBeNull();
    expect(
      validateField({ type: 'string_array', label: 'states' }, []),
    ).toBeNull();
  });
});

describe('validateAll', () => {
  it('skips hidden fields', () => {
    const errors = validateAll(sampleSchema, {
      limit: 99999,
      offset: -10,
      power_units_min: 5,
    });
    expect(errors.limit).toBeUndefined();
    expect(errors.offset).toBeUndefined();
  });

  it('reports invalid fields', () => {
    const errors = validateAll(sampleSchema, {
      power_units_max: 99999,
      authority_status: 'unknown',
    });
    expect(errors.power_units_max).toBeDefined();
    expect(errors.authority_status).toBeDefined();
  });
});

describe('partitionFields', () => {
  it('puts default keys in primary and the rest in advanced (excluding limit/offset)', () => {
    const { primary, advanced } = partitionFields(sampleTemplate);
    expect(primary).toContain('power_units_min');
    expect(primary).toContain('carrier_operation_code');
    expect(primary).toContain('authority_status');
    expect(primary).not.toContain('limit');
    expect(primary).not.toContain('offset');
    expect(advanced).toContain('physical_state');
    expect(advanced).toContain('hazmat_flag');
    expect(advanced).not.toContain('limit');
  });

  it('falls back to all-primary when no defaults exist', () => {
    const t: AudienceTemplateDetail = { ...sampleTemplate, default_filters: {} };
    const { primary, advanced } = partitionFields(t);
    expect(advanced).toEqual([]);
    expect(primary.length).toBeGreaterThan(0);
    expect(primary).not.toContain('limit');
  });
});
