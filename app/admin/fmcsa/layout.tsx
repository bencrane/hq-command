import { DataSourceLayout } from '@/components/data/data-source-layout';
import { fmcsaSource } from '@/lib/data-sources/sources/fmcsa';

export default function FmcsaLayout({ children }: { children: React.ReactNode }) {
  return <DataSourceLayout source={fmcsaSource}>{children}</DataSourceLayout>;
}
