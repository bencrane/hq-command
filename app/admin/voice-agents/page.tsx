'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Loader2, Mic, Plus, AlertTriangle } from 'lucide-react';

import { useBrandId } from '@/components/voice-agents/use-brand';
import { BrandSelector } from '@/components/voice-agents/brand-selector';
import { voiceAgentsApi } from '@/lib/voice-agents/client';
import type { AssistantWithVapi } from '@/lib/voice-agents/types';
import { ApiErrorDisplay } from '@/components/api-error';

export default function VoiceAgentsListPage() {
  const [brandId, setBrandId] = useBrandId();

  const query = useQuery({
    queryKey: ['voice-agents', 'list', brandId],
    queryFn: () => voiceAgentsApi.listAssistants(brandId),
    enabled: !!brandId,
  });

  const items = query.data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 pt-20 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
            Voice Agents
          </h1>
          <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">
            Configure and manage Vapi voice agents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {query.isFetching && brandId && (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
              <Loader2 size={12} className="animate-spin" strokeWidth={2} />
              <span>Fetching</span>
            </div>
          )}
          {brandId && (
            <Link
              href={`/admin/voice-agents/new?brand_id=${encodeURIComponent(brandId)}`}
              className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12px] font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]"
            >
              <Plus size={12} strokeWidth={2} />
              New
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6">
        <BrandSelector brandId={brandId} onChange={setBrandId} />
      </div>

      {!brandId && (
        <div className="mt-8 rounded-md border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-12 text-center text-[12.5px] text-[var(--color-text-tertiary)]">
          Set a brand to view its voice agents.
        </div>
      )}

      {query.isError && brandId && (
        <div className="mt-6">
          <ApiErrorDisplay error={query.error} onRetry={() => query.refetch()} />
        </div>
      )}

      {brandId && query.isLoading && <ListSkeleton />}

      {brandId && !query.isLoading && !query.isError && items.length === 0 && (
        <div className="mt-8 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-8 text-center text-[12.5px] text-[var(--color-text-tertiary)]">
          No voice agents yet. Create one to get started.
        </div>
      )}

      {brandId && items.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <AgentCard key={item.local.id} brandId={brandId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentCard({ brandId, item }: { brandId: string; item: AssistantWithVapi }) {
  const drift = item.vapi === null;
  const name = item.vapi?.name || '(unnamed)';
  const model =
    [item.vapi?.model?.provider, item.vapi?.model?.model].filter(Boolean).join(' / ') || '—';
  const voice =
    [item.vapi?.voice?.provider, item.vapi?.voice?.voiceId].filter(Boolean).join(' / ') || '—';

  return (
    <Link
      href={`/admin/voice-agents/${encodeURIComponent(item.local.id)}?brand_id=${encodeURIComponent(brandId)}`}
      className="group relative flex flex-col rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]">
          <Mic size={14} strokeWidth={1.75} />
        </div>
        <ArrowUpRight
          size={14}
          strokeWidth={1.75}
          className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text-primary)]"
        />
      </div>
      <div className="mt-4 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="truncate text-[14px] font-medium text-[var(--color-text-primary)]">
            {name}
          </div>
          {drift && (
            <span title="Vapi mirror missing" className="text-amber-500">
              <AlertTriangle size={12} />
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-1 text-[11.5px] text-[var(--color-text-tertiary)]">
          <Row label="Type" value={item.local.assistant_type} />
          <Row label="Model" value={model} />
          <Row label="Voice" value={voice} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span className="font-mono">{item.local.id.slice(0, 8)}…</span>
        <span>{new Date(item.local.updated_at).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-12 shrink-0 text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className="truncate font-mono text-[var(--color-text-secondary)]">{value}</span>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-row h-[160px] rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]"
        />
      ))}
    </div>
  );
}
