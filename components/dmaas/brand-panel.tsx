'use client';

import { useState } from 'react';
import { Globe, Loader2, RefreshCw } from 'lucide-react';
import { dmaasClient } from '@/lib/dmaas/client';
import { useDesignerStore } from '@/lib/dmaas/store';
import { DEFAULT_BRAND, type BrandPalette } from '@/lib/dmaas/types';

export function BrandPanel() {
  const brand = useDesignerStore((s) => s.brand);
  const setBrand = useDesignerStore((s) => s.setBrand);
  const [domain, setDomain] = useState(brand.domain ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchBrand() {
    if (!domain.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const next = await dmaasClient.fetchBrand(domain.trim());
      setBrand(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch_failed');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setBrand(DEFAULT_BRAND);
    setDomain('');
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void fetchBrand();
        }}
        className="space-y-1.5"
      >
        <div className="flex items-center gap-1.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-1)] px-2 py-1.5 transition-colors focus-within:border-[var(--color-accent)]">
          <Globe size={12} className="text-[var(--color-text-muted)]" />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="brand.com"
            className="w-full bg-transparent text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
          />
          <button
            type="submit"
            disabled={busy || !domain.trim()}
            className="text-[10.5px] uppercase tracking-[1px] text-[var(--color-accent)] disabled:opacity-30"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : 'fetch'}
          </button>
        </div>
        {error && <p className="text-[10.5px] text-[var(--color-danger)]">{error}</p>}
      </form>

      <BrandPreview palette={brand.palette} name={brand.name} logoUrl={brand.logoUrl} />

      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[1px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        <RefreshCw size={10} />
        Reset to default brand
      </button>
    </div>
  );
}

function BrandPreview({
  palette,
  name,
  logoUrl,
}: {
  palette: BrandPalette;
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-2.5">
      <div className="flex items-center gap-2">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded border border-[var(--color-border-default)]"
          style={{ background: palette.primary }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-[10px] font-semibold text-white/90">
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-medium text-[var(--color-text-primary)]">
            {name}
          </div>
          <div className="text-[10.5px] text-[var(--color-text-tertiary)]">brand palette</div>
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        {(['primary', 'secondary', 'accent', 'text', 'background'] as const).map((k) => (
          <div
            key={k}
            title={`${k} · ${palette[k]}`}
            className="h-5 flex-1 rounded-sm border border-[var(--color-border-default)]"
            style={{ background: palette[k] }}
          />
        ))}
      </div>
    </div>
  );
}
