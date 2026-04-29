import { DataSourceLayout } from '@/components/data/data-source-layout';

export default function SamLayout({ children }: { children: React.ReactNode }) {
  return <DataSourceLayout sourceId="sam">{children}</DataSourceLayout>;
}
