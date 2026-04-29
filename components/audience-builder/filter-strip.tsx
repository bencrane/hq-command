'use client';

import { RotateCcw } from 'lucide-react';
import { findCriterion, type CriteriaSchema, type CriterionValue } from '@/lib/audience-builder/schema';
import { AddCriterionPopover } from './add-criterion-popover';
import { FilterChip } from './filter-chip';

interface Props {
  schema: CriteriaSchema;
  criteria: CriterionValue[];
  highlightKeys?: Set<string>;
  onChange: (next: CriterionValue[]) => void;
}

export function FilterStrip({ schema, criteria, highlightKeys, onChange }: Props) {
  const excludeKeys = new Set(criteria.map((c) => c.key));

  const handleAdd = (value: CriterionValue) => {
    onChange([...criteria, value]);
  };

  const handleEdit = (idx: number, next: CriterionValue) => {
    const copy = [...criteria];
    copy[idx] = next;
    onChange(copy);
  };

  const handleRemove = (idx: number) => {
    onChange(criteria.filter((_, i) => i !== idx));
  };

  const handleReset = () => onChange([]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-6 py-3">
      {criteria.map((c, idx) => {
        const def = findCriterion(schema, c.key);
        if (!def) return null;
        return (
          <FilterChip
            key={`${c.key}-${idx}`}
            def={def}
            value={c}
            onChange={(next) => handleEdit(idx, next)}
            onRemove={() => handleRemove(idx)}
            highlight={highlightKeys?.has(c.key)}
          />
        );
      })}
      <AddCriterionPopover
        schema={schema}
        excludeKeys={excludeKeys}
        onAdd={handleAdd}
      />
      {criteria.length > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <RotateCcw size={11} strokeWidth={2} />
          Reset
        </button>
      )}
    </div>
  );
}
