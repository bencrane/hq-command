/**
 * Server-safe source metadata. No 'use client', no React component imports.
 *
 * Server components (page.tsx redirects, layout.tsx) import from here so they
 * don't pull the client-only source descriptors (which contain React drawer +
 * panel components) across the server/client boundary.
 *
 * The full DataSourceDef lives in `./sources/{fmcsa,usaspending,sam}.ts` and is
 * only consumed by client components.
 */

export const FMCSA_META = {
  id: 'fmcsa' as const,
  label: 'FMCSA',
  pathSegment: 'fmcsa',
  defaultSlug: 'audiences/new-entrants-90d',
};

export const USASPENDING_META = {
  id: 'usaspending' as const,
  label: 'USAspending',
  pathSegment: 'usaspending',
  defaultSlug: 'audiences/recent-winners',
};

export const SAM_META = {
  id: 'sam' as const,
  label: 'SAM.gov',
  pathSegment: 'sam',
  defaultSlug: 'entities/search',
};
