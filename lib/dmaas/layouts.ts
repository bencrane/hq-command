import type { LayoutConfig } from './types';

export interface LayoutDescriptor {
  id: LayoutConfig['layoutId'];
  name: string;
  description: string;
  /** Best for short, high-impact value props. */
  goodFor: string[];
  /** Compatible spec categories. */
  compatibleSpecs: ReadonlyArray<'postcard'>;
}

export const LAYOUTS: ReadonlyArray<LayoutDescriptor> = [
  {
    id: 'hero-headline',
    name: 'Hero Headline',
    description:
      'Single dominant headline anchored on a saturated brand block. Phone & CTA stacked at the foot. Best when the offer is the brand.',
    goodFor: ['Brand awareness', 'Single value prop', 'Recall-driven recipients'],
    compatibleSpecs: ['postcard'],
  },
  {
    id: 'headline-proof',
    name: 'Headline + Proof',
    description:
      'Headline pinned top-left over neutral background, three proof points laddered beneath. Phone block right-aligned. Best when credibility carries the message.',
    goodFor: ['Service businesses', 'Testimonial-style claims', 'Trust building'],
    compatibleSpecs: ['postcard'],
  },
  {
    id: 'offer-centric',
    name: 'Offer-Centric',
    description:
      'Big-number offer card in the dominant zone, headline above, urgency strip below. Phone hammered next to the CTA. Best when the offer is the message.',
    goodFor: ['Discount campaigns', 'Limited-time offers', 'Direct response'],
    compatibleSpecs: ['postcard'],
  },
];

export function getLayout(id: LayoutConfig['layoutId']): LayoutDescriptor {
  const found = LAYOUTS.find((l) => l.id === id);
  if (!found) throw new Error(`Unknown layout: ${id}`);
  return found;
}
