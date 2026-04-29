'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, X } from 'lucide-react';
import type { FilterField, FilterFieldOption } from '@/lib/data-sources/types';
import type { FormValues } from '@/lib/data-sources/url-state';

interface Props {
  fields: FilterField[];
  commonFields?: FilterField[];
  values: FormValues;
  onSubmit: (values: FormValues) => void;
  onReset: () => void;
}

const WIDTH_CLASS: Record<NonNullable<FilterField['width']>, string> = {
  sm: 'sm:col-span-3',
  md: 'sm:col-span-6',
  lg: 'sm:col-span-12',
};

export function FilterForm({ fields, commonFields = [], values, onSubmit, onReset }: Props) {
  const [draft, setDraft] = useState<FormValues>(values);

  useEffect(() => {
    setDraft(values);
  }, [values]);

  const setField = (name: string, value: FormValues[string]) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(draft);
  };

  const reset = () => {
    setDraft({});
    onReset();
  };

  const hasFilters = Object.values(draft).some(
    (v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0),
  );

  return (
    <form
      onSubmit={submit}
      className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-6 py-4"
    >
      {fields.length > 0 && <FieldGrid fields={fields} draft={draft} setField={setField} />}
      {commonFields.length > 0 && (
        <>
          {fields.length > 0 && <div className="my-3 h-px bg-[var(--color-border-subtle)]" aria-hidden />}
          <FieldGrid fields={commonFields} draft={draft} setField={setField} />
        </>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-md bg-[var(--color-accent)] px-3 text-[12px] font-medium text-black transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
        >
          Run query
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={!hasFilters}
          className="inline-flex h-8 items-center rounded-md border border-[var(--color-border-default)] bg-transparent px-3 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

function FieldGrid({
  fields,
  draft,
  setField,
}: {
  fields: FilterField[];
  draft: FormValues;
  setField: (name: string, value: FormValues[string]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-12">
      {fields.map((field) => (
        <div
          key={field.name}
          className={`flex flex-col gap-1.5 ${WIDTH_CLASS[field.width ?? 'sm']}`}
        >
          <label
            htmlFor={`f-${field.name}`}
            className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]"
          >
            {field.label}
          </label>
          <FieldInput field={field} value={draft[field.name]} onChange={(v) => setField(field.name, v)} />
        </div>
      ))}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: FormValues[string];
  onChange: (value: FormValues[string]) => void;
}) {
  if (field.kind === 'multiselect') {
    return (
      <MultiSelect
        id={`f-${field.name}`}
        options={field.options ?? []}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
        placeholder={field.placeholder ?? 'Any'}
      />
    );
  }
  if (field.kind === 'select') {
    return (
      <RadixSelect
        id={`f-${field.name}`}
        options={field.options ?? []}
        value={typeof value === 'string' ? value : ''}
        onChange={(v) => onChange(v || undefined)}
      />
    );
  }
  if (field.kind === 'boolean') {
    return (
      <BooleanToggle
        id={`f-${field.name}`}
        value={typeof value === 'boolean' ? value : undefined}
        onChange={onChange}
      />
    );
  }
  if (field.kind === 'date') {
    return (
      <input
        id={`f-${field.name}`}
        type="date"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40 [color-scheme:dark]"
      />
    );
  }
  if (field.kind === 'number') {
    return (
      <input
        id={`f-${field.name}`}
        type="number"
        inputMode="numeric"
        placeholder={field.placeholder}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40"
      />
    );
  }
  return (
    <input
      id={`f-${field.name}`}
      type="text"
      placeholder={field.placeholder}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40"
    />
  );
}

function RadixSelect({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: FilterFieldOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select.Root value={value || '__any__'} onValueChange={(v) => onChange(v === '__any__' ? '' : v)}>
      <Select.Trigger
        id={id}
        className="inline-flex h-8 w-full items-center justify-between rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-left text-[12px] text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40 data-[placeholder]:text-[var(--color-text-muted)]"
        aria-label="Select"
      >
        <Select.Value placeholder="Any" />
        <Select.Icon>
          <ChevronDown size={14} strokeWidth={1.5} className="text-[var(--color-text-tertiary)]" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] shadow-2xl"
        >
          <Select.Viewport className="p-1">
            <Select.Item
              value="__any__"
              className="relative flex h-7 cursor-default select-none items-center rounded px-6 text-[12px] text-[var(--color-text-tertiary)] outline-none data-[highlighted]:bg-[var(--color-surface-3)] data-[state=checked]:font-medium data-[state=checked]:text-[var(--color-text-primary)]"
            >
              <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                <Check size={11} strokeWidth={2.5} />
              </Select.ItemIndicator>
              <Select.ItemText>Any</Select.ItemText>
            </Select.Item>
            {options.map((o) => (
              <Select.Item
                key={o.value}
                value={o.value}
                className="relative flex h-7 cursor-default select-none items-center rounded px-6 text-[12px] text-[var(--color-text-primary)] outline-none data-[highlighted]:bg-[var(--color-surface-3)] data-[state=checked]:font-medium"
              >
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check size={11} strokeWidth={2.5} />
                </Select.ItemIndicator>
                <Select.ItemText>{o.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function BooleanToggle({
  id,
  value,
  onChange,
}: {
  id: string;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}) {
  const baseClass =
    'h-full flex-1 px-2 text-[11px] font-medium transition-colors first:rounded-l-md last:rounded-r-md';
  const activeClass = 'bg-[var(--color-surface-3)] text-[var(--color-text-primary)]';
  const inactiveClass =
    'bg-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]';

  return (
    <div
      id={id}
      role="radiogroup"
      className="flex h-8 overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)]"
    >
      <button
        type="button"
        onClick={() => onChange(undefined)}
        aria-checked={value === undefined}
        role="radio"
        className={`${baseClass} ${value === undefined ? activeClass : inactiveClass}`}
      >
        Any
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-checked={value === true}
        role="radio"
        className={`${baseClass} border-l border-[var(--color-border-default)] ${
          value === true ? activeClass : inactiveClass
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-checked={value === false}
        role="radio"
        className={`${baseClass} border-l border-[var(--color-border-default)] ${
          value === false ? activeClass : inactiveClass
        }`}
      >
        No
      </button>
    </div>
  );
}

function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  options: FilterFieldOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [filter, setFilter] = useState('');

  const labelLookup = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);

  const filtered = useMemo(
    () =>
      filter
        ? options.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()))
        : options,
    [options, filter],
  );

  const summary = (() => {
    if (value.length === 0) return null;
    const shown = value.slice(0, 4).map((v) => labelLookup.get(v) ?? v).join(', ');
    return value.length > 4 ? `${shown}, +${value.length - 4}` : shown;
  })();

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <Popover.Root>
      <div className="relative">
        <Popover.Trigger asChild>
          <button
            type="button"
            id={id}
            className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-left text-[12px] text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40"
            aria-haspopup="listbox"
          >
            <span className="flex flex-1 items-center gap-1 overflow-hidden">
              {summary == null ? (
                <span className="text-[var(--color-text-muted)]">{placeholder}</span>
              ) : (
                <span className="truncate text-[var(--color-text-primary)]">{summary}</span>
              )}
            </span>
            <ChevronDown size={14} strokeWidth={1.5} className="shrink-0 text-[var(--color-text-tertiary)]" />
          </button>
        </Popover.Trigger>
        {value.length > 0 && (
          <button
            type="button"
            aria-label="Clear"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange([]);
            }}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        )}
      </div>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[14rem] overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] shadow-2xl"
        >
          {options.length > 0 && (
            <div className="border-b border-[var(--color-border-subtle)] p-1.5">
              <input
                autoFocus
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter…"
                className="h-7 w-full rounded bg-[var(--color-surface-3)] px-2 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>
          )}
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 && (
              <li className="px-3 py-2 text-[12px] text-[var(--color-text-tertiary)]">
                No options
              </li>
            )}
            {options.length > 0 && filtered.length === 0 && (
              <li className="px-3 py-2 text-[12px] text-[var(--color-text-tertiary)]">No matches</li>
            )}
            {filtered.map((o) => {
              const checked = value.includes(o.value);
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(o.value)}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]"
                  >
                    <span
                      className={
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors ' +
                        (checked
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-black'
                          : 'border-[var(--color-border-default)] bg-transparent')
                      }
                    >
                      {checked && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span className="flex-1 truncate">{o.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
