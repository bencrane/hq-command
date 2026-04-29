import { redirect } from 'next/navigation';
import { fmcsaSource } from '@/lib/data-sources/sources/fmcsa';

export default function FmcsaIndex() {
  redirect(`/admin/fmcsa/${fmcsaSource.defaultSlug}`);
}
