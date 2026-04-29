'use client';

import {
  audiences,
  carriers,
  type AudienceRow,
  type AuthorityGrantsSignal,
  type CarrierRow,
  type HighRiskSafetySignal,
  type InsuranceLapsesSignal,
  type InsuranceRenewalWindowSignal,
  type NewEntrants90dSignal,
  type RecentRevocationsSignal,
} from '@/lib/dex/fmcsa';
import { CarrierDrawer } from '@/components/data/drawers/carrier-drawer';
import { CarrierStatsPanel } from '@/components/data/panels/carrier-stats-panel';
import {
  formatDate,
  formatList,
  formatNumber,
  formatPercentile,
  formatText,
  isoDaysAgo,
  isoToday,
} from '../format';
import {
  FMCSA_AUTHORITY_STATUS_OPTIONS,
  FMCSA_AUTHORITY_TYPE_OPTIONS,
  FMCSA_OPERATION_CODE_OPTIONS,
  FMCSA_POLICY_TYPE_OPTIONS,
  STATE_OPTIONS,
} from '../options';
import type {
  ColumnDef,
  DataSourceDef,
  FilterField,
  ListEndpoint,
  StatsEndpoint,
} from '../types';

const audienceCommonFilters: FilterField[] = [
  { name: 'physical_state', label: 'State', kind: 'multiselect', options: STATE_OPTIONS, width: 'md' },
  { name: 'power_units_min', label: 'Min power units', kind: 'number', width: 'sm' },
  { name: 'power_units_max', label: 'Max power units', kind: 'number', width: 'sm' },
  { name: 'driver_total_min', label: 'Min drivers', kind: 'number', width: 'sm' },
  { name: 'driver_total_max', label: 'Max drivers', kind: 'number', width: 'sm' },
  {
    name: 'carrier_operation_code',
    label: 'Operation code',
    kind: 'multiselect',
    options: FMCSA_OPERATION_CODE_OPTIONS,
    width: 'md',
  },
  {
    name: 'authority_status',
    label: 'Authority status',
    kind: 'select',
    options: FMCSA_AUTHORITY_STATUS_OPTIONS,
    width: 'sm',
  },
  { name: 'hazmat_flag', label: 'Hazmat only', kind: 'boolean', width: 'sm' },
];

function audienceBaseColumns<T>(): ColumnDef<AudienceRow<T>>[] {
  return [
    { key: 'dot_number', header: 'DOT', mono: true, render: (r) => formatText(r.dot_number) },
    { key: 'legal_name', header: 'Legal name', truncate: true, render: (r) => formatText(r.legal_name) },
    { key: 'physical_state', header: 'State', render: (r) => formatText(r.physical_state) },
    { key: 'physical_city', header: 'City', truncate: true, render: (r) => formatText(r.physical_city) },
    { key: 'power_unit_count', header: 'PU', align: 'right', render: (r) => formatNumber(r.power_unit_count) },
    { key: 'driver_total', header: 'Drivers', align: 'right', render: (r) => formatNumber(r.driver_total) },
    { key: 'carrier_operation_code', header: 'Op', render: (r) => formatText(r.carrier_operation_code) },
  ];
}

const carrierBaseColumns: ColumnDef<CarrierRow>[] = [
  { key: 'dot_number', header: 'DOT', mono: true, render: (r) => formatText(r.dot_number) },
  { key: 'legal_name', header: 'Legal name', truncate: true, render: (r) => formatText(r.legal_name) },
  { key: 'physical_state', header: 'State', render: (r) => formatText(r.physical_state) },
  { key: 'physical_city', header: 'City', truncate: true, render: (r) => formatText(r.physical_city) },
  { key: 'power_unit_count', header: 'PU', align: 'right', render: (r) => formatNumber(r.power_unit_count) },
  { key: 'driver_total', header: 'Drivers', align: 'right', render: (r) => formatNumber(r.driver_total) },
  { key: 'status_code', header: 'Status', render: (r) => formatText(r.status_code) },
];

