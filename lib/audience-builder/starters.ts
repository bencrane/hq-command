import { DEFAULT_LIMIT, DEFAULT_OFFSET, type AudienceQuery } from './schema';

export interface StarterAudience {
  slug: string;
  label: string;
  group: 'fmcsa' | 'usaspending' | 'sam' | 'bridge';
  description: string;
  query: AudienceQuery;
}

const base = (criteria: AudienceQuery['criteria']): AudienceQuery => ({
  criteria,
  limit: DEFAULT_LIMIT,
  offset: DEFAULT_OFFSET,
});

export const STARTERS: StarterAudience[] = [
  // ---- FMCSA-only ----
  {
    slug: 'fmcsa-new-entrants-90d',
    label: 'Trucking carriers — new entrants 90d',
    group: 'fmcsa',
    description: 'Active carriers granted authority in the last 90 days.',
    query: base([
      { key: 'authority_status', op: 'eq', value: 'active' },
      { key: 'min_fleet_power_units', op: 'gte', value: 1 },
    ]),
  },
  {
    slug: 'fmcsa-high-risk-safety',
    label: 'Trucking carriers — high-risk safety',
    group: 'fmcsa',
    description: 'Carriers with elevated safety percentiles or active OOS orders.',
    query: base([
      { key: 'min_safety_percentile', op: 'gte', value: 90 },
      { key: 'has_active_oos', op: 'eq', value: true },
    ]),
  },
  {
    slug: 'fmcsa-insurance-lapses',
    label: 'Trucking carriers — insurance lapses',
    group: 'fmcsa',
    description: 'Carriers with cancelled insurance policies.',
    query: base([
      { key: 'authority_status', op: 'eq', value: 'inactive' },
    ]),
  },

  // ---- USAspending-only ----
  {
    slug: 'usaspending-first-time-winners',
    label: 'Federal contract recipients — first-time winners',
    group: 'usaspending',
    description: 'Recipients with their first federal award.',
    query: base([
      { key: 'is_first_time_winner', op: 'eq', value: true },
      { key: 'award_recency_band', op: 'in', values: ['last_90d', 'last_180d'] },
    ]),
  },
  {
    slug: 'usaspending-set-aside-cohort',
    label: 'Federal contract recipients — set-aside cohort',
    group: 'usaspending',
    description: 'Recipients matching small business / 8(a) / HUBZone set-asides.',
    query: base([
      {
        key: 'set_aside_flags',
        op: 'in',
        values: ['small_business', 'sba_8a', 'hubzone'],
      },
    ]),
  },
  {
    slug: 'usaspending-high-value-recipients',
    label: 'Federal contract recipients — high-value',
    group: 'usaspending',
    description: 'Recipients with > $1M obligated in the last 12 months.',
    query: base([
      { key: 'min_obligation_12mo', op: 'gte', value: 1_000_000 },
    ]),
  },

  // ---- SAM-only ----
  {
    slug: 'sam-expiring-soon',
    label: 'SAM-registered entities — expiring soon',
    group: 'sam',
    description: 'SAM registrations expiring within 60 days.',
    query: base([
      { key: 'sam_active', op: 'eq', value: true },
      { key: 'registration_expiring_within_days', op: 'lte', value: 60 },
    ]),
  },

  // ---- Bridge cases ----
  {
    slug: 'fmcsa-x-usaspending-winners',
    label: 'Carriers who also won federal contracts',
    group: 'bridge',
    description: 'FMCSA carriers that match a USAspending recipient via the PDL bridge.',
    query: base([
      { key: 'min_fleet_power_units', op: 'gte', value: 5 },
      { key: 'min_obligation_12mo', op: 'gte', value: 100_000 },
    ]),
  },
  {
    slug: 'usaspending-x-sam-active',
    label: 'Federal contractors with active SAM',
    group: 'bridge',
    description: 'Recipients who also have an active SAM registration.',
    query: base([
      { key: 'min_obligation_12mo', op: 'gte', value: 250_000 },
      { key: 'sam_active', op: 'eq', value: true },
    ]),
  },
];

export function findStarter(slug: string): StarterAudience | undefined {
  return STARTERS.find((s) => s.slug === slug);
}

// ---------------------------------------------------------------------------
// Slug map for old-path redirects
// ---------------------------------------------------------------------------

/** Old /admin/{source}/{slug} paths → starter slug. */
export const LEGACY_PATH_TO_STARTER: Record<string, string> = {
  // FMCSA
  'fmcsa/audiences/new-entrants-90d': 'fmcsa-new-entrants-90d',
  'fmcsa/audiences/high-risk-safety': 'fmcsa-high-risk-safety',
  'fmcsa/audiences/insurance-lapses': 'fmcsa-insurance-lapses',
  'fmcsa/audiences/authority-grants': 'fmcsa-new-entrants-90d',
  'fmcsa/audiences/insurance-renewal-window': 'fmcsa-insurance-lapses',
  'fmcsa/audiences/recent-revocations': 'fmcsa-insurance-lapses',
  'fmcsa/carriers/search': 'fmcsa-new-entrants-90d',
  'fmcsa/carriers/safe-new-entrants': 'fmcsa-new-entrants-90d',
  'fmcsa/carriers/safe-losing-coverage': 'fmcsa-insurance-lapses',
  'fmcsa/carriers/safe-mid-market': 'fmcsa-new-entrants-90d',
  'fmcsa/carriers/insurance-cancellations': 'fmcsa-insurance-lapses',
  'fmcsa/carriers/new-authority': 'fmcsa-new-entrants-90d',
  'fmcsa/carriers/stats': 'fmcsa-new-entrants-90d',
  // USAspending
  'usaspending/audiences/recent-winners': 'usaspending-first-time-winners',
  'usaspending/audiences/first-time-winners': 'usaspending-first-time-winners',
  'usaspending/audiences/set-asides': 'usaspending-set-aside-cohort',
  'usaspending/audiences/high-value': 'usaspending-high-value-recipients',
  // SAM
  'sam/entities/search': 'sam-expiring-soon',
  'sam/entities/expiring': 'sam-expiring-soon',
};
