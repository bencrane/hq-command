'use client';

import type { LayoutComponentProps } from './types';
import type { LayoutConfig } from '@/lib/dmaas/types';
import { HeroHeadlineLayout } from './hero-headline';
import { HeadlineProofLayout } from './headline-proof';
import { OfferCentricLayout } from './offer-centric';

const REGISTRY: Record<LayoutConfig['layoutId'], (props: LayoutComponentProps) => React.ReactNode> = {
  'hero-headline': HeroHeadlineLayout,
  'headline-proof': HeadlineProofLayout,
  'offer-centric': OfferCentricLayout,
};

export function LayoutRenderer(props: LayoutComponentProps) {
  const Layout = REGISTRY[props.config.layoutId];
  if (!Layout) return null;
  return <Layout {...props} />;
}

export type { LayoutComponentProps };
