'use client';

import {
  federalLeads,
  govAudiences,
  type RecipientRow,
} from '@/lib/dex/usaspending';
import { RecipientDrawer } from '@/components/data/drawers/recipient-drawer';
import {
  formatDate,
  formatList,
  formatNumber,
  formatText,
  formatUsdCompact,
  isoDaysAgo,
  isoToday,
} from '../format';
import {
  ADDRESS_QUALITY_OPTIONS,
  AWARD_RECENCY_OPTIONS,
  NAICS_SECTOR_OPTIONS,
  SET_ASIDE_OPTIONS,
  SPEND_BAND_OPTIONS,
  STATE_OPTIONS,
} from '../options';
import type { ColumnDef, DataSourceDef, FilterField, ListEndpoint } from '../types';

const recipientCommonFilters: FilterField[] = [
  { name: 'physical_state', label: 'State', kind: 'multiselect', options: STATE_OPTIONS, width: 'md' },
  { name: 'naics_sectors', label: 'NAICS sector', kind: 'multiselect', options: NAICS_SECTOR_OPTIONS, width: 'md' },
  { name: 'set_aside_flags', label: 'Set-asides', kind: 'multiselect', options: SET_ASIDE_OPTIONS, width: 'md' },
  { name: 'spend_band_12mo', label: 'Spend band (12mo)', kind: 'multiselect', options: SPEND_BAND_OPTIONS, width: 'md' },
  { name: 'address_quality', label: 'Address quality', kind: 'multiselect', options: ADDRESS_QUALITY_OPTIONS, width: 'md' },
  { name: 'award_recency_bands', label: 'Award recency', kind: 'multiselect', options: AWARD_RECENCY_OPTIONS, width: 'md' },
  { name: 'min_obligation_12mo', label: 'Min $ (12mo)', kind: 'number', width: 'sm' },
  { name: 'min_obligation_90d', label: 'Min $ (90d)', kind: 'number', width: 'sm' },
  { name: 'min_obligation_365d', label: 'Min $ (365d)', kind: 'number', width: 'sm' },
  { name: 'is_mailable_us', label: 'Mailable US', kind: 'boolean', width: 'sm' },
  { name: 'sam_active', label: 'SAM active', kind: 'boolean', width: 'sm' },
];

const recipientBaseColumns: ColumnDef<RecipientRow>[] = [
  { key: 'uei', header: 'UEI', mono: true, render: (r) => formatText(r.uei) },
  { key: 'recipient_name', header: 'Recipient', truncate: true, render: (r) => formatText(r.recipient_name) },
  { key: 'physical_state', header: 'State', render: (r) => formatText(r.physical_state) },
  { key: 'physical_city', header: 'City', truncate: true, render: (r) => formatText(r.physical_city) },
  { key: 'naics_sector', header: 'Sector', render: (r) => formatText(r.naics_sector) },
  { key: 'obligation_12mo', header: '12mo $', align: 'right', render: (r) => formatUsdCompact(r.obligation_12mo) },
  { key: 'award_count_12mo', header: 'Awards 12mo', align: 'right', render: (r) => formatNumber(r.award_count_12mo) },
];

// ---------------------------------------------------------------------------
// Audience endpoints
// ---------------------------------------------------------------------------

const recentWinners: ListEndpoint<RecipientRow> = {
  source: 'usaspending',
  slug: 'audiences/recent-winners',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Recent winners',
  description: 'Recipients with awards in the date window.',
  kind: 'list',
  detailKind: 'usa-recipient',
  detailIdKey: 'uei',
  filters: [
    { name: 'latest_contract_date_from', label: 'Latest from', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(90) },
    { name: 'latest_contract_date_to', label: 'Latest to', kind: 'date', width: 'sm', defaultValue: isoToday() },
  ],
  commonFilters: recipientCommonFilters,
  fetch: (req) => govAudiences.recentWinners(req),
  rowKey: (r) => r.uei ?? '',
  columns: [
    ...recipientBaseColumns,
    { key: 'latest_contract_date', header: 'Latest', render: (r) => formatDate(r.latest_contract_date) },
  ],
};

