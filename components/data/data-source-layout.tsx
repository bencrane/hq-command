'use client';

import { fmcsaSource } from '@/lib/data-sources/sources/fmcsa';
import { samSource } from '@/lib/data-sources/sources/sam';
import { usaspendingSource } from '@/lib/data-sources/sources/usaspending';
import type { DataSourceId } from '@/lib/data-sources/types';
import { DataQueryProvider } from './query-provider';
import { DataSourceSidebar } from './data-source-sidebar';

const SOURCES_BY_ID = {
  fmcsa: fmcsaSource,
  usaspending: usaspendingSource,
  sam: samSource,
} as const;

export function DataSourceLayout({
  sourceId,
  children,
}: {
  sourceId: DataSourceId;
  children: React.ReactNode;
}) {
  const source = SOURCES_BY_ID[sourceId];
  return (
    <DataQueryProvider>
      <div className="flex h-screen overflow-hidden">
        <DataSourceSidebar source={source} />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </DataQueryProvider>
  );
}
