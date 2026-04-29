import { DataSourceLayout } from '@/components/data/data-source-layout';
import { usaspendingSource } from '@/lib/data-sources/sources/usaspending';

export default function UsaspendingLayout({ children }: { children: React.ReactNode }) {
  return <DataSourceLayout source={usaspendingSource}>{children}</DataSourceLayout>;
}
