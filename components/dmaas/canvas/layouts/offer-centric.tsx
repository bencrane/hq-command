'use client';

import { Group, Rect } from 'react-konva';
import type { LayoutComponentProps } from './types';
import { CanvasElement } from '../element';
import { SCREEN_PPI } from '@/lib/dmaas/specs';

const px = (inches: number) => inches * SCREEN_PPI;

export function OfferCentricLayout({
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

  // Offer card occupies the visual centre of the design column.
  const offerCardW = split - safe * 2 - 4;
  const offerCardH = Math.round(trimH * 0.42);
  const offerCardX = safe + 6;
  const offerCardY = safe + Math.round(trimH * 0.18);

  return (
    <Group>
      <Rect x={0} y={0} width={trimW} height={trimH} fill={brand.palette.background} />

      <CanvasElement
        id="headline"
        x={safe + 6}
        y={safe + 4}
        width={split - safe - 12}
        height={Math.round(trimH * 0.16)}
        text={config.headline || 'Your headline'}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 24) / 800)}
        fontStyle="700"
        letterSpacing={-0.2}
        lineHeight={1.1}
        fill={brand.palette.primary}
        bounds={{ x: safe, y: safe, w: split - safe, h: trimH * 0.2 }}
        selected={selectedElementId === 'headline'}
        draggable
        override={config.overrides?.headline}
        onSelect={() => onSelectElement('headline')}
        onBeginEdit={(r) => onBeginEdit('headline', r)}
        onCommitOverride={(p) => onCommitOverride('headline', p)}
      />

      {/* Offer card */}
      <Rect
        x={offerCardX}
        y={offerCardY}
        width={offerCardW}
        height={offerCardH}
        fill={brand.palette.primary}
        cornerRadius={6}
      />
      <Rect
        x={offerCardX}
        y={offerCardY}
        width={offerCardW}
        height={Math.round(offerCardH * 0.22)}
        fill={brand.palette.accent}
        cornerRadius={[6, 6, 0, 0]}
      />
      <CanvasElement
        id="offer-label"
        x={offerCardX + 16}
        y={offerCardY + 8}
        width={offerCardW - 32}
        height={Math.round(offerCardH * 0.18)}
        text={config.offer?.label ?? 'LIMITED-TIME OFFER'}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 11) / 800)}
        fontStyle="700"
        letterSpacing={2.2}
        fill={brand.palette.background}
        bounds={{ x: offerCardX, y: offerCardY, w: offerCardW, h: offerCardH }}
        selected={selectedElementId === 'offer-label'}
        draggable={false}
        override={config.overrides?.['offer-label']}
        onSelect={() => onSelectElement('offer-label')}
        onBeginEdit={(r) => onBeginEdit('offer-label', r)}
        onCommitOverride={(p) => onCommitOverride('offer-label', p)}
      />
      <CanvasElement
        id="offer-value"
        x={offerCardX + 16}
        y={offerCardY + Math.round(offerCardH * 0.28)}
        width={offerCardW - 32}
        height={Math.round(offerCardH * 0.6)}
        text={config.offer?.value ?? '20% OFF'}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 78) / 800)}
        fontStyle="700"
        letterSpacing={-1.5}
        lineHeight={1}
        fill={brand.palette.background}
        align="center"
        verticalAlign="middle"
        bounds={{ x: offerCardX, y: offerCardY, w: offerCardW, h: offerCardH }}
        selected={selectedElementId === 'offer-value'}
        draggable={false}
        override={config.overrides?.['offer-value']}
        onSelect={() => onSelectElement('offer-value')}
        onBeginEdit={(r) => onBeginEdit('offer-value', r)}
        onCommitOverride={(p) => onCommitOverride('offer-value', p)}
      />

      {/* Subhead/urgency strip below offer */}
      {config.subhead && (
        <CanvasElement
          id="subhead"
          x={safe + 6}
          y={offerCardY + offerCardH + 10}
          width={split - safe - 12}
          height={Math.round(trimH * 0.1)}
          text={config.subhead}
          fontFamily={brand.fontFamily ?? 'Inter'}
          fontSize={Math.round((trimW * 13) / 800)}
          fontStyle="500"
          lineHeight={1.3}
          fill={brand.palette.secondary}
          bounds={{ x: safe, y: 0, w: split - safe, h: trimH }}
          selected={selectedElementId === 'subhead'}
          draggable
          override={config.overrides?.subhead}
          onSelect={() => onSelectElement('subhead')}
          onBeginEdit={(r) => onBeginEdit('subhead', r)}
          onCommitOverride={(p) => onCommitOverride('subhead', p)}
        />
      )}

      {/* CTA + phone hammered side-by-side */}
      <CanvasElement
        id="cta"
        x={safe + 6}
        y={trimH - safe - 30}
        width={Math.round((split - safe) * 0.55)}
        height={30}
        text={`${config.cta} →`}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 17) / 800)}
        fontStyle="700"
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
      <CanvasElement
        id="phone"
        x={safe + 6 + Math.round((split - safe) * 0.6)}
        y={trimH - safe - 30}
        width={split - safe - 12 - Math.round((split - safe) * 0.6)}
        height={30}
        text={config.phone}
        fontFamily={brand.fontFamily ?? 'Inter'}
        fontSize={Math.round((trimW * 17) / 800)}
        fontStyle="700"
        fill={brand.palette.primary}
        align="right"
        bounds={{
          x: safe,
          y: trimH - safe - 60,
          w: split - safe,
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
