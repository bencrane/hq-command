'use client';

import * as Popover from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  CriterionDef,
  CriterionValue,
} from '@/lib/audience-builder/schema';
import {
  CriterionValueEditor,
  describeOp,
  describeValue,
  isCriterionValueComplete,
} from './criterion-value-editor';

interface Props {
  def: CriterionDef;
  value: CriterionValue;
  onChange: (next: CriterionValue) => void;
  onRemove: () => void;
  /** When true, open the chip's editor immediately on mount. */
  openImmediately?: boolean;
  /** When true, briefly highlight the chip (e.g. "show me which" hint). */
  highlight?: boolean;
}

export function FilterChip({
  def,
  value,
  onChange,
  onRemove,
  openImmediately,
  highlight,
}: Props) {
  const [open, setOpen] = useState(!!openImmediately);
  const [draft, setDraft] = useState<CriterionValue>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const submit = () => {
    if (!isCriterionValueComplete(def, draft)) return;
    onChange(draft);
    setOpen(false);
  };

  const showOp = def.operators.length > 1 || def.operators[0] !== 'in';
  const opLabel = describeOp(value.op);
  const summary = describeValue(def, value);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(value);
      }}
    >
      <div
        className={
          'inline-flex items-center gap-px rounded-md border bg-[var(--color-surface-2)] text-[12px] transition-colors ' +
          (highlight
            ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
            : 'border-[var(--color-border-default)]')
        }
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-l-md px-2.5 py-1 text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-3)]"
          >
            <span className="text-[var(--color-text-tertiary)]">{def.label}</span>
            {showOp && opLabel !== 'in' && (
              <span className="text-[var(--color-text-muted)]">{opLabel}</span>
            )}
            <span className="font-medium">{summary}</span>
          </button>
        </Popover.Trigger>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${def.label}`}
          className="flex h-full items-center rounded-r-md border-l border-[var(--color-border-default)] px-1.5 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)]"
        >
          <X size={11} strokeWidth={2.25} />
        </button>
      </div>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-1)] shadow-2xl"
        >
          <div className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-[12.5px] font-medium text-[var(--color-text-primary)]">
            {def.label}
          </div>
          <CriterionValueEditor
            def={def}
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
