'use client';

import { useMemo, useState } from 'react';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';

import { describeDexError } from '@/lib/dex/client';
import { allFilters, findEndpoint, getDrawer } from '@/lib/data-sources/registry';
import type {
  DataEndpoint,
  DataSourceDef,
  ListData,
  ListEndpoint,
  StatsEndpoint,
} from '@/lib/data-sources/types';
import {
  DEFAULT_LIMIT,
  countActiveFilters,
  parseSearchParams,
  serializeState,
  toRequestBody,
  type FormValues,
  type PageState,
} from '@/lib/data-sources/url-state';

import { DataTable, TableSkeleton } from './data-table';
import { FilterForm } from './filter-form';
import { PageHeader } from './page-header';
import { Pagination } from './pagination';
import { EmptyState, ErrorBanner, ErrorState } from './states';

interface Props {
  source: DataSourceDef;
  slug: string;
}

type ListEnvelope = { data: ListData<unknown> };
type StatsEnvelope<T> = { data: T };

export function DataSourceShell({ source, slug }: Props) {
  const endpoint = findEndpoint(source, slug);
  if (!endpoint) notFound();
  return <ShellInner key={`${source.id}/${slug}`} source={source} endpoint={endpoint!} />;
}

function ShellInner({ source, endpoint }: { source: DataSourceDef; endpoint: DataEndpoint }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fields = useMemo(() => allFilters(endpoint), [endpoint]);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const state: PageState = useMemo(
    () => parseSearchParams(searchParams as URLSearchParams, fields),
    [searchParams, fields],
  );

  const requestBody = useMemo(() => toRequestBody(state, fields), [state, fields]);

  const updateUrl = (next: PageState) => {
    const sp = serializeState(next, fields);
    const qs = sp.toString();
    router.replace(
      `/admin/${source.pathSegment}/${endpoint.slug}${qs ? `?${qs}` : ''}`,
      { scroll: false },
    );
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

  const fetchFn = () => endpoint.fetch(requestBody) as Promise<ListEnvelope | StatsEnvelope<unknown>>;

  const query: UseQueryResult<ListEnvelope | StatsEnvelope<unknown>> = useQuery({
    queryKey: [endpoint.source, endpoint.slug, requestBody],
    queryFn: fetchFn,
    placeholderData: keepPreviousData,
  });

  const error = query.error ? describeDexError(query.error) : null;
  // The error banner only shows when we still have stale data underneath; otherwise
  // the full ErrorState replaces the table.
  const showInlineError = !!error && !errorDismissed && !!query.data;
  const showFullError = !!error && !query.data;

  const Drawer = getDrawer(source, endpoint.detailKind);

  const activeFilterCount = countActiveFilters(state.values, fields);

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <PageHeader
          source={source.shortLabel}
          group={endpoint.groupLabel}
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
        {showInlineError && (
          <ErrorBanner message={error!} onDismiss={() => setErrorDismissed(true)} />
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          {endpoint.kind === 'stats' ? (
            <StatsContent
              endpoint={endpoint as StatsEndpoint<unknown>}
              data={(query.data as { data: unknown } | undefined)?.data}
              loading={query.isLoading}
              showFullError={showFullError}
              error={error}
              onRetry={() => query.refetch()}
            />
          ) : (
            <ListContent
              endpoint={endpoint as ListEndpoint<unknown>}
              data={(query.data as { data: ListData<unknown> } | undefined)?.data}
              isLoading={query.isLoading}
              isFetching={query.isFetching}
              state={state}
              onReset={onReset}
              onPagination={onPagination}
              onRowClick={(row) => {
                const idKey = (endpoint as ListEndpoint<unknown>).detailIdKey;
                if (!idKey || !endpoint.detailKind) return;
                const id = (row as Record<string, unknown>)[idKey];
                if (id != null) setDrawerId(String(id));
              }}
              activeFilterCount={activeFilterCount}
              showFullError={showFullError}
              error={error}
              onRetry={() => query.refetch()}
            />
          )}
        </div>
      </div>
      {Drawer && <Drawer id={drawerId} onClose={() => setDrawerId(null)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Stats content
// ---------------------------------------------------------------------------

function StatsContent({
  endpoint,
  data,
  loading,
  showFullError,
  error,
  onRetry,
}: {
  endpoint: StatsEndpoint<unknown>;
  data: unknown;
  loading: boolean;
  showFullError: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (showFullError && error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-3.5"
          >
            <div className="data-skeleton-bar h-2.5 w-24 rounded" />
            <div className="data-skeleton-bar mt-3 h-6 w-20 rounded" />
          </div>
        ))}
      </div>
    );
  }
  if (!data) return null;
  const { Panel } = endpoint;
  return <Panel data={data} />;
}

// ---------------------------------------------------------------------------
// List content
// ---------------------------------------------------------------------------

function ListContent({
  endpoint,
  data,
  isLoading,
  isFetching,
  state,
  onReset,
  onPagination,
  onRowClick,
  activeFilterCount,
  showFullError,
  error,
  onRetry,
}: {
  endpoint: ListEndpoint<unknown>;
  data: ListData<unknown> | undefined;
  isLoading: boolean;
  isFetching: boolean;
  state: PageState;
  onReset: () => void;
  onPagination: (next: { limit: number; offset: number }) => void;
  onRowClick: (row: unknown) => void;
  activeFilterCount: number;
  showFullError: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const items = data?.items ?? [];
  const total = (data?.total ?? data?.total_matched) ?? null;
  const hasMore = data?.has_more ?? items.length === state.limit;

  const showSkeleton = isLoading && items.length === 0 && !showFullError;
  const showEmpty = !isLoading && items.length === 0 && !showFullError;

  return (
    <>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {showFullError && error ? (
          <div className="flex h-full w-full">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : showSkeleton ? (
          <TableSkeleton columns={endpoint.columns} rowCount={Math.min(state.limit, 12)} />
        ) : showEmpty ? (
          <EmptyState onReset={onReset} hasActiveFilters={activeFilterCount > 0} />
        ) : (
          <DataTable
            columns={endpoint.columns}
            rows={items}
            rowKey={(row, i) =>
              endpoint.rowKey
                ? endpoint.rowKey(row)
                : (row as Record<string, unknown>)[endpoint.detailIdKey ?? 'id']?.toString() ??
                  String(i)
            }
            onRowClick={endpoint.detailKind ? onRowClick : undefined}
            stale={isFetching && !isLoading}
          />
        )}
      </div>
      {!showFullError && (
        <Pagination
          total={total ?? null}
          itemsCount={items.length}
          limit={state.limit}
          offset={state.offset}
          hasMore={hasMore}
          onChange={onPagination}
        />
      )}
    </>
  );
}
