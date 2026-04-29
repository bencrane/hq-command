import { redirect } from 'next/navigation';
import { FMCSA_META } from '@/lib/data-sources/source-meta';

export default function FmcsaIndex() {
  redirect(`/admin/${FMCSA_META.pathSegment}/${FMCSA_META.defaultSlug}`);
}
