'use client';

import { fmcsaSource } from './sources/fmcsa';
import { samSource } from './sources/sam';
import { usaspendingSource } from './sources/usaspending';
import type {
  DataEndpoint,
  DataSourceDef,
  DataSourceId,
  DetailDrawerComponent,
  FilterField,
} from './types';

export const SOURCES: DataSourceDef[] = [fmcsaSource, usaspendingSource, samSource];

export function getSource(id: DataSourceId | string): DataSourceDef | undefined {
  return SOURCES.find((s) => s.id === id || s.pathSegment === id);
}

export function findEndpoint(
  source: DataSourceDef,
  slug: string,
): DataEndpoint | undefined {
  return source.endpoints.find((e) => e.slug === slug);
}

export function endpointGroups(
  source: DataSourceDef,
): { id: string; label: string; icon: string; items: DataEndpoint[] }[] {
  return source.groups.map((g) => ({
    id: g.id,
    label: g.label,
    icon: g.icon,
    items: source.endpoints.filter((e) => e.group === g.id),
  }));
}

export function allFilters(endpoint: DataEndpoint): FilterField[] {
  return [...endpoint.filters, ...(endpoint.commonFilters ?? [])];
}

export function getDrawer(
  source: DataSourceDef,
  detailKind: string | undefined,
): DetailDrawerComponent | undefined {
  if (!detailKind) return undefined;
  return source.detailDrawers?.[detailKind];
}

export type { DataEndpoint, DataSourceDef, DataSourceId } from './types';
