'use client';

import { dexGet, dexPost, type DataEnvelope } from './client';

// ---------------------------------------------------------------------------
// Common — recipient (UEI grain) over mv_govcontracts_recipient_targeting
// ---------------------------------------------------------------------------

export interface RecipientRow {
  uei: string | null;
  recipient_name: string | null;
  physical_state: string | null;
  physical_city: string | null;
  physical_zip5: string | null;
  physical_zip3: string | null;
  congressional_district: string | null;
  primary_naics_code: string | null;
  primary_naics_description: string | null;
  naics_sector: string | null;
  vertical_keys: string[] | null;
  set_aside_flags: string[] | null;
  spend_band_12mo: string | null;
  obligation_12mo: number | null;
  obligation_90d: number | null;
  obligation_365d: number | null;
  obligation_all_time: number | null;
  award_count_12mo: number | null;
  latest_contract_date: string | null;
  first_contract_date: string | null;
  is_first_time_winner: boolean | null;
  award_recency_band: string | null;
  address_quality: string | null;
  is_mailable_us: boolean | null;
  sam_active: boolean | null;
  agencies_top: string[] | null;
  [extra: string]: unknown;
}

export interface RecipientListData {
  items: RecipientRow[];
  total?: number;
  has_more?: boolean;
  limit: number;
  offset: number;
  returned?: number;
  [extra: string]: unknown;
}

export type RecipientListEnvelope = DataEnvelope<RecipientListData>;
export type RecipientDetailEnvelope = DataEnvelope<Record<string, unknown>>;

// ---------------------------------------------------------------------------
// Audience requests — base shared by all govcontracts audiences
// ---------------------------------------------------------------------------

export interface RecipientAudienceBaseFilters {
  physical_state?: string[];
  physical_zip3?: string[];
  physical_zip5?: string[];
  congressional_district?: string[];
  naics_sectors?: string[];
  sector_codes?: string[];
  vertical_keys?: string[];
  set_aside_flags?: string[];
  spend_band_12mo?: string[];
  address_quality?: string[];
  is_mailable_us?: boolean;
  sam_active?: boolean;
  award_recency_bands?: string[];
  min_obligation_12mo?: number;
  min_obligation_90d?: number;
  min_obligation_365d?: number;
  agencies_any?: string[];
  limit?: number;
  offset?: number;
}

export interface RecentWinnersRequest extends RecipientAudienceBaseFilters {
  latest_contract_date_from?: string;
  latest_contract_date_to?: string;
}

export interface FirstTimeWinnersRequest extends RecipientAudienceBaseFilters {
  first_contract_date_from?: string;
  first_contract_date_to?: string;
}

export interface SetAsideCohortRequest extends RecipientAudienceBaseFilters {
  set_aside_flags: string[]; // required, min 1
}

export type IndustryCohortRequest = RecipientAudienceBaseFilters;

export interface GeoCohortRequest extends RecipientAudienceBaseFilters {
  physical_state: string[]; // required, min 1
}

export interface HighValueRecipientsRequest extends RecipientAudienceBaseFilters {
  min_obligation_12mo?: number; // default 1_000_000.0
}

// ---------------------------------------------------------------------------
// Federal contract leads (entities-v1 surface)
// ---------------------------------------------------------------------------

export interface FederalContractLeadsQueryRequest {
  naics_prefix?: string;
  state?: string;
  action_date_from?: string;
  action_date_to?: string;
  min_obligation?: number;
  business_size?: string;
  first_time_only?: boolean;
  first_time_dod_only?: boolean;
  first_time_nasa_only?: boolean;
  first_time_doe_only?: boolean;
  first_time_dhs_only?: boolean;
  awarding_agency_code?: string;
  has_sam_match?: boolean;
  recipient_uei?: string;
  recipient_name?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export const govAudiences = {
  recentWinners: (req: RecentWinnersRequest = {}) =>
    dexPost<RecentWinnersRequest, RecipientListEnvelope>(
      '/api/v1/govcontracts/audiences/recent-winners',
      req,
    ),

  firstTimeWinners: (req: FirstTimeWinnersRequest = {}) =>
    dexPost<FirstTimeWinnersRequest, RecipientListEnvelope>(
      '/api/v1/govcontracts/audiences/first-time-winners',
      req,
    ),

  setAsideCohort: (req: SetAsideCohortRequest) =>
    dexPost<SetAsideCohortRequest, RecipientListEnvelope>(
      '/api/v1/govcontracts/audiences/set-aside-cohort',
      req,
    ),

  industryCohort: (req: IndustryCohortRequest = {}) =>
    dexPost<IndustryCohortRequest, RecipientListEnvelope>(
      '/api/v1/govcontracts/audiences/industry-cohort',
      req,
    ),

  geoCohort: (req: GeoCohortRequest) =>
    dexPost<GeoCohortRequest, RecipientListEnvelope>(
      '/api/v1/govcontracts/audiences/geo-cohort',
      req,
    ),

  highValueRecipients: (req: HighValueRecipientsRequest = {}) =>
    dexPost<HighValueRecipientsRequest, RecipientListEnvelope>(
      '/api/v1/govcontracts/audiences/high-value-recipients',
      req,
    ),
};

export const federalLeads = {
  query: (req: FederalContractLeadsQueryRequest = {}) =>
    dexPost<FederalContractLeadsQueryRequest, RecipientListEnvelope>(
      '/api/v1/federal-contract-leads/query',
      req,
    ),

  stats: () =>
    dexPost<Record<string, never>, DataEnvelope<Record<string, unknown>>>(
      '/api/v1/federal-contract-leads/stats',
      {},
    ),

  byUei: (uei: string) =>
    dexGet<RecipientDetailEnvelope>(
      `/api/v1/federal-contract-leads/${encodeURIComponent(uei)}`,
    ),
};
