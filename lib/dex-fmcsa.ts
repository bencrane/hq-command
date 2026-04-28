'use client';

import { dexFetch } from '@/lib/dex';

/**
 * Typed wrappers for data-engine-x FMCSA endpoints.
 *
 * Two families:
 *  - audiences/* — POST, return AudienceListEnvelope<Signal>
 *  - carriers/*  — POST (search/stats/lookups), GET /{dot_number} (detail)
 *
 * Endpoints in the original directive that don't exist in DEX
 * (first-time-winners, contracts, /carriers/lookup) are not wrapped.
 * Carrier endpoints listed in the directive as GET are POST in DEX.
 */

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

export interface DataEnvelope<T> {
  data: T;
}

export interface MvSource {
  view: string;
  last_analyze: string | null;
  caveat: string;
}

export interface AudienceListData<TSignal> {
  items: AudienceRow<TSignal>[];
  total: number;
  has_more: boolean;
  limit: number;
  offset: number;
  mv_sources: MvSource[];
  generated_at: string;
}

export type AudienceListEnvelope<TSignal> = DataEnvelope<AudienceListData<TSignal>>;

export interface AudienceRow<TSignal> {
  dot_number: string;
  legal_name: string | null;
  dba_name: string | null;
  physical_state: string | null;
  physical_city: string | null;
  power_unit_count: number | null;
  driver_total: number | null;
  carrier_operation_code: string | null;
  mc_mx_ff_numbers: string[];
  last_seen_feed_date: string | null;
  audience_signal: TSignal;
}

