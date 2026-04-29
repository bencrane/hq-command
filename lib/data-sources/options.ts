import type { FilterFieldOption } from './types';

export const STATE_OPTIONS: FilterFieldOption[] = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA',
  'ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK',
  'OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
].map((s) => ({ value: s, label: s }));

export const FMCSA_OPERATION_CODE_OPTIONS: FilterFieldOption[] = [
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

export const FMCSA_AUTHORITY_STATUS_OPTIONS: FilterFieldOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'any', label: 'Any' },
];

export const FMCSA_POLICY_TYPE_OPTIONS: FilterFieldOption[] = [
  { value: 'BIPD', label: 'BIPD' },
  { value: 'CARGO', label: 'Cargo' },
  { value: 'BOND', label: 'Bond' },
  { value: 'TRUST', label: 'Trust' },
];

export const FMCSA_AUTHORITY_TYPE_OPTIONS: FilterFieldOption[] = [
  { value: 'common', label: 'Common' },
  { value: 'contract', label: 'Contract' },
  { value: 'broker', label: 'Broker' },
];

export const SET_ASIDE_OPTIONS: FilterFieldOption[] = [
  { value: 'small_business', label: 'Small Business' },
  { value: 'sba_8a', label: '8(a)' },
  { value: 'hubzone', label: 'HUBZone' },
  { value: 'sdvosb', label: 'SDVOSB' },
  { value: 'wosb', label: 'WOSB' },
  { value: 'edwosb', label: 'EDWOSB' },
  { value: 'vosb', label: 'VOSB' },
  { value: 'minority_owned', label: 'Minority-owned' },
];

export const SPEND_BAND_OPTIONS: FilterFieldOption[] = [
  { value: 'lt_100k', label: '< $100K' },
  { value: '100k_1m', label: '$100K – $1M' },
  { value: '1m_10m', label: '$1M – $10M' },
  { value: '10m_100m', label: '$10M – $100M' },
  { value: 'gt_100m', label: '> $100M' },
];

export const ADDRESS_QUALITY_OPTIONS: FilterFieldOption[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const AWARD_RECENCY_OPTIONS: FilterFieldOption[] = [
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'last_90d', label: 'Last 90 days' },
  { value: 'last_180d', label: 'Last 180 days' },
  { value: 'last_365d', label: 'Last 365 days' },
];

export const SAM_REGISTRATION_STATUS_OPTIONS: FilterFieldOption[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Expired', label: 'Expired' },
];

/** NAICS sector codes (2-digit prefix). */
export const NAICS_SECTOR_OPTIONS: FilterFieldOption[] = [
  { value: '11', label: '11 · Agriculture' },
  { value: '21', label: '21 · Mining' },
  { value: '22', label: '22 · Utilities' },
  { value: '23', label: '23 · Construction' },
  { value: '31', label: '31 · Manufacturing' },
  { value: '32', label: '32 · Manufacturing' },
  { value: '33', label: '33 · Manufacturing' },
  { value: '42', label: '42 · Wholesale' },
  { value: '44', label: '44 · Retail' },
  { value: '45', label: '45 · Retail' },
  { value: '48', label: '48 · Transportation' },
  { value: '49', label: '49 · Transportation/Warehousing' },
  { value: '51', label: '51 · Information' },
  { value: '52', label: '52 · Finance' },
  { value: '53', label: '53 · Real Estate' },
  { value: '54', label: '54 · Professional/Scientific' },
  { value: '55', label: '55 · Management' },
  { value: '56', label: '56 · Admin/Support' },
  { value: '61', label: '61 · Education' },
  { value: '62', label: '62 · Healthcare' },
  { value: '71', label: '71 · Arts/Entertainment' },
  { value: '72', label: '72 · Accommodation/Food' },
  { value: '81', label: '81 · Other Services' },
  { value: '92', label: '92 · Public Admin' },
];
