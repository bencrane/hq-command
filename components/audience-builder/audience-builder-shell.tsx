'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { describeDexError } from '@/lib/dex/client';
import {
  countAudience,
  fetchCriteriaSchema,
  resolveAudience,
} from '@/lib/audience-builder/client';
import {
  DEFAULT_LIMIT,
  type AudienceQuery,
  type CountResponse,
  type CriterionValue,
  type ResolveResponse,
  type SourceId,
} from '@/lib/audience-builder/schema';
import {
  parseAudienceUrl,
  serializeAudienceUrl,
} from '@/lib/audience-builder/url-state';
import {
  findStarter,
  type StarterAudience,
} from '@/lib/audience-builder/starters';

import { CountBanner } from './count-banner';
import { DetailDrawer } from './detail-drawer';
import { FilterStrip } from './filter-strip';
import { PageHeader } from './page-header';
import { Pagination } from '@/components/data/pagination';
import { ResultsTable } from './results-table';
import { StarterPicker } from './starter-picker';
import { ErrorBanner, ErrorState } from '@/components/data/states';
import {
  AudienceEmptyState,
  AudienceUnresolvableState,
} from './states';

const DEBOUNCE_MS = 300;

export function AudienceBuilderShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);

  const parsed = useMemo(() => parseAudienceUrl(sp), [sp]);
  const [query, setQuery] = useState<AudienceQuery>(parsed.query);
  const [drawerRowId, setDrawerRowId] = useState<string | null>(parsed.rowId ?? null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [highlightKeys, setHighlightKeys] = useState<Set<string>>(new Set());
  const lastSerializedRef = useRef<string>('');

  // Schema fetch — cached aggressively.
  const schemaQuery = useQuery({
    queryKey: ['audience-criteria-schema'],
    queryFn: fetchCriteriaSchema,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });

  // Inbound starter redirects: ?starter=<slug> takes effect once.
  const starterConsumedRef = useRef(false);
  useEffect(() => {
    if (starterConsumedRef.current) return;
    if (!parsed.starter) return;
    const starter = findStarter(parsed.starter);
    if (!starter) return;
    starterConsumedRef.current = true;
    setQuery(starter.query);
  }, [parsed.starter]);

  // Push state to URL whenever query / drawer change. Drop ?starter= once consumed.
  useEffect(() => {
    if (!schemaQuery.data) return;
    const next = serializeAudienceUrl({ query, rowId: drawerRowId ?? undefined });
    const qs = next.toString();
    if (lastSerializedRef.current === qs) return;
    lastSerializedRef.current = qs;
    router.replace(`/admin/audience-builder${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [query, drawerRowId, router, schemaQuery.data]);

  // Debounced count query (fires on every criteria edit).
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const countQuery = useQuery<CountResponse>({
    queryKey: ['audience-count', debouncedQuery],
    queryFn: () => countAudience(debouncedQuery),
    enabled: !!schemaQuery.data,
    placeholderData: keepPreviousData,
  });

  // Resolve query — uses non-debounced query so pagination feels immediate.
  const resolveQuery = useQuery<ResolveResponse>({
    queryKey: ['audience-resolve', query],
    queryFn: () => resolveAudience(query),
    enabled: !!schemaQuery.data,
    placeholderData: keepPreviousData,
  });

  const fetching = countQuery.isFetching || resolveQuery.isFetching;
  const error = resolveQuery.error
    ? describeDexError(resolveQuery.error)
    : null;
  const showInlineError = !!error && !errorDismissed && !!resolveQuery.data;
  const showFullError = !!error && !resolveQuery.data;

  const onChangeCriteria = (next: CriterionValue[]) => {
    setErrorDismissed(false);
    setHighlightKeys(new Set());
    setQuery((prev) => ({ ...prev, criteria: next, offset: 0 }));
  };

  const onPickStarter = (s: StarterAudience) => {
    setErrorDismissed(false);
    setHighlightKeys(new Set());
    setQuery(s.query);
    setDrawerRowId(null);
  };

  const onPagination = ({ limit, offset }: { limit: number; offset: number }) => {
    setQuery((prev) => ({ ...prev, limit, offset }));
  };

  const onShowMeWhich = () => {
    if (!resolveQuery.data?.applied_sources?.length && query.criteria.length) {
      setHighlightKeys(new Set([query.criteria[query.criteria.length - 1].key]));
      return;
    }
    // Highlight chips that span the most-distant sources we ever resolved against.
    const keys = new Set<string>();
    if (schemaQuery.data) {
      const applied = resolveQuery.data?.applied_sources ?? [];
      for (const c of query.criteria) {
        const def = schemaQuery.data.criteria.find((d) => d.key === c.key);
        if (!def) continue;
        if (def.supported_sources.some((s) => !applied.includes(s))) {
          keys.add(c.key);
        }
      }
    }
    if (keys.size === 0 && query.criteria.length) {
      keys.add(query.criteria[query.criteria.length - 1].key);
    }
    setHighlightKeys(keys);
  };

  // Schema bootstrap states
  if (schemaQuery.isLoading || !schemaQuery.data) {
    return (
      <div className="flex h-full flex-col">
        <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-6 pt-12 pb-4">
          <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
            Audience Builder
          </h1>
        </header>
        <div className="flex-1">
          {schemaQuery.error ? (
            <ErrorState
              message={describeDexError(schemaQuery.error)}
              onRetry={() => schemaQuery.refetch()}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-[var(--color-text-tertiary)]">
              Loading criteria…
            </div>
          )}
        </div>
      </div>
    );
  }

  const items = resolveQuery.data?.items ?? [];
  const total = resolveQuery.data?.total ?? null;
  const hasMore =
    items.length === query.limit &&
    total != null &&
    query.offset + items.length < total;

  const unresolvable =
    resolveQuery.data?.unresolvable === true ||
    countQuery.data?.unresolvable === true;
  const unresolvableReason =
    resolveQuery.data?.unresolvable_reason ?? countQuery.data?.unresolvable_reason ?? null;

  const showSkeleton =
    resolveQuery.isLoading && items.length === 0 && !showFullError && !unresolvable;
  const showEmpty =
    !resolveQuery.isLoading && items.length === 0 && !showFullError && !unresolvable;

  const appliedSources: SourceId[] =
    resolveQuery.data?.applied_sources ??
    countQuery.data?.applied_sources ?? ['fmcsa', 'usaspending', 'sam'];

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <PageHeader
          fetching={fetching}
          starterPicker={
            <StarterPicker
              onPick={onPickStarter}
              hasCriteria={query.criteria.length > 0}
            />
          }
        />
        <FilterStrip
          schema={schemaQuery.data}
          criteria={query.criteria}
          highlightKeys={highlightKeys}
          onChange={onChangeCriteria}
        />
        <CountBanner
          count={countQuery.data ?? null}
          isLoading={countQuery.isFetching}
        />
        {showInlineError && (
          <ErrorBanner
            message={error!}
            onDismiss={() => setErrorDismissed(true)}
          />
        )}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {showFullError && error ? (
            <div className="flex min-h-0 flex-1 items-stretch">
              <ErrorState
                message={error}
                onRetry={() => resolveQuery.refetch()}
              />
            </div>
          ) : unresolvable ? (
            <div className="flex min-h-0 flex-1 items-stretch">
              <AudienceUnresolvableState
                reason={unresolvableReason}
                onShowMeWhich={query.criteria.length > 0 ? onShowMeWhich : undefined}
              />
            </div>
          ) : showEmpty ? (
            <div className="flex min-h-0 flex-1 items-stretch">
              <AudienceEmptyState
                onReset={
                  query.criteria.length > 0 ? () => onChangeCriteria([]) : undefined
                }
              />
            </div>
          ) : (
            <div className="relative min-h-0 min-w-0 flex-shrink overflow-auto">
              <ResultsTable
                rows={items}
                appliedSources={appliedSources}
                isLoading={showSkeleton}
                isFetching={fetching}
                onRowClick={(row) => setDrawerRowId(row.id)}
                rowsPerPage={query.limit}
              />
            </div>
          )}
          {!showFullError && !unresolvable && !showEmpty && (
            <Pagination
              total={total}
              itemsCount={items.length}
              limit={query.limit}
              offset={query.offset}
              hasMore={hasMore ?? false}
              onChange={onPagination}
            />
          )}
        </main>
      </div>
      <DetailDrawer
        rowId={drawerRowId}
        onClose={() => setDrawerRowId(null)}
      />
    </>
  );
}

// re-export DEFAULT_LIMIT so tests / others can use it via this module if needed
export { DEFAULT_LIMIT };
