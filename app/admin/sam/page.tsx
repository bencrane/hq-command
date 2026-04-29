import { redirect } from 'next/navigation';
import { SAM_META } from '@/lib/data-sources/source-meta';

export default function SamIndex() {
  redirect(`/admin/${SAM_META.pathSegment}/${SAM_META.defaultSlug}`);
}
