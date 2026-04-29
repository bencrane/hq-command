'use client';

import * as Popover from '@radix-ui/react-popover';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  groupCriteria,
  type CriteriaSchema,
  type CriterionDef,
  type CriterionValue,
} from '@/lib/audience-builder/schema';
import {
  CriterionValueEditor,
  isCriterionValueComplete,
} from './criterion-value-editor';

interface Props {
  schema: CriteriaSchema;
  excludeKeys: Set<string>;
  onAdd: (value: CriterionValue) => void;
}

type Stage =
  | { kind: 'picker' }
  | { kind: 'editor'; def: CriterionDef; value: CriterionValue };

export function AddCriterionPopover({ schema, excludeKeys, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>({ kind: 'picker' });

  useEffect(() => {
    if (open) setStage({ kind: 'picker' });
  }, [open]);

  const handleSelect = (def: CriterionDef) => {
    const op = def.operators[0];
    const initial: CriterionValue =
      def.type === 'multiselect'
        ? { key: def.key, op, values: [] }
        : { key: def.key, op };
    setStage({ kind: 'editor', def, value: initial });
  };

  const submit = () => {
    if (stage.kind !== 'editor') return;
    if (!isCriterionValueComplete(stage.def, stage.value)) return;
    onAdd(stage.value);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-dashed border-[var(--color-border-default)] bg-transparent px-2.5 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]"
        >
          <Plus size={12} strokeWidth={2} />
          Add criterion
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-1)] shadow-2xl"
        >
          {stage.kind === 'picker' ? (
            <CriterionPicker
              schema={schema}
              excludeKeys={excludeKeys}
              onSelect={handleSelect}
            />
          ) : (
            <EditorPane
              def={stage.def}
              value={stage.value}
              onChange={(v) => setStage({ kind: 'editor', def: stage.def, value: v })}
              onSubmit={submit}
              onBack={() => setStage({ kind: 'picker' })}
            />
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function CriterionPicker({
  schema,
  excludeKeys,
  onSelect,
}: {
  schema: CriteriaSchema;
  excludeKeys: Set<string>;
  onSelect: (def: CriterionDef) => void;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const groups = useMemo(() => {
    const all = groupCriteria(schema);
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all
      .map(({ group, items }) => ({
        group,
        items: items.filter(
          (c) =>
            c.label.toLowerCase().includes(q) ||
            c.key.toLowerCase().includes(q) ||
            (c.description?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter(({ items }) => items.length > 0);
  }, [schema, search]);

  return (
    <div className="flex w-80 flex-col">
      <div className="border-b border-[var(--color-border-subtle)] px-3 py-2">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search criteria…"
          className="h-7 w-full bg-transparent text-[12.5px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
        />
      </div>
      <div className="max-h-80 overflow-y-auto py-1">
        {groups.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12px] text-[var(--color-text-muted)]">
            No criteria match
          </div>
        ) : (
          groups.map(({ group, items }) => (
            <div key={group.id} className="mb-2 last:mb-0">
              <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                {group.label}
              </div>
              {items.map((c) => {
                const disabled = excludeKeys.has(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    disabled={disabled || c.coming_soon}
                    onClick={() => onSelect(c)}
                    className={
                      'flex w-full flex-col gap-0.5 px-3 py-1.5 text-left transition-colors ' +
                      (disabled || c.coming_soon
                        ? 'cursor-not-allowed opacity-40'
                        : 'hover:bg-[var(--color-surface-2)]')
                    }
                  >
                    <span className="text-[12.5px] text-[var(--color-text-primary)]">
                      {c.label}
                      {c.coming_soon && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          Coming soon
                        </span>
                      )}
                      {disabled && !c.coming_soon && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          Active
                        </span>
                      )}
                    </span>
                    {c.description && (
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">
                        {c.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EditorPane({
  def,
  value,
  onChange,
  onSubmit,
  onBack,
}: {
  def: CriterionDef;
  value: CriterionValue;
  onChange: (next: CriterionValue) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-3 py-2">
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          ← Back
        </button>
        <div className="text-[12.5px] font-medium text-[var(--color-text-primary)]">
          {def.label}
        </div>
        <div className="w-10" aria-hidden />
      </div>
      <CriterionValueEditor
        def={def}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </div>
  );
}
