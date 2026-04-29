'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Layers, Loader2 } from 'lucide-react';

import { audienceTemplates, type AudienceTemplateSummary } from '@/lib/dex-audiences';
import { describeDexError } from '@/lib/dex';
import { ErrorBanner } from '@/components/fmcsa/states';

export default function AudiencesIndexPage() {
  const query = useQuery({
    queryKey: ['audience-templates'],
    queryFn: () => audienceTemplates.list(),
  });

  const items = query.data?.data.items ?? [];
  const error = query.error ? describeDexError(query.error) : null;

  return (
    <div className="mx-auto max-w-5xl px-6 pt-20 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
            Audiences
          </h1>
          <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">
            Browse audience templates. Pick one to customize and save.
          </p>
        </div>
        {query.isFetching && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
            <Loader2 size={12} className="animate-spin" strokeWidth={2} />
            <span>Fetching</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <ErrorBanner message={error} onDismiss={() => query.refetch()} />
        </div>
      )}

      {query.isLoading ? (
        <TemplateGridSkeleton />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}

      {!query.isLoading && items.length === 0 && !error && (
        <div className="mt-8 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-8 text-center text-[12.5px] text-[var(--color-text-tertiary)]">
          No audience templates available.
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: AudienceTemplateSummary }) {
  return (
    <Link
      href={`/admin/audiences/${encodeURIComponent(template.slug)}`}
      className="group relative flex flex-col rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]">
          <Layers size={14} strokeWidth={1.75} />
        </div>
        <ArrowUpRight
          size={14}
          strokeWidth={1.75}
          className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text-primary)]"
        />
      </div>
      <div className="mt-4 flex-1">
        <div className="text-[14px] font-medium leading-snug text-[var(--color-text-primary)]">
          {template.name}
        </div>
        <div className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">
          {template.description}
        </div>
      </div>
      {template.partner_types.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {template.partner_types.map((p) => (
            <span
              key={p}
              className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"
            >
              {p.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function TemplateGridSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-row h-[148px] rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]"
        />
      ))}
    </div>
  );
}
