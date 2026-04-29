'use client';

import { Group, Line, Rect } from 'react-konva';
import type { LayoutComponentProps } from './types';
import { CanvasElement } from '../element';
import { SCREEN_PPI } from '@/lib/dmaas/specs';

const px = (inches: number) => inches * SCREEN_PPI;

export function HeadlineProofLayout({
  spec,
  config,
  brand,
  selectedElementId,
  onSelectElement,
  onBeginEdit,
  onCommitOverride,
}: LayoutComponentProps) {
  const trimW = px(spec.width);
  const trimH = px(spec.height);
  const safe = px(spec.safeMargin);
  const split = trimW * 0.62;
  const proof = config.proofPoints ?? [];

  return (
    <Group>
      <Rect x={0} y={0} width={trimW} height={trimH} fill={brand.palette.background} />
      <Rect x={0} y={0} width={px(0.04)} height={trimH} fill={brand.palette.accent} />

      <CanvasElement
        id="headline"
        x={safe + 6}
        y={safe + 4}
        width={split - safe - 12}
        height={Math.round(trimH * 0.32)}
        text={config.headline || 'Your headline'}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 42) / 800)}
        fontStyle="700"
        letterSpacing={-0.3}
        lineHeight={1.08}
        fill={brand.palette.primary}
        bounds={{ x: safe, y: safe, w: split - safe, h: trimH * 0.4 }}
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
          x={safe + 6}
          y={safe + 6 + Math.round(trimH * 0.32)}
          width={split - safe - 12}
          height={Math.round(trimH * 0.12)}
          text={config.subhead}
          fontFamily={brand.fontFamily ?? 'Inter'}
          fontSize={Math.round((trimW * 16) / 800)}
          fontStyle="normal"
          lineHeight={1.3}
          fill={brand.palette.secondary}
          bounds={{ x: safe, y: safe, w: split - safe, h: trimH }}
          selected={selectedElementId === 'subhead'}
          draggable
          override={config.overrides?.subhead}
          onSelect={() => onSelectElement('subhead')}
          onBeginEdit={(r) => onBeginEdit('subhead', r)}
          onCommitOverride={(p) => onCommitOverride('subhead', p)}
        />
      )}

      {/* Proof points laddered underneath */}
      {proof.slice(0, 3).map((point, i) => {
        const baseY = safe + Math.round(trimH * 0.5) + i * Math.round(trimH * 0.11);
        const id = `proof-${i}`;
        return (
          <Group key={id}>
            <Line
              points={[safe + 6, baseY + 14, safe + 22, baseY + 14]}
              stroke={brand.palette.accent}
              strokeWidth={2}
              listening={false}
            />
            <CanvasElement
              id={id}
              x={safe + 32}
              y={baseY}
              width={split - safe - 36}
              height={Math.round(trimH * 0.1)}
              text={point}
              fontFamily={brand.fontFamily ?? 'Inter'}
              fontSize={Math.round((trimW * 13) / 800)}
              fontStyle="500"
              lineHeight={1.3}
              fill={brand.palette.text}
              bounds={{ x: safe, y: safe, w: split - safe, h: trimH }}
              selected={selectedElementId === id}
              draggable
              override={config.overrides?.[id]}
              onSelect={() => onSelectElement(id)}
              onBeginEdit={(r) => onBeginEdit(id, r)}
              onCommitOverride={(p) => onCommitOverride(id, p)}
            />
          </Group>
        );
      })}

      {/* Right-aligned phone block, above the address area */}
      <Rect
        x={split + 4}
        y={safe + 6}
        width={trimW - split - safe - 4}
        height={Math.round(trimH * 0.25)}
        fill={brand.palette.primary}
        cornerRadius={3}
      />
      <CanvasElement
        id="phone-label"
        x={split + 16}
        y={safe + 14}
        width={trimW - split - safe - 28}
        height={14}
        text="CALL DIRECT"
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 9) / 800)}
        fontStyle="600"
        letterSpacing={1.6}
        fill={hexWithAlpha(brand.palette.background, 0.7)}
        bounds={{ x: split, y: safe, w: trimW - split, h: trimH * 0.3 }}
        selected={selectedElementId === 'phone-label'}
        draggable={false}
        override={config.overrides?.['phone-label']}
        onSelect={() => onSelectElement('phone-label')}
        onBeginEdit={(r) => onBeginEdit('phone-label', r)}
        onCommitOverride={(p) => onCommitOverride('phone-label', p)}
      />
      <CanvasElement
        id="phone"
        x={split + 16}
        y={safe + 30}
        width={trimW - split - safe - 28}
        height={Math.round(trimH * 0.16)}
        text={config.phone}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 22) / 800)}
        fontStyle="700"
        fill={brand.palette.background}
        bounds={{ x: split, y: safe, w: trimW - split, h: trimH * 0.3 }}
        selected={selectedElementId === 'phone'}
        draggable={false}
        override={config.overrides?.phone}
        onSelect={() => onSelectElement('phone')}
        onBeginEdit={(r) => onBeginEdit('phone', r)}
        onCommitOverride={(p) => onCommitOverride('phone', p)}
      />

      {/* CTA pill, lower left */}
      <CanvasElement
        id="cta"
        x={safe + 6}
        y={trimH - safe - 28}
        width={split - safe - 12}
        height={28}
        text={`${config.cta} →`}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 16) / 800)}
        fontStyle="600"
        fill={brand.palette.accent}
        bounds={{
          x: safe,
          y: trimH - safe - 60,
          w: split - safe,
          h: 60,
        }}
        selected={selectedElementId === 'cta'}
        draggable
        override={config.overrides?.cta}
        onSelect={() => onSelectElement('cta')}
        onBeginEdit={(r) => onBeginEdit('cta', r)}
        onCommitOverride={(p) => onCommitOverride('cta', p)}
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
