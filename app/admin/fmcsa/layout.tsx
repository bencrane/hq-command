import { DataSourceLayout } from '@/components/data/data-source-layout';

export default function FmcsaLayout({ children }: { children: React.ReactNode }) {
  return <DataSourceLayout sourceId="fmcsa">{children}</DataSourceLayout>;
}
