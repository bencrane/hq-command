import { AudiencesQueryProvider } from '@/components/audiences/query-provider';

export default function AudiencesLayout({ children }: { children: React.ReactNode }) {
  return <AudiencesQueryProvider>{children}</AudiencesQueryProvider>;
}
