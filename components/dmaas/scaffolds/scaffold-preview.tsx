'use client';

import { useMemo } from 'react';
import type { Scaffold, ScaffoldPreview } from '@/lib/dmaas/scaffolds';

interface Props {
  scaffold: Scaffold;
  preview: ScaffoldPreview;
  /** Pixel width of the rendered output. Aspect ratio is preserved from canvas. */
  width: number;
  /** Whether to render USPS zone overlays + labels. */
  showOverlays?: boolean;
  /** Whether to label slots faintly (off by default — placeholder text is the label). */
  showSlotOutlines?: boolean;
}

const PLACEHOLDER_BG = '#0f172a';
const SAFE_STROKE = '#38bdf8';
const ZONE_STROKE = '#f97316';
const FOLD_STROKE = '#facc15';
const TEXT_DEFAULT = '#f8fafc';

const ZONE_LABELS: Record<string, string> = {
  back_address_block: 'ADDRESS BLOCK',
  back_postage_indicia: 'POSTAGE',
  back_usps_barcode_clear: 'IMb CLEAR',
  outside_address_block: 'ADDRESS BLOCK',
  outside_postage_indicia: 'POSTAGE',
  outside_usps_barcode_clear: 'IMb CLEAR',
  outside_top_panel_safe: 'COVER PANEL',
  outside_bottom_panel_safe: 'DESIGN PANEL',
  cover_address_window: 'ADDRESS WINDOW',
  front_safe: 'SAFE',
};

interface SlotRecord {
  text?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
  align?: 'left' | 'center' | 'right';
  background?: { color?: string };
}

interface BackgroundRecord {
  color?: string;
}

function readPlaceholders(content: unknown): {
  background: BackgroundRecord;
  slots: Record<string, SlotRecord>;
} {
  if (!content || typeof content !== 'object') {
    return { background: {}, slots: {} };
  }
  const obj = content as Record<string, unknown>;
  const out: Record<string, SlotRecord> = {};
  let background: BackgroundRecord = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!value || typeof value !== 'object') continue;
    if (key === 'background') {
      background = value as BackgroundRecord;
      continue;
    }
    out[key] = value as SlotRecord;
  }
  return { background, slots: out };
}

function isFoldFormat(format: string): boolean {
  return /self[_-]?mailer/i.test(format);
}

export function ScaffoldPreviewSVG({
  scaffold,
  preview,
  width,
  showOverlays = true,
  showSlotOutlines = false,
}: Props) {
  const { canvas, positions, zones } = preview;
  const { background, slots } = useMemo(
    () => readPlaceholders(scaffold.placeholder_content),
    [scaffold.placeholder_content],
  );

  // Aspect-preserving height.
  const aspect = canvas.h / canvas.w;
  const height = Math.round(width * aspect);

  // Self-mailer bifold renders with a horizontal fold line at y = canvas.h / 2.
  // Detect by format; fall back to no fold if uncertain.
  const foldY = isFoldFormat(scaffold.format) ? canvas.h / 2 : null;

  return (
    <svg
      viewBox={`${canvas.x} ${canvas.y} ${canvas.w} ${canvas.h}`}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }}
      role="img"
      aria-label={`${scaffold.name} preview`}
    >
      {/* Bleed / canvas surface. */}
      <rect
        x={canvas.x}
        y={canvas.y}
        width={canvas.w}
        height={canvas.h}
        fill={background.color ?? PLACEHOLDER_BG}
      />

      {/* Slot text from placeholder_content rendered at resolved positions. */}
      {Object.entries(positions).map(([slot, pos]) => {
        const slotData = slots[slot] ?? {};
        const text = slotData.text ?? '';
        if (!text) {
          return showSlotOutlines ? (
            <SlotOutline key={slot} pos={pos} label={slot} />
          ) : null;
        }
        return (
          <SlotText
            key={slot}
            pos={pos}
            text={text}
            color={slotData.color ?? TEXT_DEFAULT}
            align={slotData.align ?? 'left'}
          />
        );
      })}

      {/* USPS zone overlays. Drawn on top of slot text so the QA reviewer can
          confirm zones don't visually conflict with slot positions. */}
      {showOverlays && (
        <g>
          {Object.entries(zones).map(([name, z]) => {
            const isSafe = name === 'front_safe' || name.endsWith('_safe');
            const stroke = isSafe ? SAFE_STROKE : ZONE_STROKE;
            const dash = isSafe ? '24 16' : '18 12';
            const label = ZONE_LABELS[name] ?? name.replace(/_/g, ' ').toUpperCase();
            return (
              <g key={name}>
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={3}
                  strokeDasharray={dash}
                  vectorEffect="non-scaling-stroke"
                />
                {!isSafe && (
                  <text
                    x={z.x + 16}
                    y={z.y + 36}
                    fill={stroke}
                    fontSize={32}
                    fontFamily="Inter, ui-sans-serif, system-ui"
                    fontWeight={600}
                    letterSpacing={2}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}

          {foldY !== null && (
            <g>
              <line
                x1={canvas.x}
                y1={foldY}
                x2={canvas.x + canvas.w}
                y2={foldY}
                stroke={FOLD_STROKE}
                strokeWidth={2}
                strokeDasharray="40 20"
                vectorEffect="non-scaling-stroke"
                opacity={0.7}
              />
              <text
                x={canvas.x + canvas.w - 16}
                y={foldY - 12}
                textAnchor="end"
                fill={FOLD_STROKE}
                fontSize={28}
                fontFamily="Inter, ui-sans-serif, system-ui"
                fontWeight={600}
                letterSpacing={2}
                opacity={0.85}
              >
                FOLD
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

function SlotOutline({
  pos,
  label,
}: {
  pos: { x: number; y: number; w: number; h: number };
  label: string;
}) {
  return (
    <g>
      <rect
        x={pos.x}
        y={pos.y}
        width={pos.w}
        height={pos.h}
        fill="none"
        stroke="#475569"
        strokeWidth={1.5}
        strokeDasharray="6 6"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={pos.x + 12}
        y={pos.y + 28}
        fill="#94a3b8"
        fontSize={26}
        fontFamily="Inter, ui-sans-serif, system-ui"
        letterSpacing={1.5}
      >
        {label.toUpperCase()}
      </text>
    </g>
  );
}

interface SlotTextProps {
  pos: { x: number; y: number; w: number; h: number };
  text: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

/**
 * Render slot text inside its position rect. We pick a font size that scales
 * with rect height; line wrapping happens inside a foreignObject so HTML can
 * handle wrapping without us computing per-character widths.
 */
function SlotText({ pos, text, color, align }: SlotTextProps) {
  // Heuristic: font-size as a fraction of slot height, capped so very tall
  // slots don't blow up.
  const fontSize = Math.min(pos.h * 0.55, 96, Math.max(28, pos.w / Math.max(text.length / 2, 6)));
  const lineHeight = 1.1;
  return (
    <foreignObject x={pos.x} y={pos.y} width={pos.w} height={pos.h}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          color,
          fontFamily: 'Inter, ui-sans-serif, system-ui',
          fontSize,
          fontWeight: 700,
          lineHeight,
          textAlign: align,
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          wordBreak: 'break-word',
        }}
      >
        {text}
      </div>
    </foreignObject>
  );
}
