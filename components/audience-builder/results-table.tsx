'use client';

import { useMemo } from 'react';
import type { AudienceRow, SourceId } from '@/lib/audience-builder/schema';
import {
  formatNumber,
  formatText,
  formatUsdCompact,
} from '@/lib/data-sources/format';
import {
  DataTable,
  TableSkeleton,
  type ColumnDef,
} from '@/components/data/data-table';

interface Props {
  rows: AudienceRow[];
  appliedSources: SourceId[];
  isLoading: boolean;
  isFetching: boolean;
  onRowClick: (row: AudienceRow) => void;
  rowsPerPage: number;
}

export function ResultsTable({
  rows,
  appliedSources,
  isLoading,
  isFetching,
  onRowClick,
  rowsPerPage,
}: Props) {
  const columns = useMemo<ColumnDef<AudienceRow>[]>(
    () => buildColumns(appliedSources),
    [appliedSources],
  );

  if (isLoading && rows.length === 0) {
    return <TableSkeleton columns={columns} rowCount={Math.min(rowsPerPage, 12)} />;
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      onRowClick={onRowClick}
      stale={isFetching && !isLoading}
    />
  );
}

function buildColumns(appliedSources: SourceId[]): ColumnDef<AudienceRow>[] {
  const cols: ColumnDef<AudienceRow>[] = [
    {
      key: 'name',
      header: 'Name',
      truncate: true,
      render: (r) => formatText(r.name),
      text: (r) => r.name,
    },
    {
      key: 'physical_state',
      header: 'State',
      render: (r) => formatText(r.physical_state),
      text: (r) => r.physical_state ?? '—',
    },
    {
      key: 'physical_city',
      header: 'City',
      truncate: true,
      render: (r) => formatText(r.physical_city),
      text: (r) => r.physical_city ?? '—',
    },
    {
      key: 'naics',
      header: 'NAICS',
      truncate: true,
      render: (r) =>
        r.primary_naics_code
          ? `${r.primary_naics_code}${r.primary_naics_description ? ' · ' + r.primary_naics_description : ''}`
          : '—',
      text: (r) => r.primary_naics_code ?? '—',
    },
  ];

  if (appliedSources.includes('fmcsa')) {
    cols.push({
      key: 'fmcsa_pu',
      header: 'PU',
      align: 'right',
      render: (r) => formatNumber(r.fmcsa?.power_unit_count),
      text: (r) =>
        r.fmcsa?.power_unit_count == null
          ? '—'
          : String(r.fmcsa.power_unit_count),
    });
    cols.push({
      key: 'fmcsa_drivers',
      header: 'Drivers',
      align: 'right',
      render: (r) => formatNumber(r.fmcsa?.driver_total),
      text: (r) =>
        r.fmcsa?.driver_total == null ? '—' : String(r.fmcsa.driver_total),
    });
  }

  if (appliedSources.includes('usaspending')) {
    cols.push({
      key: 'usa_obligation_12mo',
      header: '12mo $',
      align: 'right',
      render: (r) => formatUsdCompact(r.usaspending?.obligation_12mo),
      text: (r) =>
        r.usaspending?.obligation_12mo == null
          ? '—'
          : String(r.usaspending.obligation_12mo),
    });
  }

  if (appliedSources.includes('sam')) {
    cols.push({
      key: 'sam_status',
      header: 'SAM',
      render: (r) => formatText(r.sam?.registration_status),
      text: (r) =>
        r.sam?.registration_status == null
          ? '—'
          : String(r.sam.registration_status),
    });
  }

  cols.push({
    key: 'primary_id',
    header: 'ID',
    mono: true,
    render: (r) => `${r.primary_id_kind}:${idValue(r)}`,
    text: (r) => `${r.primary_id_kind}:${idValue(r)}`,
  });
  return cols;
}

function idValue(r: AudienceRow): string {
  if (r.primary_id_kind === 'uei') return r.ids.uei ?? '';
  if (r.primary_id_kind === 'dot') return r.ids.dot ?? '';
  return r.ids.pdl_id ?? '';
}
