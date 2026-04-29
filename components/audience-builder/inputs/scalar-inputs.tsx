'use client';

import * as Switch from '@radix-ui/react-switch';

interface BaseProps {
  onSubmit: () => void;
}

interface TextProps extends BaseProps {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
}

export function TextInput({ value, onChange, onSubmit, placeholder }: TextProps) {
  return (
    <input
      autoFocus
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmit();
        }
      }}
      placeholder={placeholder}
      className="h-9 w-56 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12.5px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
    />
  );
}

interface NumberProps extends BaseProps {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  step?: number;
}

export function NumberInput({ value, onChange, onSubmit, placeholder, step }: NumberProps) {
  return (
    <input
      autoFocus
      type="number"
      step={step}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '') return onChange(undefined);
        const n = Number(v);
        if (Number.isFinite(n)) onChange(n);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmit();
        }
      }}
      placeholder={placeholder}
      className="h-9 w-40 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12.5px] tabular-nums text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
    />
  );
}

interface CurrencyProps extends BaseProps {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}

export function CurrencyInput({ value, onChange, onSubmit }: CurrencyProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] text-[var(--color-text-muted)]">
        $
      </span>
      <input
        autoFocus
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') return onChange(undefined);
          const n = Number(v);
          if (Number.isFinite(n)) onChange(n);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="0"
        className="h-9 w-44 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] pl-6 pr-3 text-[12.5px] tabular-nums text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
      />
    </div>
  );
}

interface BooleanProps extends BaseProps {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}

export function BooleanToggle({ value, onChange, onSubmit }: BooleanProps) {
  return (
    <div className="flex items-center gap-3">
      <Switch.Root
        checked={value ?? false}
        onCheckedChange={(checked) => {
          onChange(checked);
        }}
        className="relative h-5 w-9 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-2)] transition-colors data-[state=checked]:border-[var(--color-accent)] data-[state=checked]:bg-[var(--color-accent)]"
      >
        <Switch.Thumb className="block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-[var(--color-text-secondary)] transition-transform data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-black" />
      </Switch.Root>
      <span className="text-[12px] text-[var(--color-text-secondary)]">
        {value ? 'Yes' : 'No'}
      </span>
      <button
        type="button"
        onClick={onSubmit}
        className="ml-2 rounded-md border border-[var(--color-border-default)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
      >
        Apply
      </button>
    </div>
  );
}

interface DateProps extends BaseProps {
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}

export function DateInput({ value, onChange, onSubmit }: DateProps) {
  return (
    <input
      autoFocus
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmit();
        }
      }}
      className="h-9 w-44 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 text-[12.5px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
    />
  );
}
