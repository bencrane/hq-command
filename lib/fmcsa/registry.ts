'use client';

import {
  audiences,
  carriers,
  type AudienceRow,
  type AuthorityGrantsSignal,
  type CarrierRow,
  type CarrierSearchData,
  type CarrierStatsData,
  type HighRiskSafetySignal,
  type InsuranceLapsesSignal,
  type InsuranceRenewalWindowSignal,
  type NewEntrants90dSignal,
  type RecentRevocationsSignal,
} from '@/lib/dex-fmcsa';
import { DEFAULT_SLUG } from './constants';
import {
  formatBool,
  formatDate,
  formatList,
  formatNumber,
  formatPercentile,
  formatText,
} from './format';

// ---------------------------------------------------------------------------
// Filter schema
// ---------------------------------------------------------------------------

export type FilterFieldKind =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'date';

export interface FilterFieldOption {
  value: string;
  label: string;
}

export interface FilterField {
  name: string;
  label: string;
  kind: FilterFieldKind;
  placeholder?: string;
  options?: FilterFieldOption[];
  hint?: string;
  /** width hint for layout: 'sm' = quarter row, 'md' = half row, 'lg' = full row */
  width?: 'sm' | 'md' | 'lg';
}

// ---------------------------------------------------------------------------
// Column definition
// ---------------------------------------------------------------------------

export type ColumnAlign = 'left' | 'right';

export interface ColumnDef<TRow> {
  key: string;
  header: string;
  align?: ColumnAlign;
  /** monospace style; useful for DOT numbers and IDs */
  mono?: boolean;
  /** truncate long text with title attribute tooltip */
  truncate?: boolean;
  /** extra CSS classes */
  className?: string;
  render: (row: TRow) => React.ReactNode;
  /** plain text for tooltips / future export — defaults to render output */
  text?: (row: TRow) => string;
}

// ---------------------------------------------------------------------------
// Endpoint shapes
// ---------------------------------------------------------------------------

export type EndpointGroup = 'audiences' | 'carriers';
export type EndpointKind = 'audience-list' | 'carrier-list' | 'carrier-stats';

interface EndpointBase {
  /** path slug after /admin/fmcsa/, e.g. 'audiences/new-entrants-90d' */
  slug: string;
  group: EndpointGroup;
  groupLabel: string;
  label: string;
  description: string;
  filters: FilterField[];
  /** common filters that apply to many audience endpoints (rendered after main filters) */
  commonFilters?: FilterField[];
}

export interface AudienceListEndpoint<TSignal> extends EndpointBase {
  kind: 'audience-list';
  fetch: (req: Record<string, unknown>) => Promise<{
    data: {
      items: AudienceRow<TSignal>[];
      total: number;
      has_more: boolean;
      limit: number;
      offset: number;
    };
  }>;
  signalColumns: ColumnDef<AudienceRow<TSignal>>[];
}

export interface CarrierListEndpoint extends EndpointBase {
  kind: 'carrier-list';
  fetch: (req: Record<string, unknown>) => Promise<{
    data: CarrierSearchData;
  }>;
  /** optional extra columns beyond the shared base */
  extraColumns?: ColumnDef<CarrierRow>[];
}

export interface CarrierStatsEndpoint extends EndpointBase {
  kind: 'carrier-stats';
  fetch: (req: Record<string, unknown>) => Promise<{ data: CarrierStatsData }>;
}

export type FmcsaEndpoint =
  | AudienceListEndpoint<unknown>
  | CarrierListEndpoint
  | CarrierStatsEndpoint;

// ---------------------------------------------------------------------------
// Shared filter fields
// ---------------------------------------------------------------------------

const STATE_OPTIONS: FilterFieldOption[] = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA',
  'ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',
  'OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
].map((s) => ({ value: s, label: s }));

