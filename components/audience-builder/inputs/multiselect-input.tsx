'use client';

import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CriterionOption } from '@/lib/audience-builder/schema';

interface Props {
  options: CriterionOption[];
  value: string[];
  onChange: (values: string[]) => void;
  onSubmit: () => void;
}

export function MultiselectInput({ options, value, onChange, onSubmit }: Props) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, search]);

  const set = new Set(value);

  const toggle = (v: string) => {
    if (set.has(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  return (
    <div className="flex w-72 flex-col">
      <input
        autoFocus
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Search…"
        className="h-8 border-b border-[var(--color-border-subtle)] bg-transparent px-3 text-[12.5px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
      />
      <div className="max-h-64 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-3 text-[12px] text-[var(--color-text-muted)]">
            No matches
          </div>
        ) : (
          filtered.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[12.5px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <Checkbox.Root
                checked={set.has(o.value)}
                onCheckedChange={() => toggle(o.value)}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-[var(--color-border-default)] bg-[var(--color-surface-2)] data-[state=checked]:border-[var(--color-accent)] data-[state=checked]:bg-[var(--color-accent)]"
              >
                <Checkbox.Indicator>
                  <Check size={10} strokeWidth={3} className="text-black" />
                </Checkbox.Indicator>
              </Checkbox.Root>
              <span className="flex-1">{o.label}</span>
            </label>
          ))
        )}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] px-3 py-2">
        <span className="text-[11px] text-[var(--color-text-tertiary)]">
          {value.length} selected
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={value.length === 0}
          className="rounded-md border border-[var(--color-border-default)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
