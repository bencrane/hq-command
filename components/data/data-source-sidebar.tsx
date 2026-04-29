'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Boxes, Building2, FileText, Truck } from 'lucide-react';
import { endpointGroups, SOURCES } from '@/lib/data-sources/registry';
import type { DataEndpoint, DataSourceDef } from '@/lib/data-sources/types';
import { DEFAULT_LIMIT } from '@/lib/data-sources/url-state';

const ICONS = {
  Boxes,
  Truck,
  Building2,
  FileText,
} as const;

interface Props {
  source: DataSourceDef;
}

export function DataSourceSidebar({ source }: Props) {
  const pathname = usePathname();
  const groups = endpointGroups(source);
  const queryClient = useQueryClient();

  const prefetch = (endpoint: DataEndpoint) => {
    const body: Record<string, unknown> = { limit: DEFAULT_LIMIT, offset: 0 };
    void queryClient.prefetchQuery({
      queryKey: [endpoint.source, endpoint.slug, body],
      queryFn: () => endpoint.fetch(body) as unknown as Promise<unknown>,
      staleTime: 5 * 60_000,
    });
  };

  return (
    <aside
      className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]"
      aria-label={`${source.label} endpoints`}
    >
      {/* Source switcher */}
      <div className="border-b border-[var(--color-border-subtle)] px-2 pt-14 pb-3">
        <div className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
          Source
        </div>
        <ul className="space-y-px">
          {SOURCES.map((s) => {
            const active = s.id === source.id;
            return (
              <li key={s.id}>
                <Link
                  href={`/admin/${s.pathSegment}/${s.defaultSlug}`}
                  className={
                    'block rounded-md px-2 py-1.5 text-[12.5px] leading-tight transition-colors ' +
                    (active
                      ? 'bg-[var(--color-surface-2)] font-medium text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]')
                  }
                >
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Endpoint groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => {
          const Icon = ICONS[group.icon as keyof typeof ICONS] ?? Boxes;
          return (
            <div key={group.id} className="mb-4">
              <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                <Icon size={12} strokeWidth={1.75} />
                <span>{group.label}</span>
              </div>
              <ul className="mt-0.5 space-y-px">
                {group.items.map((endpoint) => {
                  const href = `/admin/${source.pathSegment}/${endpoint.slug}`;
                  const active = pathname === href;
                  return (
                    <li key={endpoint.slug}>
                      <Link
                        href={href}
                        prefetch
                        onMouseEnter={() => prefetch(endpoint)}
                        onFocus={() => prefetch(endpoint)}
                        className={
                          'block rounded-md px-2 py-1.5 text-[13px] leading-tight transition-colors ' +
                          (active
                            ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]')
                        }
                      >
                        <span className="block">{endpoint.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
