'use client';

import type { DataSourceDef } from '@/lib/data-sources/types';
import { DataQueryProvider } from './query-provider';
import { DataSourceSidebar } from './data-source-sidebar';

export function DataSourceLayout({
  source,
  children,
}: {
  source: DataSourceDef;
  children: React.ReactNode;
}) {
  return (
    <DataQueryProvider>
      <div className="flex h-screen overflow-hidden">
        <DataSourceSidebar source={source} />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </DataQueryProvider>
  );
}
