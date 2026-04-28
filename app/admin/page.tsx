import Link from 'next/link';
import { ArrowUpRight, Boxes } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-20 pb-12">
      <h1 className="text-[18px] font-medium tracking-tight text-[var(--color-text-primary)]">
        Admin
      </h1>
      <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">
        Internal tools and audiences.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/fmcsa"
          className="group relative rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]">
              <Boxes size={14} strokeWidth={1.75} />
            </div>
            <ArrowUpRight
              size={14}
              strokeWidth={1.75}
              className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text-primary)]"
            />
          </div>
          <div className="mt-4">
            <div className="text-[14px] font-medium text-[var(--color-text-primary)]">
              FMCSA
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
              Carrier audiences and search across the FMCSA dataset.
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