const firstTimeWinners: ListEndpoint<RecipientRow> = {
  source: 'usaspending',
  slug: 'audiences/first-time-winners',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'First-time winners',
  description: 'Recipients receiving their first federal contract in the window.',
  kind: 'list',
  detailKind: 'usa-recipient',
  detailIdKey: 'uei',
  filters: [
    { name: 'first_contract_date_from', label: 'First from', kind: 'date', width: 'sm', defaultValue: isoDaysAgo(180) },
    { name: 'first_contract_date_to', label: 'First to', kind: 'date', width: 'sm', defaultValue: isoToday() },
  ],
  commonFilters: recipientCommonFilters,
  fetch: (req) => govAudiences.firstTimeWinners(req),
  rowKey: (r) => r.uei ?? '',
  columns: [
    ...recipientBaseColumns,
    { key: 'first_contract_date', header: 'First award', render: (r) => formatDate(r.first_contract_date) },
  ],
};

const setAsideCohort: ListEndpoint<RecipientRow> = {
  source: 'usaspending',
  slug: 'audiences/set-aside-cohort',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Set-aside cohort',
  description: 'Recipients matching one or more set-aside categories.',
  kind: 'list',
  detailKind: 'usa-recipient',
  detailIdKey: 'uei',
  filters: [
    {
      name: 'set_aside_flags',
      label: 'Set-asides (required)',
      kind: 'multiselect',
      options: SET_ASIDE_OPTIONS,
      width: 'lg',
      defaultValue: ['small_business'],
    },
  ],
  commonFilters: recipientCommonFilters.filter((f) => f.name !== 'set_aside_flags'),
  fetch: (req) => govAudiences.setAsideCohort(req as never),
  rowKey: (r) => r.uei ?? '',
  columns: [
    ...recipientBaseColumns,
    { key: 'set_aside_flags', header: 'Flags', truncate: true, render: (r) => formatList(r.set_aside_flags) },
  ],
};

const industryCohort: ListEndpoint<RecipientRow> = {
  source: 'usaspending',
  slug: 'audiences/industry-cohort',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Industry cohort',
  description: 'Recipients filtered by NAICS sector / vertical.',
  kind: 'list',
  detailKind: 'usa-recipient',
  detailIdKey: 'uei',
  filters: [],
  commonFilters: recipientCommonFilters,
  fetch: (req) => govAudiences.industryCohort(req),
  rowKey: (r) => r.uei ?? '',
  columns: [
    ...recipientBaseColumns,
    { key: 'primary_naics_code', header: 'NAICS', mono: true, render: (r) => formatText(r.primary_naics_code) },
    { key: 'primary_naics_description', header: 'Industry', truncate: true, render: (r) => formatText(r.primary_naics_description) },
  ],
};

const geoCohort: ListEndpoint<RecipientRow> = {
  source: 'usaspending',
  slug: 'audiences/geo-cohort',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'Geo cohort',
  description: 'Recipients filtered by state, ZIP, or congressional district.',
  kind: 'list',
  detailKind: 'usa-recipient',
  detailIdKey: 'uei',
  filters: [
    {
      name: 'physical_state',
      label: 'State (required)',
      kind: 'multiselect',
      options: STATE_OPTIONS,
      width: 'lg',
      defaultValue: ['CA'],
    },
    { name: 'physical_zip3', label: 'ZIP3', kind: 'multiselect', options: [], width: 'md', placeholder: 'e.g. 902,945' },
    { name: 'physical_zip5', label: 'ZIP5', kind: 'multiselect', options: [], width: 'md' },
    { name: 'congressional_district', label: 'Congressional district', kind: 'multiselect', options: [], width: 'md' },
  ],
  commonFilters: recipientCommonFilters.filter((f) => f.name !== 'physical_state'),
  fetch: (req) => govAudiences.geoCohort(req as never),
  rowKey: (r) => r.uei ?? '',
  columns: [
    ...recipientBaseColumns,
    { key: 'physical_zip5', header: 'ZIP', mono: true, render: (r) => formatText(r.physical_zip5) },
    { key: 'congressional_district', header: 'CD', mono: true, render: (r) => formatText(r.congressional_district) },
  ],
};

