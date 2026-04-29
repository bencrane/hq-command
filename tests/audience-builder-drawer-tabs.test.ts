import { describe, expect, it } from 'vitest';

import {
  visibleDrawerTabs,
  type AudienceRow,
} from '@/lib/audience-builder/schema';

function row(partial: Partial<AudienceRow>): AudienceRow {
  return {
    id: 'uei:X',
    primary_id_kind: 'uei',
    ids: { uei: 'X', dot: null, pdl_id: null, mc_mx_ff_numbers: [] },
    name: 'Test Co',
    physical_state: 'CA',
    physical_city: null,
    primary_naics_code: null,
    primary_naics_description: null,
    fmcsa: null,
    usaspending: null,
    sam: null,
    pdl: null,
    ...partial,
  };
}

describe('detail drawer — visible tabs', () => {
  it('shows only Overview when no source blocks are populated', () => {
    const tabs = visibleDrawerTabs(row({}));
    expect(tabs.map((t) => t.id)).toEqual(['overview']);
  });

  it('shows Overview + FMCSA when only fmcsa is populated', () => {
    const tabs = visibleDrawerTabs(row({ fmcsa: { dot_number: '123' } }));
    expect(tabs.map((t) => t.id)).toEqual(['overview', 'fmcsa']);
  });

  it('shows Overview + USAspending when only usaspending is populated', () => {
    const tabs = visibleDrawerTabs(row({ usaspending: { uei: 'X' } }));
    expect(tabs.map((t) => t.id)).toEqual(['overview', 'usaspending']);
  });

  it('shows Overview + SAM when only sam is populated', () => {
    const tabs = visibleDrawerTabs(row({ sam: { uei: 'X' } }));
    expect(tabs.map((t) => t.id)).toEqual(['overview', 'sam']);
  });

  it('shows all tabs when all four blocks are populated', () => {
    const tabs = visibleDrawerTabs(
      row({
        fmcsa: { dot_number: '1' },
        usaspending: { uei: 'X' },
        sam: { uei: 'X' },
        pdl: { pdl_id: 'p' },
      }),
    );
    expect(tabs.map((t) => t.id)).toEqual([
      'overview',
      'fmcsa',
      'usaspending',
      'sam',
      'pdl',
    ]);
  });

  it('returns Overview tab even for null row', () => {
    expect(visibleDrawerTabs(null).map((t) => t.id)).toEqual(['overview']);
  });
});