function audienceColumns<T>(extras: ColumnDef<AudienceRow<T>>[]): ColumnDef<AudienceRow<T>>[] {
  return [
    ...audienceBaseColumns<T>(),
    ...extras,
    {
      key: 'last_seen_feed_date',
      header: 'Last seen',
      render: (r) => formatDate(r.last_seen_feed_date),
    },
  ];
}

// ---------------------------------------------------------------------------
// Audience endpoints
// ---------------------------------------------------------------------------

const newEntrants90d: ListEndpoint<AudienceRow<NewEntrants90dSignal>> = {
  source: 'fmcsa',
  slug: 'audiences/new-entrants-90d',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'New entrants (90d)',
  description: 'Carriers added to FMCSA in the last 90 days.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'added_date_from', label: 'Added from', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(90) },
    { name: 'added_date_to', label: 'Added to', kind: 'date', width: 'sm', defaultValue: isoToday() },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.newEntrants90d(req),
  rowKey: (r) => r.dot_number,
  columns: audienceColumns<NewEntrants90dSignal>([
    { key: 'added_date', header: 'Added', render: (r) => formatDate(r.audience_signal.added_date) },
    { key: 'days_since_added', header: 'Days', align: 'right', render: (r) => formatNumber(r.audience_signal.days_since_added) },
    { key: 'mc_mx_ff_numbers', header: 'MC/MX/FF', truncate: true, mono: true, render: (r) => formatList(r.audience_signal.mc_mx_ff_numbers) },
  ]),
};

const authorityGrants: ListEndpoint<AudienceRow<AuthorityGrantsSignal>> = {
  source: 'fmcsa',
  slug: 'audiences/authority-grants',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Authority grants',
  description: 'Carriers granted operating authority in the lookback window.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'decision_date_from', label: 'Decision from', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(30) },
    { name: 'decision_date_to', label: 'Decision to', kind: 'date', width: 'sm', defaultValue: isoToday() },
    { name: 'authority_type', label: 'Authority type', kind: 'multiselect', options: FMCSA_AUTHORITY_TYPE_OPTIONS, width: 'md' },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.authorityGrants(req),
  rowKey: (r) => r.dot_number,
  columns: audienceColumns<AuthorityGrantsSignal>([
    { key: 'final_authority_decision_date', header: 'Decision', render: (r) => formatDate(r.audience_signal.final_authority_decision_date) },
    { key: 'days_since_granted', header: 'Days', align: 'right', render: (r) => formatNumber(r.audience_signal.days_since_granted) },
    { key: 'authority_type', header: 'Type', render: (r) => formatText(r.audience_signal.authority_type) },
    { key: 'docket_number', header: 'Docket', mono: true, render: (r) => formatText(r.audience_signal.docket_number) },
  ]),
};

const insuranceLapses: ListEndpoint<AudienceRow<InsuranceLapsesSignal>> = {
  source: 'fmcsa',
  slug: 'audiences/insurance-lapses',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Insurance lapses',
  description: 'Carriers with cancelled insurance policies.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'cancel_date_from', label: 'Cancel from', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(30) },
    { name: 'cancel_date_to', label: 'Cancel to', kind: 'date', width: 'sm', defaultValue: isoToday() },
    { name: 'policy_type', label: 'Policy type', kind: 'multiselect', options: FMCSA_POLICY_TYPE_OPTIONS, width: 'md' },
    {
      name: 'current_insurance_status',
      label: 'Current status',
      kind: 'select',
      options: [
        { value: 'uninsured', label: 'Uninsured' },
        { value: 'reinstated', label: 'Reinstated' },
        { value: 'any', label: 'Any' },
      ],
      width: 'sm',
    },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.insuranceLapses(req),
  rowKey: (r) => r.dot_number,
  columns: audienceColumns<InsuranceLapsesSignal>([
    { key: 'cancel_effective_date', header: 'Cancelled', render: (r) => formatDate(r.audience_signal.cancel_effective_date) },
    { key: 'days_since_cancel', header: 'Days', align: 'right', render: (r) => formatNumber(r.audience_signal.days_since_cancel) },
    { key: 'policy_type', header: 'Policy', render: (r) => formatText(r.audience_signal.policy_type) },
    { key: 'current_policy_status', header: 'Current', render: (r) => formatText(r.audience_signal.current_policy_status) },
    { key: 'carrier_name_on_policy', header: 'Insurer', truncate: true, render: (r) => formatText(r.audience_signal.carrier_name_on_policy) },
  ]),
};