const OPERATION_CODE_OPTIONS: FilterFieldOption[] = [
  { value: 'A', label: 'A · Authorized for-hire' },
  { value: 'B', label: 'B · Exempt for-hire' },
  { value: 'C', label: 'C · Private (property)' },
  { value: 'D', label: 'D · Private (passengers, business)' },
  { value: 'E', label: 'E · Private (passengers, non-business)' },
  { value: 'F', label: 'F · Migrant' },
  { value: 'G', label: 'G · US Mail' },
  { value: 'H', label: 'H · Federal government' },
  { value: 'I', label: 'I · State government' },
  { value: 'J', label: 'J · Local government' },
  { value: 'K', label: 'K · Indian Tribe' },
];

const AUTHORITY_STATUS_OPTIONS: FilterFieldOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'any', label: 'Any' },
];

const POLICY_TYPE_OPTIONS: FilterFieldOption[] = [
  { value: 'BIPD', label: 'BIPD' },
  { value: 'CARGO', label: 'Cargo' },
  { value: 'BOND', label: 'Bond' },
  { value: 'TRUST', label: 'Trust' },
];

const AUTHORITY_TYPE_OPTIONS: FilterFieldOption[] = [
  { value: 'common', label: 'Common' },
  { value: 'contract', label: 'Contract' },
  { value: 'broker', label: 'Broker' },
];

const audienceCommonFilters: FilterField[] = [
  {
    name: 'physical_state',
    label: 'State',
    kind: 'multiselect',
    options: STATE_OPTIONS,
    width: 'md',
  },
  { name: 'power_units_min', label: 'Min power units', kind: 'number', width: 'sm' },
  { name: 'power_units_max', label: 'Max power units', kind: 'number', width: 'sm' },
  { name: 'driver_total_min', label: 'Min drivers', kind: 'number', width: 'sm' },
  { name: 'driver_total_max', label: 'Max drivers', kind: 'number', width: 'sm' },
  {
    name: 'carrier_operation_code',
    label: 'Operation code',
    kind: 'multiselect',
    options: OPERATION_CODE_OPTIONS,
    width: 'md',
  },
  {
    name: 'authority_status',
    label: 'Authority status',
    kind: 'select',
    options: AUTHORITY_STATUS_OPTIONS,
    width: 'sm',
  },
  { name: 'hazmat_flag', label: 'Hazmat only', kind: 'boolean', width: 'sm' },
];

// ---------------------------------------------------------------------------
// Shared columns
// ---------------------------------------------------------------------------

function audienceBaseColumns<T>(): ColumnDef<AudienceRow<T>>[] {
  return [
    {
      key: 'dot_number',
      header: 'DOT',
      mono: true,
      render: (r) => formatText(r.dot_number),
    },
    {
      key: 'legal_name',
      header: 'Legal name',
      truncate: true,
      render: (r) => formatText(r.legal_name),
    },
    {
      key: 'physical_state',
      header: 'State',
      render: (r) => formatText(r.physical_state),
    },
    {
      key: 'physical_city',
      header: 'City',
      truncate: true,
      render: (r) => formatText(r.physical_city),
    },
    {
      key: 'power_unit_count',
      header: 'PU',
      align: 'right',
      render: (r) => formatNumber(r.power_unit_count),
    },
    {
      key: 'driver_total',
      header: 'Drivers',
      align: 'right',
      render: (r) => formatNumber(r.driver_total),
    },
    {
      key: 'carrier_operation_code',
      header: 'Op',
      render: (r) => formatText(r.carrier_operation_code),
    },
  ];
}

