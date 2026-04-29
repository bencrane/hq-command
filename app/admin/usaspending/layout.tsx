import { DataSourceLayout } from '@/components/data/data-source-layout';

export default function UsaspendingLayout({ children }: { children: React.ReactNode }) {
  return <DataSourceLayout sourceId="usaspending">{children}</DataSourceLayout>;
}