const highRiskSafety: ListEndpoint<AudienceRow<HighRiskSafetySignal>> = {
  source: 'fmcsa',
  slug: 'audiences/high-risk-safety',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'High-risk safety',
  description: 'Carriers with elevated CSA percentiles, crashes, or OOS orders.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'min_percentile', label: 'Min percentile', kind: 'number', placeholder: '90', width: 'sm' },
    { name: 'min_crash_count', label: 'Min crashes (12mo)', kind: 'number', width: 'sm' },
    { name: 'has_active_oos', label: 'Active OOS only', kind: 'boolean', width: 'sm' },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.highRiskSafety(req),
  rowKey: (r) => r.dot_number,
  columns: audienceColumns<HighRiskSafetySignal>([
    { key: 'highest_percentile_basic', header: 'BASIC', render: (r) => formatText(r.audience_signal.highest_percentile_basic) },
    { key: 'highest_percentile_value', header: 'Pctile', align: 'right', render: (r) => formatPercentile(r.audience_signal.highest_percentile_value) },
    { key: 'crash_count_12mo', header: 'Crashes', align: 'right', render: (r) => formatNumber(r.audience_signal.crash_count_12mo) },
    { key: 'latest_oos_order_date', header: 'Last OOS', render: (r) => formatDate(r.audience_signal.latest_oos_order_date) },
  ]),
};

const insuranceRenewalWindow: ListEndpoint<AudienceRow<InsuranceRenewalWindowSignal>> = {
  source: 'fmcsa',
  slug: 'audiences/insurance-renewal-window',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Insurance renewal window',
  description: 'Policies approaching expiration in the lookahead window.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'expiration_window_days', label: 'Window (days)', kind: 'number', placeholder: '30', width: 'sm', defaultValue: '30' },
    { name: 'policy_type', label: 'Policy type', kind: 'multiselect', options: FMCSA_POLICY_TYPE_OPTIONS, width: 'md' },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.insuranceRenewalWindow(req),
  rowKey: (r) => r.dot_number,
  columns: audienceColumns<InsuranceRenewalWindowSignal>([
    { key: 'policy_expiration_date', header: 'Expires', render: (r) => formatDate(r.audience_signal.policy_expiration_date) },
    { key: 'days_to_expiration', header: 'Days', align: 'right', render: (r) => formatNumber(r.audience_signal.days_to_expiration) },
    { key: 'policy_type', header: 'Policy', render: (r) => formatText(r.audience_signal.policy_type) },
    { key: 'min_coverage_required', header: 'Min coverage', align: 'right', render: (r) => formatNumber(r.audience_signal.min_coverage_required) },
    { key: 'carrier_name_on_policy', header: 'Insurer', truncate: true, render: (r) => formatText(r.audience_signal.carrier_name_on_policy) },
  ]),
};

const recentRevocations: ListEndpoint<AudienceRow<RecentRevocationsSignal>> = {
  source: 'fmcsa',
  slug: 'audiences/recent-revocations',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Recent revocations',
  description: 'Carriers with operating authority recently revoked.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'revocation_date_from', label: 'Revoked from', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(30) },
    { name: 'revocation_date_to', label: 'Revoked to', kind: 'date', width: 'sm', defaultValue: isoToday() },
    { name: 'authority_type', label: 'Authority type', kind: 'multiselect', options: FMCSA_AUTHORITY_TYPE_OPTIONS, width: 'md' },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.recentRevocations(req),
  rowKey: (r) => r.dot_number,
  columns: audienceColumns<RecentRevocationsSignal>([
    { key: 'final_revocation_decision_date', header: 'Revoked', render: (r) => formatDate(r.audience_signal.final_revocation_decision_date) },
    { key: 'days_since_revocation', header: 'Days', align: 'right', render: (r) => formatNumber(r.audience_signal.days_since_revocation) },
    { key: 'authority_type', header: 'Type', render: (r) => formatText(r.audience_signal.authority_type) },
    { key: 'revocation_reason', header: 'Reason', truncate: true, render: (r) => formatText(r.audience_signal.revocation_reason) },
    { key: 'docket_number', header: 'Docket', mono: true, render: (r) => formatText(r.audience_signal.docket_number) },
  ]),
};

