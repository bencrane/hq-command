'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import type { FilterField, FilterFieldOption } from '@/lib/fmcsa/registry';
import type { FormValues } from '@/lib/fmcsa/url-state';

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
      {fields.length > 0 && (
        <FieldGrid fields={fields} draft={draft} setField={setField} />
      )}
      {commonFields.length > 0 && (
        <>
          {fields.length > 0 && (
            <div className="my-3 h-px bg-[var(--color-border-subtle)]" aria-hidden />
          )}
          <FieldGrid fields={commonFields} draft={draft} setField={setField} />
        </>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-md bg-[var(--color-accent)] px-3 text-[12px] font-medium text-black transition-colors hover:bg-[var(--color-accent-hover)]"
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
          <FieldInput
            field={field}
            value={draft[field.name]}
            onChange={(v) => setField(field.name, v)}
          />
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
      <NativeSelect
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
        className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] [color-scheme:dark]"
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
        className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
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
      className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
    />
  );
}

function NativeSelect({
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
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full appearance-none rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] pl-2 pr-7 text-[12px] text-[var(--color-text-primary)]"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.5}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
      />
    </div>
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
  const next = (n: boolean | undefined) => () => onChange(n);
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
        onClick={next(undefined)}
        aria-checked={value === undefined}
        role="radio"
        className={`${baseClass} ${value === undefined ? activeClass : inactiveClass}`}
      >
        Any
      </button>
      <button
        type="button"
        onClick={next(true)}
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
        onClick={next(false)}
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
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const filtered = filter
    ? options.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()))
    : options;

  const labelLookup = new Map(options.map((o) => [o.value, o.label]));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((p) => !p)}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-left text-[12px] text-[var(--color-text-primary)]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex flex-1 items-center gap-1 overflow-hidden">
          {value.length === 0 ? (
            <span className="text-[var(--color-text-muted)]">{placeholder}</span>
          ) : (
            <>
              <span className="truncate text-[var(--color-text-primary)]">
                {value
                  .slice(0, 4)
                  .map((v) => labelLookup.get(v) ?? v)
                  .join(', ')}
                {value.length > 4 ? `, +${value.length - 4}` : ''}
              </span>
            </>
          )}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className="shrink-0 text-[var(--color-text-tertiary)]"
        />
      </button>
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Clear"
          onClick={(e) => {
            e.stopPropagation();
            onChange([]);
          }}
          className="absolute right-7 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
        >
          <X size={12} strokeWidth={1.75} />
        </button>
      )}
      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[12rem] overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] shadow-2xl">
          <div className="border-b border-[var(--color-border-subtle)] p-1.5">
            <input
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="h-7 w-full rounded bg-[var(--color-surface-3)] px-2 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-[12px] text-[var(--color-text-tertiary)]">
                No matches
              </li>
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
        </div>
      )}
    </div>
  );
}
