'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Cpu } from 'lucide-react';

import { VoiceAgentsQueryProvider } from '@/components/voice-agents/query-provider';
import { gtmAgents } from '@/lib/gtm';

export default function AgentsIndexPage() {
  return (
    <VoiceAgentsQueryProvider>
      <AgentsList />
    </VoiceAgentsQueryProvider>
  );
}

function AgentsList() {
  const query = useQuery({
    queryKey: ['gtm-agents'],
    queryFn: () => gtmAgents.list(),
  });
  const items = query.data?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 pt-20 pb-12">
      <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
        Agents & Prompts
      </h1>
      <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">
        Edit and roll back system prompts for the GTM-pipeline managed agents.
      </p>

      {query.error && (
        <div className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-[12px] text-red-300">
          {String(query.error)}
        </div>
      )}

      {query.isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-row h-[100px] rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-8 text-center text-[12.5px] text-[var(--color-text-tertiary)]">
          No agents registered yet. Run the managed-agents-x setup scripts and
          register them via scripts/register_gtm_agent.py.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((agent) => (
            <Link
              key={agent.id}
              href={`/admin/agents/${encodeURIComponent(agent.agent_slug)}`}
              className="group relative rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]">
                  <Cpu size={14} strokeWidth={1.75} />
                </div>
                <ArrowUpRight
                  size={14}
                  strokeWidth={1.75}
                  className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text-primary)]"
                />
              </div>
              <div className="mt-4">
                <div className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {agent.agent_slug}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                    {agent.role}
                  </span>
                  <span className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                    {agent.model}
                  </span>
                  {agent.parent_actor_slug && (
                    <span className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                      → {agent.parent_actor_slug}
                    </span>
                  )}
                </div>
                {agent.description && (
                  <div className="mt-2 line-clamp-2 text-[12px] text-[var(--color-text-tertiary)]">
                    {agent.description}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
