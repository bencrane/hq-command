'use client';

import type { ComponentType } from 'react';

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
  /** width hint: 'sm' = quarter row, 'md' = half row, 'lg' = full row */
  width?: 'sm' | 'md' | 'lg';
  /** default value applied when no URL state is present */
  defaultValue?: string | string[] | boolean;
}

// ---------------------------------------------------------------------------
// Column definition (kept compatible with existing FMCSA columns)
// ---------------------------------------------------------------------------

export type ColumnAlign = 'left' | 'right';

export interface ColumnDef<TRow> {
  key: string;
  header: string;
  align?: ColumnAlign;
  /** monospace style; useful for IDs */
  mono?: boolean;
  /** truncate long text with title attribute tooltip */
  truncate?: boolean;
  /** extra CSS classes on the cell */
  className?: string;
  render: (row: TRow) => React.ReactNode;
  /** plain text for tooltips / future export */
  text?: (row: TRow) => string;
  /** sortable on the client; default true if not specified */
  sortable?: boolean;
  /** explicit width in tailwind units (e.g. 'w-32') */
  width?: string;
}

// ---------------------------------------------------------------------------
// Data source + endpoint shapes
// ---------------------------------------------------------------------------

export type DataSourceId = 'fmcsa' | 'usaspending' | 'sam';

export type EndpointKind =
  /** list of rows; envelope has `items`, `total`/`total_matched`, pagination */
  | 'list'
  /** stats / aggregate panel — no row table, custom panel renders the data */
  | 'stats';

export interface ListData<TRow> {
  items: TRow[];
  total?: number | null;
  total_matched?: number | null;
  has_more?: boolean;
  limit: number;
  offset: number;
}

interface EndpointBase {
  source: DataSourceId;
  /** path slug after /admin/{source}/, e.g. 'audiences/new-entrants-90d' */
  slug: string;
  /** sidebar group id (per-source-defined) */
  group: string;
  groupLabel: string;
  label: string;
  description: string;
  filters: FilterField[];
  /** common filters that apply to many endpoints in the same source/group */
  commonFilters?: FilterField[];
  /** id of the registered detail-drawer kind (e.g. 'fmcsa-carrier', 'usa-recipient', 'sam-entity'); omit to disable row click */
  detailKind?: string;
  /** field on the row that identifies it for detail lookup */
  detailIdKey?: string;
}

export interface ListEndpoint<TRow> extends EndpointBase {
  kind: 'list';
  fetch: (req: Record<string, unknown>) => Promise<{ data: ListData<TRow> }>;
  /** columns shown in the table; receives the row */
  columns: ColumnDef<TRow>[];
  /** field on the row used as a stable react key (default: 'id' or detailIdKey) */
  rowKey?: (row: TRow) => string;
}

export interface StatsEndpoint<TData> extends EndpointBase {
  kind: 'stats';
  fetch: (req: Record<string, unknown>) => Promise<{ data: TData }>;
  /** custom panel component */
  Panel: ComponentType<{ data: TData }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataEndpoint = ListEndpoint<any> | StatsEndpoint<any>;

// ---------------------------------------------------------------------------
// Detail drawers — registered globally so any source can attach
// ---------------------------------------------------------------------------

export interface DetailDrawerProps {
  id: string | null;
  onClose: () => void;
}

export type DetailDrawerComponent = ComponentType<DetailDrawerProps>;

// ---------------------------------------------------------------------------
// Data source descriptor — carries the source-level metadata + groups
// ---------------------------------------------------------------------------

export interface SourceGroupDef {
  id: string;
  label: string;
  /** lucide icon name (resolved at render) */
  icon: string;
}

export interface DataSourceDef {
  id: DataSourceId;
  label: string;
  shortLabel: string;
  /** path under /admin/, e.g. 'fmcsa' | 'usaspending' | 'sam' */
  pathSegment: string;
  groups: SourceGroupDef[];
  endpoints: DataEndpoint[];
  /** which slug to redirect to when the source root is hit */
  defaultSlug: string;
  detailDrawers?: Record<string, DetailDrawerComponent>;
}
