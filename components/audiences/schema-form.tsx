'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

import type {
  AttributeSchema,
  AudienceTemplateDetail,
} from '@/lib/dex-audiences';
import {
  HIDDEN_FIELDS,
  partitionFields,
  type FormValue,
  type FormValues,
} from '@/lib/audiences/schema';

interface Props {
  template: AudienceTemplateDetail;
  values: FormValues;
  errors: Record<string, string>;
  onChange: (name: string, value: FormValue) => void;
}

export function SchemaForm({ template, values, errors, onChange }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { primary, advanced } = partitionFields(template);

  return (
    <div className="space-y-5">
      {primary.length > 0 && (
        <FieldGrid
          schemaMap={template.attribute_schema}
          names={primary}
          values={values}
          errors={errors}
          onChange={onChange}
        />
      )}

      {advanced.length > 0 && (
        <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
          <button
            type="button"
            onClick={() => setAdvancedOpen((p) => !p)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            aria-expanded={advancedOpen}
          >
            <span className="flex items-center gap-2">
              <ChevronDown
                size={14}
                strokeWidth={1.75}
                className={
                  'transition-transform ' + (advancedOpen ? '' : '-rotate-90')
                }
              />
              Advanced
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              {advanced.length} {advanced.length === 1 ? 'field' : 'fields'}
            </span>
          </button>
          {advancedOpen && (
            <div className="border-t border-[var(--color-border-subtle)] px-3 py-4">
              <FieldGrid
                schemaMap={template.attribute_schema}
                names={advanced}
                values={values}
                errors={errors}
                onChange={onChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldGrid({
  schemaMap,
  names,
  values,
  errors,
  onChange,
}: {
  schemaMap: Record<string, AttributeSchema>;
  names: string[];
  values: FormValues;
  errors: Record<string, string>;
  onChange: (name: string, value: FormValue) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-12">
      {names.map((name) => {
        if (HIDDEN_FIELDS.has(name)) return null;
        const schema = schemaMap[name];
        if (!schema) return null;
        return (
          <FieldRow
            key={name}
            name={name}
            schema={schema}
            value={values[name]}
            error={errors[name]}
            onChange={(v) => onChange(name, v)}
          />
        );
      })}
    </div>
  );
}

function FieldRow({
  name,
  schema,
  value,
  error,
  onChange,
}: {
  name: string;
  schema: AttributeSchema;
  value: FormValue;
  error: string | undefined;
  onChange: (value: FormValue) => void;
}) {
  const id = `audf-${name}`;
  const widthClass = fieldWidth(schema);
  return (
    <div className={`flex flex-col gap-1.5 ${widthClass}`}>
      <label
        htmlFor={id}
        className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]"
      >
        {schema.label}
      </label>
      <FieldInput id={id} schema={schema} value={value} onChange={onChange} />
      {schema.description && !error && (
        <p className="text-[11px] leading-snug text-[var(--color-text-muted)]">
          {schema.description}
        </p>
      )}
      {error && (
        <p className="text-[11px] leading-snug text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  );
}

function fieldWidth(schema: AttributeSchema): string {
  if (schema.type === 'string_array') return 'sm:col-span-12';
  if (schema.type === 'boolean') return 'sm:col-span-6';
  if (schema.type === 'integer') return 'sm:col-span-6';
  if (schema.type === 'date') return 'sm:col-span-6';
  if (schema.enum && schema.enum.length > 0) return 'sm:col-span-6';
  return 'sm:col-span-12';
}

function FieldInput({
  id,
  schema,
  value,
  onChange,
}: {
  id: string;
  schema: AttributeSchema;
  value: FormValue;
  onChange: (value: FormValue) => void;
}) {
  if (schema.type === 'boolean') {
    return (
      <BooleanToggle
        id={id}
        value={typeof value === 'boolean' ? value : undefined}
        onChange={onChange}
      />
    );
  }
  if (schema.type === 'integer') {
    return (
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={schema.min}
        max={schema.max}
        value={typeof value === 'number' ? String(value) : ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(undefined);
            return;
          }
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
        className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
      />
    );
  }
  if (schema.type === 'date') {
    return (
      <input
        id={id}
        type="date"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] [color-scheme:dark]"
      />
    );
  }
  if (schema.type === 'string') {
    if (schema.enum && schema.enum.length > 0) {
      return (
        <NativeSelect
          id={id}
          options={schema.enum.map((v) => ({
            value: v,
            label: schema.enum_labels?.[v] ?? v,
          }))}
          value={typeof value === 'string' ? value : ''}
          onChange={(v) => onChange(v || undefined)}
        />
      );
    }
    return (
      <input
        id={id}
        type="text"
        pattern={schema.pattern}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
      />
    );
  }
  if (schema.type === 'string_array') {
    const items = schema.items;
    if (items?.enum && items.enum.length > 0) {
      return (
        <MultiSelect
          id={id}
          options={items.enum.map((v) => ({
            value: v,
            label: schema.enum_labels?.[v] ?? v,
          }))}
          value={Array.isArray(value) ? value : []}
          onChange={(next) => onChange(next.length ? next : undefined)}
          placeholder="Any"
        />
      );
    }
    return (
      <ChipsInput
        id={id}
        value={Array.isArray(value) ? value : []}
        onChange={(next) => onChange(next.length ? next : undefined)}
        pattern={items?.pattern}
      />
    );
  }
  return null;
}

function NativeSelect({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: { value: string; label: string }[];
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
  options: { value: string; label: string }[];
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
            <span className="truncate text-[var(--color-text-primary)]">
              {value
                .slice(0, 4)
                .map((v) => labelLookup.get(v) ?? v)
                .join(', ')}
              {value.length > 4 ? `, +${value.length - 4}` : ''}
            </span>
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

function ChipsInput({
  id,
  value,
  onChange,
  pattern,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  pattern: string | undefined;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const upper = pattern && /\^\[A-Z\]/.test(pattern) ? trimmed.toUpperCase() : trimmed;
    if (value.includes(upper)) {
      setDraft('');
      return;
    }
    onChange([...value, upper]);
    setDraft('');
  };

  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  return (
    <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-2 py-1.5">
      {value.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-3)] px-1.5 py-0.5 text-[11px] text-[var(--color-text-primary)]"
        >
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => remove(v)}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            <X size={10} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && draft === '' && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length === 0 ? 'Type and press Enter…' : ''}
        className="h-6 min-w-[6rem] flex-1 bg-transparent text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
      />
    </div>
  );
}
