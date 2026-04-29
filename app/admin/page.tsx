import Link from 'next/link';
import { ArrowUpRight, Boxes, Layers } from 'lucide-react';

interface AdminTile {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const TILES: AdminTile[] = [
  {
    href: '/admin/fmcsa',
    title: 'FMCSA',
    description: 'Carrier audiences and search across the FMCSA dataset.',
    icon: Boxes,
  },
  {
    href: '/admin/audiences',
    title: 'Audiences',
    description: 'Browse and customize audience templates with live counts.',
    icon: Layers,
  },
];

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
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="group relative rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-4 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent)]">
                  <Icon size={14} strokeWidth={1.75} />
                </div>
                <ArrowUpRight
                  size={14}
                  strokeWidth={1.75}
                  className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text-primary)]"
                />
              </div>
              <div className="mt-4">
                <div className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  {tile.title}
                </div>
                <div className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
                  {tile.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
