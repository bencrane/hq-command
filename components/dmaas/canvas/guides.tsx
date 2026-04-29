'use client';

import { Group, Line, Rect, Text } from 'react-konva';
import type { PostcardSpec } from '@/lib/dmaas/specs';
import { SCREEN_PPI } from '@/lib/dmaas/specs';

const RED = '#ef4444';
const BLUE = '#38bdf8';
const GREY = '#94a3b8';
const SHADE = 'rgba(15, 23, 42, 0.04)';
const BARCODE_SHADE = 'rgba(15, 23, 42, 0.02)';

const px = (inches: number) => inches * SCREEN_PPI;

export function BleedGuide({ spec }: { spec: PostcardSpec }) {
  return (
    <Rect
      x={-px(spec.bleed)}
      y={-px(spec.bleed)}
      width={px(spec.width + spec.bleed * 2)}
      height={px(spec.height + spec.bleed * 2)}
      stroke={RED}
      strokeWidth={1}
      dash={[6, 4]}
      listening={false}
    />
  );
}

export function TrimLine({ spec }: { spec: PostcardSpec }) {
  return (
    <Rect
      x={0}
      y={0}
      width={px(spec.width)}
      height={px(spec.height)}
      stroke="#0a0a0a"
      strokeWidth={1}
      listening={false}
    />
  );
}

export function SafeZoneGuide({ spec }: { spec: PostcardSpec }) {
  return (
    <Rect
      x={px(spec.safeMargin)}
      y={px(spec.safeMargin)}
      width={px(spec.width - spec.safeMargin * 2)}
      height={px(spec.height - spec.safeMargin * 2)}
      stroke={BLUE}
      strokeWidth={1}
      dash={[4, 4]}
      listening={false}
    />
  );
}

export function GridOverlay({ spec, gridIn = 0.25 }: { spec: PostcardSpec; gridIn?: number }) {
  const w = px(spec.width);
  const h = px(spec.height);
  const step = px(gridIn);
  const lines: React.ReactNode[] = [];
  for (let x = step; x < w; x += step) {
    lines.push(
      <Line
        key={`v${x}`}
        points={[x, 0, x, h]}
        stroke={GREY}
        strokeWidth={0.5}
        opacity={0.18}
        listening={false}
      />,
    );
  }
  for (let y = step; y < h; y += step) {
    lines.push(
      <Line
        key={`h${y}`}
        points={[0, y, w, y]}
        stroke={GREY}
        strokeWidth={0.5}
        opacity={0.18}
        listening={false}
      />,
    );
  }
  return <Group listening={false}>{lines}</Group>;
}

export function AddressBlockGuide({ spec }: { spec: PostcardSpec }) {
  const z = spec.back.addressBlock;
  return (
    <Group listening={false}>
      <Rect x={px(z.x)} y={px(z.y)} width={px(z.w)} height={px(z.h)} fill={SHADE} />
      <Rect
        x={px(z.x)}
        y={px(z.y)}
        width={px(z.w)}
        height={px(z.h)}
        stroke={GREY}
        strokeWidth={0.75}
        dash={[3, 3]}
      />
      <Text
        x={px(z.x) + 8}
        y={px(z.y) + 6}
        text="ADDRESS BLOCK"
        fontFamily="Inter"
        fontSize={9}
        letterSpacing={1.2}
        fill="#64748b"
      />
    </Group>
  );
}

export function PostageGuide({ spec }: { spec: PostcardSpec }) {
  const z = spec.back.postageArea;
  return (
    <Group listening={false}>
      <Rect x={px(z.x)} y={px(z.y)} width={px(z.w)} height={px(z.h)} fill={SHADE} />
      <Rect
        x={px(z.x)}
        y={px(z.y)}
        width={px(z.w)}
        height={px(z.h)}
        stroke={GREY}
        strokeWidth={0.75}
        dash={[3, 3]}
      />
      <Text
        x={px(z.x) + 6}
        y={px(z.y) + 6}
        text="POSTAGE"
        fontFamily="Inter"
        fontSize={9}
        letterSpacing={1.2}
        fill="#64748b"
      />
    </Group>
  );
}

export function BarcodeClearance({ spec }: { spec: PostcardSpec }) {
  const z = spec.back.barcodeClearance;
  return (
    <Rect
      x={px(z.x)}
      y={px(z.y)}
      width={px(z.w)}
      height={px(z.h)}
      fill={BARCODE_SHADE}
      listening={false}
    />
  );
}
