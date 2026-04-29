'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import type Konva from 'konva';
import type { PostcardSpec } from '@/lib/dmaas/specs';
import { SCREEN_PPI } from '@/lib/dmaas/specs';
import type { BrandPack, LayoutConfig } from '@/lib/dmaas/types';
import { useDesignerStore } from '@/lib/dmaas/store';
import {
  AddressBlockGuide,
  BarcodeClearance,
  BleedGuide,
  GridOverlay,
  PostageGuide,
  SafeZoneGuide,
  TrimLine,
} from './guides';
import { LayoutRenderer } from './layouts';

interface InlineEdit {
  elementId: string;
  rect: { x: number; y: number; w: number; h: number };
  initial: string;
}

interface Props {
  spec: PostcardSpec;
  config: LayoutConfig;
  brand: BrandPack;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;

export function CanvasStage({ spec, config, brand, containerRef }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [edit, setEdit] = useState<InlineEdit | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const zoom = useDesignerStore((s) => s.zoom);
  const pan = useDesignerStore((s) => s.pan);
  const showGrid = useDesignerStore((s) => s.showGrid);
  const showSafeZone = useDesignerStore((s) => s.showSafeZone);
  const showBleed = useDesignerStore((s) => s.showBleed);
  const selectedElementId = useDesignerStore((s) => s.selectedElementId);
  const setZoom = useDesignerStore((s) => s.setZoom);
  const setPan = useDesignerStore((s) => s.setPan);
  const selectElement = useDesignerStore((s) => s.selectElement);
  const setOverride = useDesignerStore((s) => s.setOverride);

  // Track container size for autofit math.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setSize({ w: width, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  // Centre the postcard in the stage, then apply user pan/zoom on top.
  const trimW = spec.width * SCREEN_PPI;
  const trimH = spec.height * SCREEN_PPI;
  const baseX = useMemo(() => Math.max(0, (size.w - trimW * zoom) / 2), [size.w, trimW, zoom]);
  const baseY = useMemo(() => Math.max(0, (size.h - trimH * zoom) / 2), [size.h, trimH, zoom]);

  // Auto-fit on first paint and when spec changes.
  useEffect(() => {
    if (!size.w || !size.h) return;
    const padding = 64;
    const scaleX = (size.w - padding * 2) / trimW;
    const scaleY = (size.h - padding * 2) / trimH;
    const fit = Math.min(scaleX, scaleY, 1.5);
    setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, fit)));
    setPan({ x: 0, y: 0 });
  }, [size.w, size.h, trimW, trimH, setZoom, setPan]);

  // Cmd+scroll zoom centred on the cursor.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handler = (e: WheelEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      const oldScale = zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const direction = e.deltaY > 0 ? -1 : 1;
      const factor = 1.07;
      const next = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, direction > 0 ? oldScale * factor : oldScale / factor),
      );
      const stageX = baseX + pan.x;
      const stageY = baseY + pan.y;
      const mouseLocal = {
        x: (pointer.x - stageX) / oldScale,
        y: (pointer.y - stageY) / oldScale,
      };
      const newStageX = pointer.x - mouseLocal.x * next;
      const newStageY = pointer.y - mouseLocal.y * next;
      setZoom(next);
      setPan({ x: newStageX - baseX, y: newStageY - baseY });
    };
    const container = stage.container();
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, [zoom, pan, baseX, baseY, setZoom, setPan]);

  // Spacebar pan modifier.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTextEditing(e.target)) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Click on empty stage → deselect.
      if (e.target === e.target.getStage()) {
        selectElement(null);
      }
    },
    [selectElement],
  );

  const handleBeginEdit = useCallback(
    (id: string, rect: { x: number; y: number; w: number; h: number }) => {
      const initial = config.overrides?.[id]?.text ?? lookupDefaultText(id, config) ?? '';
      setEdit({ elementId: id, rect, initial });
    },
    [config],
  );

  const handleCommitOverride = useCallback(
    (id: string, patch: Partial<NonNullable<LayoutConfig['overrides']>[string]>) => {
      setOverride(id, patch);
    },
    [setOverride],
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        x={baseX + pan.x}
        y={baseY + pan.y}
        scaleX={zoom}
        scaleY={zoom}
        draggable={spaceHeld}
        onMouseDown={handleStageMouseDown}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            const next = e.target.position();
            setPan({ x: next.x - baseX, y: next.y - baseY });
          }
        }}
        style={{
          cursor: spaceHeld ? 'grab' : 'default',
        }}
      >
        <Layer>
          {/* Card surface — drop shadow rendered in CSS via the surrounding div */}
          <LayoutRenderer
            spec={spec}
            config={config}
            brand={brand}
            selectedElementId={edit ? null : selectedElementId}
            onSelectElement={selectElement}
            onBeginEdit={handleBeginEdit}
            onCommitOverride={handleCommitOverride}
          />
          {showBleed && <BleedGuide spec={spec} />}
          <TrimLine spec={spec} />
          {showSafeZone && <SafeZoneGuide spec={spec} />}
          {showGrid && <GridOverlay spec={spec} />}
          <BarcodeClearance spec={spec} />
          <AddressBlockGuide spec={spec} />
          <PostageGuide spec={spec} />
        </Layer>
      </Stage>

      {/* Postcard drop-shadow underlay — rendered as DOM beneath the canvas
          for crisp shadow without hammering Konva's shadow renderer. */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: baseX + pan.x,
          top: baseY + pan.y,
          width: trimW * zoom,
          height: trimH * zoom,
          boxShadow: '0 24px 60px -12px rgba(0,0,0,0.55), 0 8px 16px -4px rgba(0,0,0,0.4)',
          borderRadius: 2,
          background: 'transparent',
          zIndex: 0,
        }}
      />

      {edit && (
        <InlineEditor
          edit={edit}
          fontSize={resolveFontSize(edit.elementId, config) * zoom}
          onCancel={() => setEdit(null)}
          onCommit={(text) => {
            setOverride(edit.elementId, { text });
            setEdit(null);
          }}
        />
      )}
    </div>
  );
}

