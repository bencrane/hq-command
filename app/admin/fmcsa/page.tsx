import { redirect } from 'next/navigation';
import { DEFAULT_SLUG } from '@/lib/fmcsa/constants';

export default function FmcsaIndex() {
  redirect(`/admin/fmcsa/${DEFAULT_SLUG}`);
}
