'use client';

import { dexGet, dexPost, type DataEnvelope } from './client';

// ---------------------------------------------------------------------------
// SAM entity rows — over mv_sam_gov_entities_typed
// ---------------------------------------------------------------------------

export interface SamEntityRow {
  uei: string | null;
  legal_business_name: string | null;
  dba_name: string | null;
  physical_state: string | null;
  physical_city: string | null;
  physical_address: string | null;
  physical_zip: string | null;
  registration_status: string | null;
  registration_date: string | null;
  registration_expiration_date: string | null;
  initial_registration_date: string | null;
  last_update_date: string | null;
  primary_naics_code: string | null;
  cage_code: string | null;
  entity_url: string | null;
  business_types: string[] | null;
  [extra: string]: unknown;
}

export interface SamEntitySearchData {
  items: SamEntityRow[];
  total?: number;
  has_more?: boolean;
  limit: number;
  offset: number;
  [extra: string]: unknown;
}

export type SamEntitySearchEnvelope = DataEnvelope<SamEntitySearchData>;
export type SamEntityDetailEnvelope = DataEnvelope<SamEntityRow>;

export interface SamEntityStatsData {
  total_entities: number;
  active_entities: number;
  expired_entities: number;
  by_state?: { state: string; count: number }[];
  [extra: string]: unknown;
}

export type SamEntityStatsEnvelope = DataEnvelope<SamEntityStatsData>;

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface SamEntitySearchRequest {
  state?: string;
  naics_code?: string;
  naics_prefix?: string;
  registration_status?: string;
  entity_name?: string;
  uei?: string;
  limit?: number;
  offset?: number;
}

export interface SamEntityStatsRequest {
  state?: string;
}

// ---------------------------------------------------------------------------
// SAM × PDL match
// ---------------------------------------------------------------------------

export interface SamPdlMatchRow {
  pdl_id: string;
  sam_uei: string;
  name_normalized: string | null;
  state_lower: string | null;
  pdl_domain_normalized: string | null;
  sam_domain_normalized: string | null;
  pdl_locality_lower: string | null;
  sam_city_lower: string | null;
  sam_legal_business_name: string | null;
  sam_entity_url: string | null;
  sam_last_update_date: string | null;
  pdl_name: string | null;
  pdl_website: string | null;
  pdl_linkedin_url: string | null;
  pdl_industry: string | null;
  pdl_size_bucket: string | null;
  pdl_founded_year: number | null;
  match_score: number;
  confidence_tier: 'high' | 'medium';
  match_reasons: string[];
}

export interface SamPdlMatchData {
  uei: string;
  total_matches: number;
  returned: number;
  matches: SamPdlMatchRow[];
}

export type SamPdlMatchEnvelope = DataEnvelope<SamPdlMatchData>;

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export const samEntities = {
  search: (req: SamEntitySearchRequest = {}) =>
    dexPost<SamEntitySearchRequest, SamEntitySearchEnvelope>(
      '/api/v1/sam/entities/search',
      req,
    ),

  stats: (req: SamEntityStatsRequest = {}) =>
    dexPost<SamEntityStatsRequest, SamEntityStatsEnvelope>(
      '/api/v1/sam/entities/stats',
      req,
    ),

  byUei: (uei: string) =>
    dexGet<SamEntityDetailEnvelope>(
      `/api/v1/sam/entities/${encodeURIComponent(uei)}`,
    ),

  pdlMatches: (
    uei: string,
    opts: { min_score?: number; limit?: number; confidence_tier?: 'high' | 'medium' } = {},
  ) => {
    const qs = new URLSearchParams();
    if (opts.min_score != null) qs.set('min_score', String(opts.min_score));
    if (opts.limit != null) qs.set('limit', String(opts.limit));
    if (opts.confidence_tier) qs.set('confidence_tier', opts.confidence_tier);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return dexGet<SamPdlMatchEnvelope>(
      `/api/v1/sam/${encodeURIComponent(uei)}/pdl-matches${suffix}`,
    );
  },
};
