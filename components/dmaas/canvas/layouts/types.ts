import type { PostcardSpec } from '@/lib/dmaas/specs';
import type { BrandPack, LayoutConfig } from '@/lib/dmaas/types';

export interface LayoutComponentProps {
  spec: PostcardSpec;
  config: LayoutConfig;
  brand: BrandPack;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onBeginEdit: (id: string, rect: { x: number; y: number; w: number; h: number }) => void;
  onCommitOverride: (
    id: string,
    patch: Partial<NonNullable<LayoutConfig['overrides']>[string]>,
  ) => void;
}