const highValueRecipients: ListEndpoint<RecipientRow> = {
  source: 'usaspending',
  slug: 'audiences/high-value-recipients',
  group: 'audiences',
  groupLabel: 'Audiences',
  label: 'High-value recipients',
  description: 'Recipients with high obligation totals in the last 12 months.',
  kind: 'list',
  detailKind: 'usa-recipient',
  detailIdKey: 'uei',
  filters: [
    {
      name: 'min_obligation_12mo',
      label: 'Min $ (12mo)',
      kind: 'number',
      width: 'sm',
      defaultValue: '1000000',
      placeholder: '1000000',
    },
  ],
  commonFilters: recipientCommonFilters.filter((f) => f.name !== 'min_obligation_12mo'),
  fetch: (req) => govAudiences.highValueRecipients(req),
  rowKey: (r) => r.uei ?? '',
  columns: [
    ...recipientBaseColumns,
    { key: 'obligation_365d', header: '365d $', align: 'right', render: (r) => formatUsdCompact(r.obligation_365d) },
    { key: 'obligation_all_time', header: 'All-time $', align: 'right', render: (r) => formatUsdCompact(r.obligation_all_time) },
  ],
};

// ---------------------------------------------------------------------------
// Federal contract leads — entities-v1 surface (broader query)
// ---------------------------------------------------------------------------

const leadsQuery: ListEndpoint<RecipientRow> = {
  source: 'usaspending',
  slug: 'leads/query',
  group: 'leads',
  groupLabel: 'Federal Contract Leads',
  label: 'Query',
  description: 'Federal contract leads view — flexible filters across recipients.',
  kind: 'list',
  detailKind: 'usa-recipient',
  detailIdKey: 'uei',
  filters: [
    { name: 'naics_prefix', label: 'NAICS prefix', kind: 'text', width: 'sm', placeholder: 'e.g. 541' },
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'action_date_from', label: 'Action from', kind: 'date', width: 'sm' },
    { name: 'action_date_to', label: 'Action to', kind: 'date', width: 'sm' },
    { name: 'min_obligation', label: 'Min obligation', kind: 'number', width: 'sm' },
    { name: 'business_size', label: 'Business size', kind: 'text', width: 'sm' },
    { name: 'first_time_only', label: 'First-time only', kind: 'boolean', width: 'sm' },
    { name: 'first_time_dod_only', label: 'First-time DoD', kind: 'boolean', width: 'sm' },
    { name: 'first_time_nasa_only', label: 'First-time NASA', kind: 'boolean', width: 'sm' },
    { name: 'first_time_doe_only', label: 'First-time DoE', kind: 'boolean', width: 'sm' },
    { name: 'first_time_dhs_only', label: 'First-time DHS', kind: 'boolean', width: 'sm' },
    { name: 'awarding_agency_code', label: 'Agency code', kind: 'text', width: 'sm' },
    { name: 'has_sam_match', label: 'Has SAM match', kind: 'boolean', width: 'sm' },
    { name: 'recipient_uei', label: 'Recipient UEI', kind: 'text', width: 'sm' },
    { name: 'recipient_name', label: 'Recipient name', kind: 'text', width: 'md' },
  ],
  fetch: (req) => federalLeads.query(req),
  rowKey: (r) => r.uei ?? '',
  columns: recipientBaseColumns,
};

// ---------------------------------------------------------------------------
// Source descriptor
// ---------------------------------------------------------------------------

export const usaspendingSource: DataSourceDef = {
  id: 'usaspending',
  label: 'USAspending',
  shortLabel: 'USAspending',
  pathSegment: 'usaspending',
  defaultSlug: 'audiences/recent-winners',
  groups: [
    { id: 'audiences', label: 'Audiences', icon: 'Boxes' },
    { id: 'leads', label: 'Federal Contract Leads', icon: 'FileText' },
  ],
  endpoints: [
    recentWinners,
    firstTimeWinners,
    setAsideCohort,
    industryCohort,
    geoCohort,
    highValueRecipients,
    leadsQuery,
  ],
  detailDrawers: {
    'usa-recipient': RecipientDrawer,
  },
};
