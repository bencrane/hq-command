'use client';

import type { CriterionDef, CriterionValue } from '@/lib/audience-builder/schema';
import { MultiselectInput } from './inputs/multiselect-input';
import { SingleSelectInput } from './inputs/single-select-input';
import {
  BooleanToggle,
  CurrencyInput,
  DateInput,
  NumberInput,
  TextInput,
} from './inputs/scalar-inputs';

interface Props {
  def: CriterionDef;
  value: CriterionValue;
  onChange: (next: CriterionValue) => void;
  onSubmit: () => void;
}

export function CriterionValueEditor({ def, value, onChange, onSubmit }: Props) {
  const op = value.op ?? def.operators[0];

  switch (def.type) {
    case 'multiselect':
      return (
        <MultiselectInput
          options={def.options ?? []}
          value={value.values ?? []}
          onChange={(values) => onChange({ key: def.key, op, values })}
          onSubmit={onSubmit}
        />
      );
    case 'select':
      return (
        <SingleSelectInput
          options={def.options ?? []}
          value={typeof value.value === 'string' ? value.value : undefined}
          onChange={(v) =>
            onChange({ key: def.key, op, value: v ?? undefined })
          }
          onSubmit={onSubmit}
        />
      );
    case 'text':
      return (
        <div className="p-3">
          <TextInput
            value={typeof value.value === 'string' ? value.value : undefined}
            onChange={(v) => onChange({ key: def.key, op, value: v })}
            onSubmit={onSubmit}
            placeholder={def.description}
          />
        </div>
      );
    case 'integer':
      return (
        <div className="p-3">
          <NumberInput
            value={typeof value.value === 'number' ? value.value : undefined}
            onChange={(v) => onChange({ key: def.key, op, value: v })}
            onSubmit={onSubmit}
            step={1}
          />
        </div>
      );
    case 'currency':
      return (
        <div className="p-3">
          <CurrencyInput
            value={typeof value.value === 'number' ? value.value : undefined}
            onChange={(v) => onChange({ key: def.key, op, value: v })}
            onSubmit={onSubmit}
          />
        </div>
      );
    case 'boolean':
      return (
        <div className="p-3">
          <BooleanToggle
            value={typeof value.value === 'boolean' ? value.value : undefined}
            onChange={(v) => onChange({ key: def.key, op, value: v })}
            onSubmit={onSubmit}
          />
        </div>
      );
    case 'date':
      return (
        <div className="p-3">
          <DateInput
            value={typeof value.value === 'string' ? value.value : undefined}
            onChange={(v) => onChange({ key: def.key, op, value: v })}
            onSubmit={onSubmit}
          />
        </div>
      );
    case 'date_range':
      // For v1 the backend lists none; render as date input that the user repeats.
      return (
        <div className="p-3">
          <DateInput
            value={typeof value.value === 'string' ? value.value : undefined}
            onChange={(v) => onChange({ key: def.key, op, value: v })}
            onSubmit={onSubmit}
          />
        </div>
      );
  }
}

// Format a criterion value as a chip summary string ("CA, TX, NV" / "≥ 5" / "Active").
export function describeValue(def: CriterionDef, value: CriterionValue): string {
  if (value.values && value.values.length) {
    const labels = value.values.map((v) => labelForOption(def, v));
    if (labels.length <= 3) return labels.join(', ');
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
  }
  if (value.value === undefined || value.value === null || value.value === '') {
    return '—';
  }
  if (typeof value.value === 'boolean') {
    return value.value ? 'Yes' : 'No';
  }
  if (def.type === 'select' && typeof value.value === 'string') {
    return labelForOption(def, value.value);
  }
  if (def.type === 'currency' && typeof value.value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value.value);
  }
  return String(value.value);
}

export function describeOp(op: CriterionValue['op']): string {
  switch (op) {
    case 'in':
      return 'in';
    case 'eq':
      return '=';
    case 'gte':
      return '≥';
    case 'lte':
      return '≤';
    case 'between':
      return 'between';
    case 'contains':
      return 'contains';
  }
}

function labelForOption(def: CriterionDef, value: string): string {
  const opt = def.options?.find((o) => o.value === value);
  return opt?.label ?? value;
}

// Whether the value editor produced a value that should be persisted as a chip.
export function isCriterionValueComplete(
  def: CriterionDef,
  value: CriterionValue,
): boolean {
  if (def.type === 'multiselect') return (value.values?.length ?? 0) > 0;
  if (def.type === 'boolean') return typeof value.value === 'boolean';
  if (value.value === undefined || value.value === null || value.value === '')
    return false;
  return true;
}