// ---------------------------------------------------------------------------
// Carrier endpoints
// ---------------------------------------------------------------------------

const carrierSearch: ListEndpoint<CarrierRow> = {
  source: 'fmcsa',
  slug: 'carriers/search',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Search',
  description: 'Full carrier search with safety, contact, and fleet filters.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'city', label: 'City', kind: 'text', width: 'sm' },
    { name: 'legal_name_contains', label: 'Legal name contains', kind: 'text', width: 'md' },
    { name: 'min_power_units', label: 'Min PU', kind: 'number', width: 'sm' },
    { name: 'max_power_units', label: 'Max PU', kind: 'number', width: 'sm' },
    {
      name: 'safety_rating_code',
      label: 'Safety rating',
      kind: 'select',
      options: [
        { value: 'S', label: 'Satisfactory' },
        { value: 'C', label: 'Conditional' },
        { value: 'U', label: 'Unsatisfactory' },
      ],
      width: 'sm',
    },
    { name: 'max_unsafe_driving', label: 'Max unsafe driving %', kind: 'number', width: 'sm' },
    { name: 'max_hos', label: 'Max HOS %', kind: 'number', width: 'sm' },
    { name: 'max_vehicle_maintenance', label: 'Max vehicle maint %', kind: 'number', width: 'sm' },
    { name: 'max_driver_fitness', label: 'Max driver fitness %', kind: 'number', width: 'sm' },
    { name: 'max_controlled_substances', label: 'Max ctrl subs %', kind: 'number', width: 'sm' },
    { name: 'has_alerts', label: 'Has alerts', kind: 'boolean', width: 'sm' },
    { name: 'has_crashes', label: 'Has crashes', kind: 'boolean', width: 'sm' },
    { name: 'has_email', label: 'Has email', kind: 'boolean', width: 'sm' },
    { name: 'has_phone', label: 'Has phone', kind: 'boolean', width: 'sm' },
    {
      name: 'sort_by',
      label: 'Sort by',
      kind: 'select',
      options: [
        { value: 'fleet_size', label: 'Fleet size' },
        { value: 'state', label: 'State' },
        { value: 'safety', label: 'Safety' },
      ],
      width: 'sm',
    },
  ],
  fetch: (req) => carriers.search(req),
  rowKey: (r) => r.dot_number,
  columns: [
    ...carrierBaseColumns,
    { key: 'safety_rating_code', header: 'Rating', render: (r) => formatText(r.safety_rating_code) },
    { key: 'crash_count_12mo', header: 'Crashes', align: 'right', render: (r) => formatNumber(r.crash_count_12mo) },
  ],
};

const carrierStats: StatsEndpoint<Awaited<ReturnType<typeof carriers.stats>>['data']> = {
  source: 'fmcsa',
  slug: 'carriers/stats',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Stats',
  description: 'Aggregate carrier counts, alerts, and recent activity.',
  kind: 'stats',
  filters: [{ name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' }],
  fetch: (req) => carriers.stats(req),
  Panel: CarrierStatsPanel,
};

const insuranceCancellations: ListEndpoint<CarrierRow> = {
  source: 'fmcsa',
  slug: 'carriers/insurance-cancellations',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Insurance cancellations',
  description: 'Carriers with cancelled insurance — list view.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'cancel_date_from', label: 'Cancel from', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(30) },
    { name: 'cancel_date_to', label: 'Cancel to', kind: 'date', width: 'sm', defaultValue: isoToday() },
    { name: 'insurance_type', label: 'Insurance type', kind: 'text', width: 'sm' },
    { name: 'min_power_units', label: 'Min PU', kind: 'number', width: 'sm' },
    { name: 'max_power_units', label: 'Max PU', kind: 'number', width: 'sm' },
    { name: 'safe_only', label: 'Safe only', kind: 'boolean', width: 'sm' },
  ],
  fetch: (req) => carriers.insuranceCancellations(req),
  rowKey: (r) => r.dot_number,
  columns: carrierBaseColumns,
};

const newAuthority: ListEndpoint<CarrierRow> = {
  source: 'fmcsa',
  slug: 'carriers/new-authority',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'New authority',
  description: 'Carriers granted new authority in the date window.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'served_date_from', label: 'Served from', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(30) },
    { name: 'served_date_to', label: 'Served to', kind: 'date', width: 'sm', defaultValue: isoToday() },
    {
      name: 'authority_type',
      label: 'Authority type',
      kind: 'select',
      options: FMCSA_AUTHORITY_TYPE_OPTIONS,
      width: 'sm',
    },
    { name: 'min_power_units', label: 'Min PU', kind: 'number', width: 'sm' },
    { name: 'max_power_units', label: 'Max PU', kind: 'number', width: 'sm' },
    { name: 'safe_only', label: 'Safe only', kind: 'boolean', width: 'sm' },
  ],
  fetch: (req) => carriers.newAuthority(req),
  rowKey: (r) => r.dot_number,
  columns: carrierBaseColumns,
};