export interface AudienceBaseFilters {
  physical_state?: string[];
  power_units_min?: number;
  power_units_max?: number;
  driver_total_min?: number;
  driver_total_max?: number;
  hazmat_flag?: boolean;
  carrier_operation_code?: string[];
  authority_status?: 'active' | 'inactive' | 'any';
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Audience signal types (per endpoint)
// ---------------------------------------------------------------------------

export interface NewEntrants90dSignal {
  added_date: string;
  days_since_added: number;
  mc_mx_ff_numbers: string[];
}

export interface AuthorityGrantsSignal {
  final_authority_decision_date: string;
  authority_type: string;
  docket_number: string;
  mc_mx_ff_number: string;
  days_since_granted: number;
}

export interface InsuranceLapsesSignal {
  cancel_effective_date: string;
  cancellation_method: string;
  policy_type: string;
  carrier_name_on_policy: string;
  days_since_cancel: number;
  current_policy_status: 'reinstated' | 'uninsured';
}

export interface HighRiskSafetySignal {
  unsafe_driving_pct: number | null;
  hours_of_service_pct: number | null;
  driver_fitness_pct: number | null;
  vehicle_maint_pct: number | null;
  controlled_substances_alcohol_pct: number | null;
  crash_count_12mo: number | null;
  latest_oos_order_date: string | null;
  latest_oos_order_reason: string | null;
  highest_percentile_basic: string | null;
  highest_percentile_value: number | null;
}

export interface InsuranceRenewalWindowSignal {
  policy_expiration_date: string;
  days_to_expiration: number;
  policy_type: string;
  min_coverage_required: number | null;
  carrier_name_on_policy: string;
  policy_effective_date: string;
  expiration_date_is_approximation: boolean;
}

export interface RecentRevocationsSignal {
  final_revocation_decision_date: string;
  revocation_reason: string;
  authority_type: string;
  docket_number: string;
  mc_mx_ff_number: string;
  serve_date: string | null;
  days_since_revocation: number;
}

// ---------------------------------------------------------------------------
// Audience requests
// ---------------------------------------------------------------------------

export interface NewEntrants90dRequest extends AudienceBaseFilters {
  added_date_from?: string;
  added_date_to?: string;
}

export interface AuthorityGrantsRequest extends AudienceBaseFilters {
  decision_date_from?: string;
  decision_date_to?: string;
  authority_type?: string[];
}

export interface InsuranceLapsesRequest extends AudienceBaseFilters {
  cancel_date_from?: string;
  cancel_date_to?: string;
  policy_type?: string[];
  current_insurance_status?: 'uninsured' | 'reinstated' | 'any';
}

export interface HighRiskSafetyRequest extends AudienceBaseFilters {
  min_percentile?: number;
  min_crash_count?: number;
  has_active_oos?: boolean;
}

export interface InsuranceRenewalWindowRequest extends AudienceBaseFilters {
  expiration_window_days?: number;
  policy_type?: string[];
}

export interface RecentRevocationsRequest extends AudienceBaseFilters {
  revocation_date_from?: string;
  revocation_date_to?: string;
  authority_type?: string[];
}

// ---------------------------------------------------------------------------
// Carrier requests
// ---------------------------------------------------------------------------

export interface CarrierSearchRequest {
  state?: string;
  city?: string;
  min_power_units?: number;
  max_power_units?: number;
  max_unsafe_driving?: number;
  max_hos?: number;
  max_vehicle_maintenance?: number;
  max_driver_fitness?: number;
  max_controlled_substances?: number;
  has_alerts?: boolean;
  has_crashes?: boolean;
  has_email?: boolean;
  has_phone?: boolean;
  safety_rating_code?: string;
  legal_name_contains?: string;
  sort_by?: 'fleet_size' | 'state' | 'safety';
  limit?: number;
  offset?: number;
}

export interface CarrierStatsRequest {
  state?: string;
}

export interface InsuranceCancellationSearchRequest {
  state?: string;
  cancel_date_from?: string;
  cancel_date_to?: string;
  insurance_type?: string;
  min_power_units?: number;
  max_power_units?: number;
  safe_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface NewAuthoritySearchRequest {
  state?: string;
  served_date_from?: string;
  served_date_to?: string;
  authority_type?: string;
  min_power_units?: number;
  max_power_units?: number;
  safe_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface SafeCarrierConvenienceRequest {
  state?: string;
  date_from?: string;
  date_to?: string;
  min_power_units?: number;
  max_power_units?: number;
  limit?: number;
  offset?: number;
}

export interface SafeMidMarketRequest {
  state?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Carrier responses
//
// DEX returns rows projected from mv_fmcsa_carrier_master without a Pydantic
// response model, so the row shape is permissive. The fields below are the
// columns documented across the carrier endpoints; additional columns may be
// present.
// ---------------------------------------------------------------------------

export interface CarrierRow {
  dot_number: string;
  legal_name: string | null;
  dba_name: string | null;
  physical_state: string | null;
  physical_city: string | null;
  power_unit_count: number | null;
  driver_total: number | null;
  carrier_operation_code: string | null;
  telephone: string | null;
  email_address: string | null;
  unsafe_driving_percentile: number | null;
  hours_of_service_percentile: number | null;
  vehicle_maintenance_percentile: number | null;
  driver_fitness_percentile: number | null;
  controlled_substances_alcohol_percentile: number | null;
  crash_count_12mo: number | null;
  status_code: string | null;
  safety_rating_code: string | null;
  unsafe_driving_basic_alert: boolean;
  hours_of_service_basic_alert: boolean;
  vehicle_maintenance_basic_alert: boolean;
  driver_fitness_basic_alert: boolean;
  controlled_substances_alcohol_basic_alert: boolean;
  [extra: string]: unknown;
}

export interface CarrierSearchData {
  items: CarrierRow[];
  total_matched: number;
  limit: number;
  offset: number;
}

export type CarrierSearchEnvelope = DataEnvelope<CarrierSearchData>;

export interface CarrierStatsData {
  total_carriers: number;
  carriers_by_state: { state: string; count: number }[];
  carriers_with_alerts: number;
  carriers_with_crashes: number;
  new_authority_last_30d: number;
  new_authority_last_60d: number;
  new_authority_last_90d: number;
  insurance_cancellations_last_30d: number;
  insurance_cancellations_last_60d: number;
  insurance_cancellations_last_90d: number;
}

export type CarrierStatsEnvelope = DataEnvelope<CarrierStatsData>;

export type CarrierListEnvelope = DataEnvelope<CarrierSearchData>;

export type CarrierDetailEnvelope = DataEnvelope<CarrierRow>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postJson<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  return dexFetch<TRes>(path, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}

// ---------------------------------------------------------------------------
// Audiences
// ---------------------------------------------------------------------------

export const audiences = {
  newEntrants90d: (req: NewEntrants90dRequest = {}) =>
    postJson<NewEntrants90dRequest, AudienceListEnvelope<NewEntrants90dSignal>>(
      '/api/v1/fmcsa/audiences/new-entrants-90d',
      req,
    ),

  authorityGrants: (req: AuthorityGrantsRequest = {}) =>
    postJson<AuthorityGrantsRequest, AudienceListEnvelope<AuthorityGrantsSignal>>(
      '/api/v1/fmcsa/audiences/authority-grants',
      req,
    ),

  insuranceLapses: (req: InsuranceLapsesRequest = {}) =>
    postJson<InsuranceLapsesRequest, AudienceListEnvelope<InsuranceLapsesSignal>>(
      '/api/v1/fmcsa/audiences/insurance-lapses',
      req,
    ),

  highRiskSafety: (req: HighRiskSafetyRequest = {}) =>
    postJson<HighRiskSafetyRequest, AudienceListEnvelope<HighRiskSafetySignal>>(
      '/api/v1/fmcsa/audiences/high-risk-safety',
      req,
    ),

  insuranceRenewalWindow: (req: InsuranceRenewalWindowRequest = {}) =>
    postJson<InsuranceRenewalWindowRequest, AudienceListEnvelope<InsuranceRenewalWindowSignal>>(
      '/api/v1/fmcsa/audiences/insurance-renewal-window',
      req,
    ),

  recentRevocations: (req: RecentRevocationsRequest = {}) =>
    postJson<RecentRevocationsRequest, AudienceListEnvelope<RecentRevocationsSignal>>(
      '/api/v1/fmcsa/audiences/recent-revocations',
      req,
    ),
};

// ---------------------------------------------------------------------------
// Carriers
// ---------------------------------------------------------------------------

export const carriers = {
  search: (req: CarrierSearchRequest = {}) =>
    postJson<CarrierSearchRequest, CarrierSearchEnvelope>(
      '/api/v1/fmcsa/carriers/search',
      req,
    ),

  stats: (req: CarrierStatsRequest = {}) =>
    postJson<CarrierStatsRequest, CarrierStatsEnvelope>(
      '/api/v1/fmcsa/carriers/stats',
      req,
    ),

  insuranceCancellations: (req: InsuranceCancellationSearchRequest = {}) =>
    postJson<InsuranceCancellationSearchRequest, CarrierListEnvelope>(
      '/api/v1/fmcsa/carriers/insurance-cancellations',
      req,
    ),

  newAuthority: (req: NewAuthoritySearchRequest = {}) =>
    postJson<NewAuthoritySearchRequest, CarrierListEnvelope>(
      '/api/v1/fmcsa/carriers/new-authority',
      req,
    ),

  safeNewEntrants: (req: SafeCarrierConvenienceRequest = {}) =>
    postJson<SafeCarrierConvenienceRequest, CarrierListEnvelope>(
      '/api/v1/fmcsa/carriers/safe-new-entrants',
      req,
    ),

  safeLosingCoverage: (req: SafeCarrierConvenienceRequest = {}) =>
    postJson<SafeCarrierConvenienceRequest, CarrierListEnvelope>(
      '/api/v1/fmcsa/carriers/safe-losing-coverage',
      req,
    ),

  safeMidMarket: (req: SafeMidMarketRequest = {}) =>
    postJson<SafeMidMarketRequest, CarrierListEnvelope>(
      '/api/v1/fmcsa/carriers/safe-mid-market',
      req,
    ),

  byDot: (dotNumber: string | number) =>
    dexFetch<CarrierDetailEnvelope>(
      `/api/v1/fmcsa/carriers/${encodeURIComponent(String(dotNumber))}`,
    ),
};
