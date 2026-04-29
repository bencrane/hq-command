import { redirect } from 'next/navigation';
import { LEGACY_PATH_TO_STARTER } from '@/lib/audience-builder/starters';

interface PageProps {
  params: Promise<{ endpoint?: string[] }>;
}

export default async function FmcsaLegacyRedirect({ params }: PageProps) {
  const { endpoint } = await params;
  const slug = (endpoint ?? []).join('/');
  const starter = LEGACY_PATH_TO_STARTER[`fmcsa/${slug}`];
  if (starter) {
    redirect(`/admin/audience-builder?starter=${encodeURIComponent(starter)}`);
  }
  redirect('/admin/audience-builder?starter=fmcsa-new-entrants-90d');
}
