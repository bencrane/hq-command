'use client';

import { Group, Rect } from 'react-konva';
import type { LayoutComponentProps } from './types';
import { CanvasElement } from '../element';
import { SCREEN_PPI } from '@/lib/dmaas/specs';

const px = (inches: number) => inches * SCREEN_PPI;

export function HeroHeadlineLayout({
  spec,
  config,
  brand,
  selectedElementId,
  onSelectElement,
  onBeginEdit,
  onCommitOverride,
}: LayoutComponentProps) {
  // Left ⅔ is a saturated brand block; right ⅓ is the address/postage column.
  const trimW = px(spec.width);
  const trimH = px(spec.height);
  const safe = px(spec.safeMargin);
  const split = trimW * 0.62;

  // Editable zone for headline-block items: keeps them out of the address
  // column and inside the safe margin.
  const headlineBounds = {
    x: safe,
    y: safe,
    w: split - safe * 1.5,
    h: trimH - safe * 2,
  };

  const ctaBounds = {
    x: safe,
    y: trimH - safe - 60,
    w: split - safe * 1.5,
    h: 60,
  };

  return (
    <Group>
      {/* Saturated brand block */}
      <Rect x={0} y={0} width={split} height={trimH} fill={brand.palette.primary} />
      {/* Diagonal accent ribbon */}
      <Rect
        x={split - 80}
        y={trimH - 90}
        width={80}
        height={90}
        fill={brand.palette.accent}
        opacity={0.92}
        rotation={0}
      />

      <CanvasElement
        id="headline"
        x={px(0.5)}
        y={px(0.6)}
        width={split - safe * 2 - 8}
        height={px(spec.height * 0.45)}
        text={config.headline || 'Your headline goes here'}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 56) / 800)}
        fontStyle="700"
        letterSpacing={-0.4}
        lineHeight={1.05}
        fill={brand.palette.background}
        bounds={headlineBounds}
        selected={selectedElementId === 'headline'}
        draggable
        override={config.overrides?.headline}
        onSelect={() => onSelectElement('headline')}
        onBeginEdit={(r) => onBeginEdit('headline', r)}
        onCommitOverride={(p) => onCommitOverride('headline', p)}
      />

      {config.subhead && (
        <CanvasElement
          id="subhead"
          x={px(0.5)}
          y={px(spec.height * 0.55)}
          width={split - safe * 2 - 8}
          height={px(spec.height * 0.18)}
          text={config.subhead}
          fontFamily={brand.fontFamily ?? 'Inter'}
          fontSize={Math.round((trimW * 16) / 800)}
          fontStyle="normal"
          lineHeight={1.3}
          fill={hexWithAlpha(brand.palette.background, 0.8)}
          bounds={headlineBounds}
          selected={selectedElementId === 'subhead'}
          draggable
          override={config.overrides?.subhead}
          onSelect={() => onSelectElement('subhead')}
          onBeginEdit={(r) => onBeginEdit('subhead', r)}
          onCommitOverride={(p) => onCommitOverride('subhead', p)}
        />
      )}

      <CanvasElement
        id="cta"
        x={px(0.5)}
        y={trimH - safe - 36}
        width={split - safe * 2 - 8}
        height={36}
        text={`${config.cta} →`}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 18) / 800)}
        fontStyle="600"
        fill={brand.palette.accent}
        bounds={ctaBounds}
        selected={selectedElementId === 'cta'}
        draggable
        override={config.overrides?.cta}
        onSelect={() => onSelectElement('cta')}
        onBeginEdit={(r) => onBeginEdit('cta', r)}
        onCommitOverride={(p) => onCommitOverride('cta', p)}
      />

      <CanvasElement
        id="phone"
        x={split + safe * 0.4}
        y={trimH - safe - 28}
        width={trimW - split - safe * 1.4}
        height={28}
        text={config.phone}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 14) / 800)}
        fontStyle="600"
        fill="#0a0a0a"
        align="right"
        bounds={{
          x: split,
          y: trimH - safe - 60,
          w: trimW - split - safe,
          h: 60,
        }}
        selected={selectedElementId === 'phone'}
        draggable={false}
        override={config.overrides?.phone}
        onSelect={() => onSelectElement('phone')}
        onBeginEdit={(r) => onBeginEdit('phone', r)}
        onCommitOverride={(p) => onCommitOverride('phone', p)}
      />
    </Group>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
