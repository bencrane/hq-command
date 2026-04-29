'use client';

import { samEntities, type SamEntityRow, type SamEntityStatsData } from '@/lib/dex/sam';
import { SamEntityDrawer } from '@/components/data/drawers/sam-entity-drawer';
import { SamStatsPanel } from '@/components/data/panels/sam-stats-panel';
import { formatDate, formatList, formatText } from '../format';
import { SAM_REGISTRATION_STATUS_OPTIONS, STATE_OPTIONS } from '../options';
import type { ColumnDef, DataSourceDef, ListEndpoint, StatsEndpoint } from '../types';

const entityBaseColumns: ColumnDef<SamEntityRow>[] = [
  { key: 'uei', header: 'UEI', mono: true, render: (r) => formatText(r.uei) },
  { key: 'legal_business_name', header: 'Legal name', truncate: true, render: (r) => formatText(r.legal_business_name) },
  { key: 'physical_state', header: 'State', render: (r) => formatText(r.physical_state) },
  { key: 'physical_city', header: 'City', truncate: true, render: (r) => formatText(r.physical_city) },
  { key: 'registration_status', header: 'Status', render: (r) => formatText(r.registration_status) },
  { key: 'primary_naics_code', header: 'NAICS', mono: true, render: (r) => formatText(r.primary_naics_code) },
  { key: 'registration_expiration_date', header: 'Expires', render: (r) => formatDate(r.registration_expiration_date) },
];

const entitySearch: ListEndpoint<SamEntityRow> = {
  source: 'sam',
  slug: 'entities/search',
  group: 'entities',
  groupLabel: 'Entities',
  label: 'Search',
  description: 'Search registered SAM.gov entities by name, UEI, NAICS, or location.',
  kind: 'list',
  detailKind: 'sam-entity',
  detailIdKey: 'uei',
  filters: [
    { name: 'entity_name', label: 'Entity name', kind: 'text', width: 'md' },
    { name: 'uei', label: 'UEI', kind: 'text', width: 'sm' },
    { name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' },
    { name: 'naics_code', label: 'NAICS code', kind: 'text', width: 'sm', placeholder: 'e.g. 541512' },
    { name: 'naics_prefix', label: 'NAICS prefix', kind: 'text', width: 'sm', placeholder: 'e.g. 541' },
    {
      name: 'registration_status',
      label: 'Status',
      kind: 'select',
      options: SAM_REGISTRATION_STATUS_OPTIONS,
      width: 'sm',
    },
  ],
  fetch: (req) => samEntities.search(req),
  rowKey: (r) => r.uei ?? '',
  columns: [
    ...entityBaseColumns,
    { key: 'business_types', header: 'Types', truncate: true, render: (r) => formatList(r.business_types) },
  ],
};

const entityStats: StatsEndpoint<SamEntityStatsData> = {
  source: 'sam',
  slug: 'entities/stats',
  group: 'entities',
  groupLabel: 'Entities',
  label: 'Stats',
  description: 'Aggregate counts of SAM-registered entities.',
  kind: 'stats',
  filters: [{ name: 'state', label: 'State', kind: 'select', options: STATE_OPTIONS, width: 'sm' }],
  fetch: (req) => samEntities.stats(req),
  Panel: SamStatsPanel,
};

export const samSource: DataSourceDef = {
  id: 'sam',
  label: 'SAM.gov',
  shortLabel: 'SAM',
  pathSegment: 'sam',
  defaultSlug: 'entities/search',
  groups: [{ id: 'entities', label: 'Entities', icon: 'Building2' }],
  endpoints: [entitySearch, entityStats],
  detailDrawers: {
    'sam-entity': SamEntityDrawer,
  },
};
