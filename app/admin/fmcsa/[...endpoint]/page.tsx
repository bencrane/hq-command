'use client';

import { useMemo, useState } from 'react';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';

import { describeDexError } from '@/lib/dex';
import type {
  AudienceRow,
  CarrierRow,
  CarrierSearchData,
  CarrierStatsData,
} from '@/lib/dex-fmcsa';
import {
  allFilters,
  audienceColumns,
  carrierColumns,
  findEndpoint,
  type AudienceListEndpoint,
  type CarrierListEndpoint,
  type ColumnDef,
  type FmcsaEndpoint,
} from '@/lib/fmcsa/registry';
import {
  parseSearchParams,
  serializeState,
  toRequestBody,
  type FormValues,
  type PageState,
  DEFAULT_LIMIT,
} from '@/lib/fmcsa/url-state';

import { CarrierDrawer } from '@/components/fmcsa/carrier-drawer';
import { FilterForm } from '@/components/fmcsa/filter-form';
import { PageHeader } from '@/components/fmcsa/page-header';
import { Pagination } from '@/components/fmcsa/pagination';
import { ResultsTable, TableSkeleton } from '@/components/fmcsa/results-table';
import { EmptyState, ErrorBanner } from '@/components/fmcsa/states';
import { StatsPanel } from '@/components/fmcsa/stats-panel';

interface AudienceData<T> {
  items: AudienceRow<T>[];
  total: number;
  has_more: boolean;
  limit: number;
  offset: number;
}

type AnyEnvelope =
  | { data: AudienceData<unknown> }
  | { data: CarrierSearchData }
  | { data: CarrierStatsData };

export default function EndpointPage() {
  const params = useParams<{ endpoint: string[] }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = (params.endpoint ?? []).join('/');
  const endpoint = findEndpoint(slug);

  if (!endpoint) {
    notFound();
  }

  return (
    <EndpointView
      key={slug}
      endpoint={endpoint}
      searchParams={searchParams}
      router={router}
    />
  );
}

