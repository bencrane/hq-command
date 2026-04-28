'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, Truck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { endpointGroups, type FmcsaEndpoint } from '@/lib/fmcsa/registry';
import { DEFAULT_LIMIT } from '@/lib/fmcsa/url-state';

const GROUP_ICON = {
  audiences: Boxes,
  carriers: Truck,
} as const;

export function FmcsaSidebar() {
  const pathname = usePathname();
  const groups = endpointGroups();
  const queryClient = useQueryClient();

  const prefetch = (endpoint: FmcsaEndpoint) => {
    const body = { limit: DEFAULT_LIMIT, offset: 0 };
    void queryClient.prefetchQuery({
      queryKey: [endpoint.slug, body],
      queryFn: () =>
        (endpoint.fetch as (req: Record<string, unknown>) => Promise<unknown>)(body),
      staleTime: 5 * 60_000,
    });
  };

  return (
    <aside
      className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]"
      aria-label="FMCSA endpoints"
    >
      <div className="flex items-center gap-2 px-4 pt-14 pb-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
          FMCSA
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-6">
        {groups.map((group) => {
          const Icon = GROUP_ICON[group.group];
          return (
            <div key={group.group} className="mb-4">
              <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                <Icon size={12} strokeWidth={1.75} />
                <span>{group.label}</span>
              </div>
              <ul className="mt-0.5 space-y-px">
                {group.items.map((endpoint) => {
                  const href = `/admin/fmcsa/${endpoint.slug}`;
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