function isTextEditing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

function lookupDefaultText(id: string, config: LayoutConfig): string {
  switch (id) {
    case 'headline':
      return config.headline;
    case 'subhead':
      return config.subhead ?? '';
    case 'cta':
      return config.cta;
    case 'phone':
      return config.phone;
    case 'offer-label':
      return config.offer?.label ?? '';
    case 'offer-value':
      return config.offer?.value ?? '';
    default:
      if (id.startsWith('proof-')) {
        const i = Number(id.split('-')[1] ?? -1);
        return config.proofPoints?.[i] ?? '';
      }
      return '';
  }
}

function resolveFontSize(id: string, _config: LayoutConfig): number {
  // Used to size the inline editor; layouts choose their own actual font sizes.
  // 18 is a sensible default; the editor inherits via the rect dimensions anyway.
  void _config;
  void id;
  return 18;
}

interface InlineEditorProps {
  edit: InlineEdit;
  fontSize: number;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

function InlineEditor({ edit, fontSize, onCommit, onCancel }: InlineEditorProps) {
  const [value, setValue] = useState(edit.initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.focus();
      ref.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onCommit(value);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
      style={{
        position: 'absolute',
        left: edit.rect.x,
        top: edit.rect.y,
        width: edit.rect.w,
        height: edit.rect.h,
        fontSize,
        fontFamily: 'Inter, ui-sans-serif, system-ui',
        fontWeight: 600,
        background: 'rgba(255,255,255,0.95)',
        color: '#0a0a0a',
        border: '2px solid #f97316',
        borderRadius: 2,
        padding: '4px 6px',
        margin: 0,
        outline: 'none',
        resize: 'none',
        lineHeight: 1.15,
        zIndex: 50,
      }}
    />
  );
}
