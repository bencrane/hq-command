'use client';

import { useMemo, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { LayoutConfig } from '@/lib/dmaas/types';

export interface CanvasElementProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle?: 'normal' | 'bold' | '500' | '600' | '700';
  letterSpacing?: number;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fill: string;
  /** Bounding box in the spec's pixel space that the element may not leave. */
  bounds: { x: number; y: number; w: number; h: number };
  selected: boolean;
  draggable: boolean;
  override: NonNullable<LayoutConfig['overrides']>[string] | undefined;
  onSelect: () => void;
  onBeginEdit: (rect: { x: number; y: number; w: number; h: number }) => void;
  onCommitOverride: (
    patch: Partial<NonNullable<LayoutConfig['overrides']>[string]>,
  ) => void;
}

const SNAP_GRID = 8;

export function CanvasElement(props: CanvasElementProps) {
  const ref = useRef<Konva.Group>(null);

  const effective = useMemo(() => {
    return {
      x: props.override?.x ?? props.x,
      y: props.override?.y ?? props.y,
      fontSize: props.override?.fontSize ?? props.fontSize,
      fill: props.override?.color ?? props.fill,
      align: props.override?.align ?? props.align ?? 'left',
      text: props.override?.text ?? props.text,
    };
  }, [props]);

  const dragBound = (pos: { x: number; y: number }) => {
    const minX = props.bounds.x;
    const maxX = props.bounds.x + props.bounds.w - props.width;
    const minY = props.bounds.y;
    const maxY = props.bounds.y + props.bounds.h - props.height;
    return {
      x: Math.min(Math.max(pos.x, minX), maxX),
      y: Math.min(Math.max(pos.y, minY), maxY),
    };
  };

  return (
    <Group
      ref={ref}
      x={effective.x}
      y={effective.y}
      draggable={props.draggable}
      dragBoundFunc={dragBound}
      onMouseDown={(e) => {
        e.cancelBubble = true;
        props.onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        props.onSelect();
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        const node = ref.current;
        if (!node) return;
        const stage = node.getStage();
        if (!stage) return;
        const abs = node.getAbsolutePosition();
        const scale = stage.scaleX();
        props.onBeginEdit({
          x: abs.x,
          y: abs.y,
          w: props.width * scale,
          h: props.height * scale,
        });
      }}
      onDragEnd={(e) => {
        const next = e.target.position();
        const snappedX = Math.round(next.x / SNAP_GRID) * SNAP_GRID;
        const snappedY = Math.round(next.y / SNAP_GRID) * SNAP_GRID;
        const bounded = dragBound({ x: snappedX, y: snappedY });
        e.target.position(bounded);
        props.onCommitOverride({ x: bounded.x, y: bounded.y });
      }}
    >
      {props.selected && (
        <Rect
          x={-4}
          y={-4}
          width={props.width + 8}
          height={props.height + 8}
          stroke="#f97316"
          strokeWidth={1.5}
          dash={[4, 4]}
          listening={false}
        />
      )}
      <Text
        x={0}
        y={0}
        width={props.width}
        height={props.height}
        text={effective.text}
        fontFamily={props.fontFamily}
        fontSize={effective.fontSize}
        fontStyle={props.fontStyle ?? 'normal'}
        letterSpacing={props.letterSpacing ?? 0}
        lineHeight={props.lineHeight ?? 1.15}
        align={effective.align}
        verticalAlign={props.verticalAlign ?? 'top'}
        fill={effective.fill}
        wrap="word"
        ellipsis
      />
    </Group>
  );
}