function EndpointView({
  endpoint,
  searchParams,
  router,
}: {
  endpoint: FmcsaEndpoint;
  searchParams: URLSearchParams | ReturnType<typeof useSearchParams>;
  router: ReturnType<typeof useRouter>;
}) {
  const fields = useMemo(() => allFilters(endpoint), [endpoint]);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [drawerDot, setDrawerDot] = useState<string | null>(null);

  const state: PageState = useMemo(
    () => parseSearchParams(searchParams as URLSearchParams, fields),
    [searchParams, fields],
  );

  const requestBody = useMemo(() => toRequestBody(state, fields), [state, fields]);

  const updateUrl = (next: PageState) => {
    const sp = serializeState(next, fields);
    const qs = sp.toString();
    router.replace(`/admin/fmcsa/${endpoint.slug}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const onFilterSubmit = (values: FormValues) => {
    setErrorDismissed(false);
    updateUrl({ values, limit: state.limit, offset: 0 });
  };
  const onReset = () => {
    setErrorDismissed(false);
    updateUrl({ values: {}, limit: DEFAULT_LIMIT, offset: 0 });
  };
  const onPagination = (next: { limit: number; offset: number }) => {
    setErrorDismissed(false);
    updateUrl({ ...state, ...next });
  };

  const fetchFn: () => Promise<AnyEnvelope> = () =>
    (endpoint.fetch as (req: Record<string, unknown>) => Promise<AnyEnvelope>)(requestBody);

  const query: UseQueryResult<AnyEnvelope> = useQuery<AnyEnvelope>({
    queryKey: [endpoint.slug, requestBody],
    queryFn: fetchFn,
    placeholderData: keepPreviousData,
  });

  const error = query.error ? describeDexError(query.error) : null;
  const showError = error && !errorDismissed;

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <PageHeader
          label={endpoint.label}
          description={endpoint.description}
          fetching={query.isFetching}
        />
        <FilterForm
          fields={endpoint.filters}
          commonFields={endpoint.commonFilters}
          values={state.values}
          onSubmit={onFilterSubmit}
          onReset={onReset}
        />
        {showError && (
          <ErrorBanner message={error!} onDismiss={() => setErrorDismissed(true)} />
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          {endpoint.kind === 'carrier-stats' ? (
            <StatsContent
              loading={query.isLoading}
              data={(query.data as { data: CarrierStatsData } | undefined)?.data}
            />
          ) : endpoint.kind === 'audience-list' ? (
            <AudienceContent
              endpoint={endpoint as AudienceListEndpoint<unknown>}
              data={(query.data as { data: AudienceData<unknown> } | undefined)?.data}
              isLoading={query.isLoading}
              isFetching={query.isFetching}
              state={state}
              onReset={onReset}
              onPagination={onPagination}
              onRowClick={(row) => setDrawerDot(row.dot_number)}
            />
          ) : (
            <CarrierListContent
              endpoint={endpoint as CarrierListEndpoint}
              data={(query.data as { data: CarrierSearchData } | undefined)?.data}
              isLoading={query.isLoading}
              isFetching={query.isFetching}
              state={state}
              onReset={onReset}
              onPagination={onPagination}
              onRowClick={(row) => setDrawerDot(row.dot_number)}
            />
          )}
        </div>
      </div>
      <CarrierDrawer dotNumber={drawerDot} onClose={() => setDrawerDot(null)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Audience content
// ---------------------------------------------------------------------------

function AudienceContent<T>({
  endpoint,
  data,
  isLoading,
  isFetching,
  state,
  onReset,
  onPagination,
  onRowClick,
}: {
  endpoint: AudienceListEndpoint<T>;
  data: AudienceData<T> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  state: PageState;
  onReset: () => void;
  onPagination: (next: { limit: number; offset: number }) => void;
  onRowClick: (row: AudienceRow<T>) => void;
}) {
  const columns = useMemo(() => audienceColumns(endpoint), [endpoint]);
  const items = data?.items ?? [];
  const total = data?.total ?? null;
  const hasMore = data?.has_more ?? false;

  return (
    <ListContent
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      items={items}
      total={total}
      hasMore={hasMore}
      state={state}
      onReset={onReset}
      onPagination={onPagination}
      rowKey={(r) => r.dot_number}
      onRowClick={onRowClick}
    />
  );
}

// ---------------------------------------------------------------------------
// Carrier list content
// ---------------------------------------------------------------------------

function CarrierListContent({
  endpoint,
  data,
  isLoading,
  isFetching,
  state,
  onReset,
  onPagination,
  onRowClick,
}: {
  endpoint: CarrierListEndpoint;
  data: CarrierSearchData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  state: PageState;
  onReset: () => void;
  onPagination: (next: { limit: number; offset: number }) => void;
  onRowClick: (row: CarrierRow) => void;
}) {
  const columns = useMemo(() => carrierColumns(endpoint), [endpoint]);
  const items = data?.items ?? [];
  const total = data?.total_matched ?? null;
  const hasMore = items.length === state.limit;

  return (
    <ListContent
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      items={items}
      total={total}
      hasMore={hasMore}
      state={state}
      onReset={onReset}
      onPagination={onPagination}
      rowKey={(r) => r.dot_number}
      onRowClick={onRowClick}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared list content
// ---------------------------------------------------------------------------

function ListContent<TRow>({
  columns,
  isLoading,
  isFetching,
  items,
  total,
  hasMore,
  state,
  onReset,
  onPagination,
  rowKey,
  onRowClick,
}: {
  columns: ColumnDef<TRow>[];
  isLoading: boolean;
  isFetching: boolean;
  items: TRow[];
  total: number | null;
  hasMore: boolean;
  state: PageState;
  onReset: () => void;
  onPagination: (next: { limit: number; offset: number }) => void;
  rowKey: (row: TRow) => string;
  onRowClick: (row: TRow) => void;
}) {
  const showSkeleton = isLoading && items.length === 0;
  const showEmpty = !isLoading && items.length === 0;

  return (
    <>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {showSkeleton ? (
          <TableSkeleton columns={columns} rowCount={Math.min(state.limit, 12)} />
        ) : showEmpty ? (
          <EmptyState onReset={onReset} />
        ) : (
          <ResultsTable
            columns={columns}
            rows={items}
            rowKey={(r) => rowKey(r)}
            onRowClick={onRowClick}
            stale={isFetching && !isLoading}
          />
        )}
      </div>
      <Pagination
        total={total}
        itemsCount={items.length}
        limit={state.limit}
        offset={state.offset}
        hasMore={hasMore}
        onChange={onPagination}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Stats content
// ---------------------------------------------------------------------------

function StatsContent({
  loading,
  data,
}: {
  loading: boolean;
  data: CarrierStatsData | undefined;
}) {
  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-row rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-3.5"
          >
            <div className="h-2.5 w-24 rounded bg-[var(--color-surface-3)]" />
            <div className="mt-3 h-6 w-20 rounded bg-[var(--color-surface-3)]" />
          </div>
        ))}
      </div>
    );
  }
  if (!data) return null;
  return <StatsPanel data={data} />;
}
