'use client';

import { useMemo, useState } from 'react';
import type { CriterionOption } from '@/lib/audience-builder/schema';

interface Props {
  options: CriterionOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  onSubmit: () => void;
}

export function SingleSelectInput({ options, value, onChange, onSubmit }: Props) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, search]);

  return (
    <div className="flex w-64 flex-col">
      <input
        autoFocus
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                onSubmit();
              }}
              className={
                'flex w-full items-center justify-between px-3 py-1.5 text-left text-[12.5px] transition-colors hover:bg-[var(--color-surface-2)] ' +
                (value === o.value
                  ? 'text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)]')
              }
            >
              <span>{o.label}</span>
              {value === o.value && (
                <span className="text-[10px] text-[var(--color-accent)]">✓</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
