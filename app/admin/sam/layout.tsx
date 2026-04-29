import { DataSourceLayout } from '@/components/data/data-source-layout';
import { samSource } from '@/lib/data-sources/sources/sam';

export default function SamLayout({ children }: { children: React.ReactNode }) {
  return <DataSourceLayout source={samSource}>{children}</DataSourceLayout>;
}