const carrierBaseColumns: ColumnDef<CarrierRow>[] = [
  {
    key: 'dot_number',
    header: 'DOT',
    mono: true,
    render: (r) => formatText(r.dot_number),
  },
  {
    key: 'legal_name',
    header: 'Legal name',
    truncate: true,
    render: (r) => formatText(r.legal_name),
  },
  {
    key: 'physical_state',
    header: 'State',
    render: (r) => formatText(r.physical_state),
  },
  {
    key: 'physical_city',
    header: 'City',
    truncate: true,
    render: (r) => formatText(r.physical_city),
  },
  {
    key: 'power_unit_count',
    header: 'PU',
    align: 'right',
    render: (r) => formatNumber(r.power_unit_count),
  },
  {
    key: 'driver_total',
    header: 'Drivers',
    align: 'right',
    render: (r) => formatNumber(r.driver_total),
  },
  {
    key: 'status_code',
    header: 'Status',
    render: (r) => formatText(r.status_code),
  },
];

// ---------------------------------------------------------------------------
// Endpoint definitions
// ---------------------------------------------------------------------------

const newEntrants90d: AudienceListEndpoint<NewEntrants90dSignal> = {
  slug: 'audiences/new-entrants-90d',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'New entrants (90d)',
  description: 'Carriers added to FMCSA in the last 90 days.',
  kind: 'audience-list',
  filters: [
    { name: 'added_date_from', label: 'Added from', kind: 'date', width: 'sm' },
    { name: 'added_date_to', label: 'Added to', kind: 'date', width: 'sm' },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.newEntrants90d(req),
  signalColumns: [
    {
      key: 'added_date',
      header: 'Added',
      render: (r) => formatDate(r.audience_signal.added_date),
    },
    {
      key: 'days_since_added',
      header: 'Days',
      align: 'right',
      render: (r) => formatNumber(r.audience_signal.days_since_added),
    },
    {
      key: 'mc_mx_ff_numbers',
      header: 'MC/MX/FF',
      truncate: true,
      mono: true,
      render: (r) => formatList(r.audience_signal.mc_mx_ff_numbers),
    },
  ],
};

const authorityGrants: AudienceListEndpoint<AuthorityGrantsSignal> = {
  slug: 'audiences/authority-grants',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Authority grants',
  description: 'Carriers granted operating authority in the lookback window.',
  kind: 'audience-list',
  filters: [
    { name: 'decision_date_from', label: 'Decision from', kind: 'date', width: 'sm' },
    { name: 'decision_date_to', label: 'Decision to', kind: 'date', width: 'sm' },
    {
      name: 'authority_type',
      label: 'Authority type',
      kind: 'multiselect',
      options: AUTHORITY_TYPE_OPTIONS,
      width: 'md',
    },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.authorityGrants(req),
  signalColumns: [
    {
      key: 'final_authority_decision_date',
      header: 'Decision',
      render: (r) => formatDate(r.audience_signal.final_authority_decision_date),
    },
    {
      key: 'days_since_granted',
      header: 'Days',
      align: 'right',
      render: (r) => formatNumber(r.audience_signal.days_since_granted),
    },
    {
      key: 'authority_type',
      header: 'Type',
      render: (r) => formatText(r.audience_signal.authority_type),
    },
    {
      key: 'docket_number',
      header: 'Docket',
      mono: true,
      render: (r) => formatText(r.audience_signal.docket_number),
    },
  ],
};

const insuranceLapses: AudienceListEndpoint<InsuranceLapsesSignal> = {
  slug: 'audiences/insurance-lapses',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Insurance lapses',
  description: 'Carriers with cancelled insurance policies.',
  kind: 'audience-list',
  filters: [
    { name: 'cancel_date_from', label: 'Cancel from', kind: 'date', width: 'sm' },
    { name: 'cancel_date_to', label: 'Cancel to', kind: 'date', width: 'sm' },
    {
      name: 'policy_type',
      label: 'Policy type',
      kind: 'multiselect',
      options: POLICY_TYPE_OPTIONS,
      width: 'md',
    },
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
  signalColumns: [
    {
      key: 'cancel_effective_date',
      header: 'Cancelled',
      render: (r) => formatDate(r.audience_signal.cancel_effective_date),
    },
    {
      key: 'days_since_cancel',
      header: 'Days',
      align: 'right',
      render: (r) => formatNumber(r.audience_signal.days_since_cancel),
    },
    {
      key: 'policy_type',
      header: 'Policy',
      render: (r) => formatText(r.audience_signal.policy_type),
    },
    {
      key: 'current_policy_status',
      header: 'Current',
      render: (r) => formatText(r.audience_signal.current_policy_status),
    },
    {
      key: 'carrier_name_on_policy',
      header: 'Insurer',
      truncate: true,
      render: (r) => formatText(r.audience_signal.carrier_name_on_policy),
    },
  ],
};

const highRiskSafety: AudienceListEndpoint<HighRiskSafetySignal> = {
  slug: 'audiences/high-risk-safety',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'High-risk safety',
  description: 'Carriers with elevated CSA percentiles, crashes, or OOS orders.',
  kind: 'audience-list',
  filters: [
    {
      name: 'min_percentile',
      label: 'Min percentile',
      kind: 'number',
      placeholder: '90',
      width: 'sm',
    },
    { name: 'min_crash_count', label: 'Min crashes (12mo)', kind: 'number', width: 'sm' },
    { name: 'has_active_oos', label: 'Active OOS only', kind: 'boolean', width: 'sm' },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.highRiskSafety(req),
  signalColumns: [
    {
      key: 'highest_percentile_basic',
      header: 'BASIC',
      render: (r) => formatText(r.audience_signal.highest_percentile_basic),
    },
    {
      key: 'highest_percentile_value',
      header: 'Pctile',
      align: 'right',
      render: (r) => formatPercentile(r.audience_signal.highest_percentile_value),
    },
    {
      key: 'crash_count_12mo',
      header: 'Crashes',
      align: 'right',
      render: (r) => formatNumber(r.audience_signal.crash_count_12mo),
    },
    {
      key: 'latest_oos_order_date',
      header: 'Last OOS',
      render: (r) => formatDate(r.audience_signal.latest_oos_order_date),
    },
  ],
};

const insuranceRenewalWindow: AudienceListEndpoint<InsuranceRenewalWindowSignal> = {
  slug: 'audiences/insurance-renewal-window',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Insurance renewal window',
  description: 'Policies approaching expiration in the lookahead window.',
  kind: 'audience-list',
  filters: [
    {
      name: 'expiration_window_days',
      label: 'Window (days)',
      kind: 'number',
      placeholder: '30',
      width: 'sm',
    },
    {
      name: 'policy_type',
      label: 'Policy type',
      kind: 'multiselect',
      options: POLICY_TYPE_OPTIONS,
      width: 'md',
    },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.insuranceRenewalWindow(req),
  signalColumns: [
    {
      key: 'policy_expiration_date',
      header: 'Expires',
      render: (r) => formatDate(r.audience_signal.policy_expiration_date),
    },
    {
      key: 'days_to_expiration',
      header: 'Days',
      align: 'right',
      render: (r) => formatNumber(r.audience_signal.days_to_expiration),
    },
    {
      key: 'policy_type',
      header: 'Policy',
      render: (r) => formatText(r.audience_signal.policy_type),
    },
    {
      key: 'min_coverage_required',
      header: 'Min coverage',
      align: 'right',
      render: (r) => formatNumber(r.audience_signal.min_coverage_required),
    },
    {
      key: 'carrier_name_on_policy',
      header: 'Insurer',
      truncate: true,
      render: (r) => formatText(r.audience_signal.carrier_name_on_policy),
    },
  ],
};

const recentRevocations: AudienceListEndpoint<RecentRevocationsSignal> = {
  slug: 'audiences/recent-revocations',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Recent revocations',
  description: 'Carriers with operating authority recently revoked.',
  kind: 'audience-list',
  filters: [
    { name: 'revocation_date_from', label: 'Revoked from', kind: 'date', width: 'sm' },
    { name: 'revocation_date_to', label: 'Revoked to', kind: 'date', width: 'sm' },
    {
      name: 'authority_type',
      label: 'Authority type',
      kind: 'multiselect',
      options: AUTHORITY_TYPE_OPTIONS,
      width: 'md',
    },
  ],
  commonFilters: audienceCommonFilters,
  fetch: (req) => audiences.recentRevocations(req),
  signalColumns: [
    {
      key: 'final_revocation_decision_date',
      header: 'Revoked',
      render: (r) => formatDate(r.audience_signal.final_revocation_decision_date),
    },
    {
      key: 'days_since_revocation',
      header: 'Days',
      align: 'right',
      render: (r) => formatNumber(r.audience_signal.days_since_revocation),
    },
    {
      key: 'authority_type',
      header: 'Type',
      render: (r) => formatText(r.audience_signal.authority_type),
    },
    {
      key: 'revocation_reason',
      header: 'Reason',
      truncate: true,
      render: (r) => formatText(r.audience_signal.revocation_reason),
    },
    {
      key: 'docket_number',
      header: 'Docket',
      mono: true,
      render: (r) => formatText(r.audience_signal.docket_number),
    },
  ],
};

// ---------------------------------------------------------------------------
// Carrier endpoints
// ---------------------------------------------------------------------------

const carrierSearch: CarrierListEndpoint = {
  slug: 'carriers/search',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Search',
  description: 'Full carrier search with safety, contact, and fleet filters.',
  kind: 'carrier-list',
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
    {
      name: 'max_controlled_substances',
      label: 'Max ctrl subs %',
      kind: 'number',
      width: 'sm',
    },
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
  extraColumns: [
    {
      key: 'safety_rating_code',
      header: 'Rating',
      render: (r) => formatText(r.safety_rating_code),
    },
    {
      key: 'crash_count_12mo',
      header: 'Crashes',
      align: 'right',
      render: (r) => formatNumber(r.crash_count_12mo),
    },
  ],
};

const carrierStats: CarrierStatsEndpoint = {
  slug: 'carriers/stats',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Stats',
  description: 'Aggregate carrier counts, alerts, and recent activity.',
  kind: 'carrier-stats',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
  ],
  fetch: (req) => carriers.stats(req),
};

const insuranceCancellations: CarrierListEndpoint = {
  slug: 'carriers/insurance-cancellations',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Insurance cancellations',
  description: 'Carriers with cancelled insurance — list view.',
  kind: 'carrier-list',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'cancel_date_from', label: 'Cancel from', kind: 'date', width: 'sm' },
    { name: 'cancel_date_to', label: 'Cancel to', kind: 'date', width: 'sm' },
    { name: 'insurance_type', label: 'Insurance type', kind: 'text', width: 'sm' },
    { name: 'min_power_units', label: 'Min PU', kind: 'number', width: 'sm' },
    { name: 'max_power_units', label: 'Max PU', kind: 'number', width: 'sm' },
    { name: 'safe_only', label: 'Safe only', kind: 'boolean', width: 'sm' },
  ],
  fetch: (req) => carriers.insuranceCancellations(req),
};

const newAuthority: CarrierListEndpoint = {
  slug: 'carriers/new-authority',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'New authority',
  description: 'Carriers granted new authority in the date window.',
  kind: 'carrier-list',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'served_date_from', label: 'Served from', kind: 'date', width: 'sm' },
    { name: 'served_date_to', label: 'Served to', kind: 'date', width: 'sm' },
    {
      name: 'authority_type',
      label: 'Authority type',
      kind: 'select',
      options: AUTHORITY_TYPE_OPTIONS,
      width: 'sm',
    },
    { name: 'min_power_units', label: 'Min PU', kind: 'number', width: 'sm' },
    { name: 'max_power_units', label: 'Max PU', kind: 'number', width: 'sm' },
    { name: 'safe_only', label: 'Safe only', kind: 'boolean', width: 'sm' },
  ],
  fetch: (req) => carriers.newAuthority(req),
};

