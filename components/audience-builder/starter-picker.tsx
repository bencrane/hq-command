'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Sparkles } from 'lucide-react';
import { STARTERS, type StarterAudience } from '@/lib/audience-builder/starters';

interface Props {
  onPick: (starter: StarterAudience) => void;
  hasCriteria: boolean;
}

const GROUP_LABEL: Record<StarterAudience['group'], string> = {
  fmcsa: 'FMCSA carriers',
  usaspending: 'Federal contracts',
  sam: 'SAM',
  bridge: 'Bridge audiences',
};

export function StarterPicker({ onPick, hasCriteria }: Props) {
  const grouped = groupBy(STARTERS, (s) => s.group);

  const handle = (s: StarterAudience) => {
    if (hasCriteria) {
      const ok = window.confirm(
        'Replace current criteria with this starter audience?',
      );
      if (!ok) return;
    }
    onPick(s);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2.5 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
        >
          <Sparkles size={12} strokeWidth={1.75} />
          <span>Starter</span>
          <ChevronDown size={12} strokeWidth={1.75} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-72 overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-1)] shadow-2xl"
        >
          <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
            Starter audiences
          </div>
          <div className="max-h-[28rem] overflow-y-auto pb-1">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="border-t border-[var(--color-border-subtle)] py-1 first:border-t-0">
                <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {GROUP_LABEL[group as StarterAudience['group']]}
                </div>
                {items.map((s) => (
                  <DropdownMenu.Item
                    key={s.slug}
                    onSelect={() => handle(s)}
                    className="flex cursor-pointer flex-col gap-0.5 px-3 py-1.5 text-left transition-colors outline-none data-[highlighted]:bg-[var(--color-surface-2)]"
                  >
                    <span className="text-[12.5px] text-[var(--color-text-primary)]">
                      {s.label}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">
                      {s.description}
                    </span>
                  </DropdownMenu.Item>
                ))}
              </div>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function groupBy<T, K extends string>(items: T[], key: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const it of items) {
    const k = key(it);
    if (!out[k]) out[k] = [];
    out[k].push(it);
  }
  return out;
}
