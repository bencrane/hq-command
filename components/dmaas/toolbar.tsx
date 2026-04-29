'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  Eye,
  Grid3x3,
  Maximize,
  Redo2,
  Save,
  Square,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useDesignerStore } from '@/lib/dmaas/store';
import { dmaasClient } from '@/lib/dmaas/client';

export function Toolbar() {
  const designName = useDesignerStore((s) => s.designName);
  const setDesignName = useDesignerStore((s) => s.setDesignName);
  const dirty = useDesignerStore((s) => s.dirty);
  const saving = useDesignerStore((s) => s.saving);
  const lastSavedAt = useDesignerStore((s) => s.lastSavedAt);
  const versionNumber = useDesignerStore((s) => s.versionNumber);
  const designId = useDesignerStore((s) => s.designId);
  const specVariant = useDesignerStore((s) => s.specVariant);
  const brand = useDesignerStore((s) => s.brand);
  const config = useDesignerStore((s) => s.config);
  const past = useDesignerStore((s) => s.past);
  const future = useDesignerStore((s) => s.future);
  const undo = useDesignerStore((s) => s.undo);
  const redo = useDesignerStore((s) => s.redo);
  const startSave = useDesignerStore((s) => s.startSave);
  const finishSave = useDesignerStore((s) => s.finishSave);
  const zoom = useDesignerStore((s) => s.zoom);
  const setZoom = useDesignerStore((s) => s.setZoom);
  const setPan = useDesignerStore((s) => s.setPan);
  const showGrid = useDesignerStore((s) => s.showGrid);
  const showSafeZone = useDesignerStore((s) => s.showSafeZone);
  const showBleed = useDesignerStore((s) => s.showBleed);
  const toggle = useDesignerStore((s) => s.toggle);

  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!savedFlash) return;
    const t = setTimeout(() => setSavedFlash(false), 1500);
    return () => clearTimeout(t);
  }, [savedFlash]);

  // Cmd+Z / Cmd+Shift+Z, Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (inField) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (meta && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (meta && e.key === 's') {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, designId, designName, specVariant, brand, config]);

  async function save() {
    if (saving) return;
    startSave();
    try {
      const design = await dmaasClient.saveDesign({
        id: designId,
        name: designName,
        specCategory: 'postcard',
        specVariant,
        brand,
        config,
      });
      finishSave(design.id, design.versionNumber);
      setSavedFlash(true);
    } catch {
      finishSave(designId ?? '', versionNumber);
    }
  }

  return (
    <div className="flex items-center gap-1 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3 py-2">
      <input
        value={designName}
        onChange={(e) => setDesignName(e.target.value)}
        className="min-w-0 max-w-[200px] truncate bg-transparent text-[12.5px] font-medium text-[var(--color-text-primary)] outline-none focus:outline-none focus-visible:underline"
      />
      <span className="text-[10.5px] text-[var(--color-text-muted)]">v{versionNumber}</span>
      <div className="ml-2 text-[10.5px] text-[var(--color-text-tertiary)]">
        {savedFlash ? (
          <span className="inline-flex items-center gap-1 text-[var(--color-accent)]">
            <Check size={10} /> saved
          </span>
        ) : dirty ? (
          'unsaved changes'
        ) : lastSavedAt ? (
          `saved ${relTime(lastSavedAt)}`
        ) : (
          'unsaved'
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ToolbarButton
          icon={<Undo2 size={13} />}
          label="Undo"
          disabled={past.length === 0}
          onClick={undo}
        />
        <ToolbarButton
          icon={<Redo2 size={13} />}
          label="Redo"
          disabled={future.length === 0}
          onClick={redo}
        />
        <Divider />
        <ToolbarToggle
          icon={<Eye size={13} />}
          label="Bleed"
          active={showBleed}
          onClick={() => toggle('showBleed')}
        />
        <ToolbarToggle
          icon={<Square size={13} />}
          label="Safe zone"
          active={showSafeZone}
          onClick={() => toggle('showSafeZone')}
        />
        <ToolbarToggle
          icon={<Grid3x3 size={13} />}
          label="Grid"
          active={showGrid}
          onClick={() => toggle('showGrid')}
        />
        <Divider />
        <ToolbarButton
          icon={<ZoomOut size={13} />}
          label="Zoom out"
          onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
        />
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="h-7 min-w-[48px] rounded px-1.5 text-[10.5px] text-[var(--color-text-tertiary)] tabular-nums transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ToolbarButton
          icon={<ZoomIn size={13} />}
          label="Zoom in"
          onClick={() => setZoom(Math.min(3, zoom + 0.1))}
        />
        <ToolbarButton
          icon={<Maximize size={13} />}
          label="Fit"
          onClick={() => {
            // The canvas auto-fits when zoom is reset along with pan.
            setZoom(0); // sentinel: stage will re-fit when size effect runs
            setTimeout(() => setZoom(1), 0);
            setPan({ x: 0, y: 0 });
          }}
        />
        <Divider />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded bg-[var(--color-accent)] px-2.5 py-1 text-[11px] font-medium text-black transition-opacity hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          <Save size={12} strokeWidth={2.25} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
    >
      {icon}
    </button>
  );
}

function ToolbarToggle({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded transition-colors ${
        active
          ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
          : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-4 w-px bg-[var(--color-border-default)]" />;
}

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 5_000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}
