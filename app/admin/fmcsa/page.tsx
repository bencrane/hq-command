import { redirect } from 'next/navigation';
import { DEFAULT_SLUG } from '@/lib/fmcsa/registry';

export default function FmcsaIndex() {
  redirect(`/admin/fmcsa/${DEFAULT_SLUG}`);
}
