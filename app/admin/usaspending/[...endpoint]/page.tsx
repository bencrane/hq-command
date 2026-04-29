'use client';

import { useParams } from 'next/navigation';
import { DataSourceShell } from '@/components/data/data-source-shell';
import { usaspendingSource } from '@/lib/data-sources/sources/usaspending';

export default function UsaspendingEndpointPage() {
  const params = useParams<{ endpoint: string[] }>();
  const slug = (params.endpoint ?? []).join('/');
  return <DataSourceShell source={usaspendingSource} slug={slug} />;
}
