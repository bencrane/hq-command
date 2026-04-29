'use client';

import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  total: number | null;
  itemsCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  onChange: (next: { limit: number; offset: number }) => void;
}

const PAGE_SIZES = [25, 50, 100, 250, 500];
const NUMBER_FMT = new Intl.NumberFormat('en-US');

export function Pagination({ total, itemsCount, limit, offset, hasMore, onChange }: Props) {
  const start = itemsCount === 0 ? 0 : offset + 1;
  const end = offset + itemsCount;
  const prevDisabled = offset === 0;
  const nextDisabled = !hasMore && itemsCount < limit;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-6 py-2.5 text-[12px]">
      <div className="text-[var(--color-text-secondary)]">
        {itemsCount > 0 && (
          <span>
            Showing{' '}
            <span className="text-[var(--color-text-primary)] tabular-nums">
              {NUMBER_FMT.format(start)}–{NUMBER_FMT.format(end)}
            </span>{' '}
            {total != null && (
              <>
                of{' '}
                <span className="text-[var(--color-text-primary)] tabular-nums">
                  {NUMBER_FMT.format(total)}
                </span>
              </>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select.Root
          value={String(limit)}
          onValueChange={(v) => onChange({ limit: Number(v), offset: 0 })}
        >
          <Select.Trigger
            aria-label="Rows per page"
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] pl-2 pr-1.5 text-[12px] text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <span className="text-[var(--color-text-tertiary)]">Rows</span>
            <Select.Value />
            <Select.Icon>
              <ChevronDown size={12} strokeWidth={1.75} className="text-[var(--color-text-tertiary)]" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              position="popper"
              sideOffset={4}
              className="z-50 overflow-hidden rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] shadow-2xl"
            >
              <Select.Viewport className="p-1">
                {PAGE_SIZES.map((s) => (
                  <Select.Item
                    key={s}
                    value={String(s)}
                    className="relative flex h-7 select-none items-center rounded px-6 text-[12px] text-[var(--color-text-primary)] outline-none data-[highlighted]:bg-[var(--color-surface-3)] data-[state=checked]:font-medium"
                  >
                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                      <Check size={11} strokeWidth={2.5} />
                    </Select.ItemIndicator>
                    <Select.ItemText>{s}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        <div className="flex items-center gap-1">
          <PageBtn
            disabled={prevDisabled}
            onClick={() => onChange({ limit, offset: Math.max(0, offset - limit) })}
            label="Previous page"
          >
            <ChevronLeft size={14} strokeWidth={1.75} />
          </PageBtn>
          <PageBtn
            disabled={nextDisabled}
            onClick={() => onChange({ limit, offset: offset + limit })}
            label="Next page"
          >
            <ChevronRight size={14} strokeWidth={1.75} />
          </PageBtn>
        </div>
      </div>
    </div>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--color-border-default)] disabled:hover:text-[var(--color-text-secondary)]"
    >
      {children}
    </button>
  );
}
