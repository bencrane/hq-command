import { DataQueryProvider } from '@/components/data/query-provider';

export default function AudienceBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataQueryProvider>
      <div className="flex h-screen flex-col overflow-hidden">{children}</div>
    </DataQueryProvider>
  );
}
