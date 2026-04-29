'use client';

import { useParams } from 'next/navigation';
import { DataSourceShell } from '@/components/data/data-source-shell';
import { samSource } from '@/lib/data-sources/sources/sam';

export default function SamEndpointPage() {
  const params = useParams<{ endpoint: string[] }>();
  const slug = (params.endpoint ?? []).join('/');
  return <DataSourceShell source={samSource} slug={slug} />;
}
