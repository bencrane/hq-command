import { FmcsaQueryProvider } from '@/components/fmcsa/query-provider';
import { FmcsaSidebar } from '@/components/fmcsa/sidebar';

export default function FmcsaLayout({ children }: { children: React.ReactNode }) {
  return (
    <FmcsaQueryProvider>
      <div className="flex h-screen overflow-hidden">
        <FmcsaSidebar />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </FmcsaQueryProvider>
  );
}