const safeNewEntrants: ListEndpoint<CarrierRow> = {
  source: 'fmcsa',
  slug: 'carriers/safe-new-entrants',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Safe new entrants',
  description: 'Recent new entrants without safety flags.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'date_from', label: 'From', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(90) },
    { name: 'date_to', label: 'To', kind: 'date', width: 'sm', defaultValue: isoToday() },
    { name: 'min_power_units', label: 'Min PU', kind: 'number', width: 'sm' },
    { name: 'max_power_units', label: 'Max PU', kind: 'number', width: 'sm' },
  ],
  fetch: (req) => carriers.safeNewEntrants(req),
  rowKey: (r) => r.dot_number,
  columns: carrierBaseColumns,
};

const safeLosingCoverage: ListEndpoint<CarrierRow> = {
  source: 'fmcsa',
  slug: 'carriers/safe-losing-coverage',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Safe losing coverage',
  description: 'Safe carriers with insurance lapses — high-fit prospects.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'date_from', label: 'From', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(30) },
    { name: 'date_to', label: 'To', kind: 'date', width: 'sm', defaultValue: isoToday() },
    { name: 'min_power_units', label: 'Min PU', kind: 'number', width: 'sm' },
    { name: 'max_power_units', label: 'Max PU', kind: 'number', width: 'sm' },
  ],
  fetch: (req) => carriers.safeLosingCoverage(req),
  rowKey: (r) => r.dot_number,
  columns: carrierBaseColumns,
};

const safeMidMarket: ListEndpoint<CarrierRow> = {
  source: 'fmcsa',
  slug: 'carriers/safe-mid-market',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Safe mid-market',
  description: 'Mid-market safe carriers.',
  kind: 'list',
  detailKind: 'fmcsa-carrier',
  detailIdKey: 'dot_number',
  filters: [{ name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' }],
  fetch: (req) => carriers.safeMidMarket(req),
  rowKey: (r) => r.dot_number,
  columns: carrierBaseColumns,
};

// ---------------------------------------------------------------------------
// Source descriptor
// ---------------------------------------------------------------------------

export const fmcsaSource: DataSourceDef = {
  id: 'fmcsa',
  label: 'FMCSA',
  shortLabel: 'FMCSA',
  pathSegment: 'fmcsa',
  defaultSlug: 'audiences/new-entrants-90d',
  groups: [
    { id: 'audiences', label: 'Audiences', icon: 'Boxes' },
    { id: 'carriers', label: 'Carriers', icon: 'Truck' },
  ],
  endpoints: [
    newEntrants90d,
    authorityGrants,
    insuranceLapses,
    highRiskSafety,
    insuranceRenewalWindow,
    recentRevocations,
    carrierSearch,
    carrierStats,
    insuranceCancellations,
    newAuthority,
    safeNewEntrants,
    safeLosingCoverage,
    safeMidMarket,
  ],
  detailDrawers: {
    'fmcsa-carrier': CarrierDrawer,
  },
};