const safeNewEntrants: CarrierListEndpoint = {
  slug: 'carriers/safe-new-entrants',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Safe new entrants',
  description: 'Recent new entrants without safety flags.',
  kind: 'carrier-list',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'date_from', label: 'From', kind: 'date', width: 'sm' },
    { name: 'date_to', label: 'To', kind: 'date', width: 'sm' },
    { name: 'min_power_units', label: 'Min PU', kind: 'number', width: 'sm' },
    { name: 'max_power_units', label: 'Max PU', kind: 'number', width: 'sm' },
  ],
  fetch: (req) => carriers.safeNewEntrants(req),
};

const safeLosingCoverage: CarrierListEndpoint = {
  slug: 'carriers/safe-losing-coverage',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Safe losing coverage',
  description: 'Safe carriers with insurance lapses — high-fit prospects.',
  kind: 'carrier-list',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'date_from', label: 'From', kind: 'date', width: 'sm' },
    { name: 'date_to', label: 'To', kind: 'date', width: 'sm' },
    { name: 'min_power_units', label: 'Min PU', kind: 'number', width: 'sm' },
    { name: 'max_power_units', label: 'Max PU', kind: 'number', width: 'sm' },
  ],
  fetch: (req) => carriers.safeLosingCoverage(req),
};

const safeMidMarket: CarrierListEndpoint = {
  slug: 'carriers/safe-mid-market',
  group: 'carriers',
  groupLabel: 'Carriers',
  label: 'Safe mid-market',
  description: 'Mid-market safe carriers.',
  kind: 'carrier-list',
  filters: [
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
  ],
  fetch: (req) => carriers.safeMidMarket(req),
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const ENDPOINTS: FmcsaEndpoint[] = [
  newEntrants90d as unknown as FmcsaEndpoint,
  authorityGrants as unknown as FmcsaEndpoint,
  insuranceLapses as unknown as FmcsaEndpoint,
  highRiskSafety as unknown as FmcsaEndpoint,
  insuranceRenewalWindow as unknown as FmcsaEndpoint,
  recentRevocations as unknown as FmcsaEndpoint,
  carrierSearch,
  carrierStats,
  insuranceCancellations,
  newAuthority,
  safeNewEntrants,
  safeLosingCoverage,
  safeMidMarket,
];

export { DEFAULT_SLUG };

export function findEndpoint(slug: string): FmcsaEndpoint | undefined {
  return ENDPOINTS.find((e) => e.slug === slug);
}

export function audienceColumns<T>(
  endpoint: AudienceListEndpoint<T>,
): ColumnDef<AudienceRow<T>>[] {
  return [
    ...audienceBaseColumns<T>(),
    ...endpoint.signalColumns,
    {
      key: 'last_seen_feed_date',
      header: 'Last seen',
      render: (r) => formatDate(r.last_seen_feed_date),
    },
  ];
}

export function carrierColumns(endpoint: CarrierListEndpoint): ColumnDef<CarrierRow>[] {
  return [...carrierBaseColumns, ...(endpoint.extraColumns ?? [])];
}

export function endpointGroups(): { label: string; group: EndpointGroup; items: FmcsaEndpoint[] }[] {
  return [
    {
      label: 'Audiences',
      group: 'audiences',
      items: ENDPOINTS.filter((e) => e.group === 'audiences'),
    },
    {
      label: 'Carriers',
      group: 'carriers',
      items: ENDPOINTS.filter((e) => e.group === 'carriers'),
    },
  ];
}

export function allFilters(endpoint: FmcsaEndpoint): FilterField[] {
  return [...endpoint.filters, ...(endpoint.commonFilters ?? [])];
}

export { formatBool, formatDate, formatList, formatNumber, formatPercentile, formatText };
