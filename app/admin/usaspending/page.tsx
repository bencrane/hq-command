import { redirect } from 'next/navigation';
import { USASPENDING_META } from '@/lib/data-sources/source-meta';

export default function UsaspendingIndex() {
  redirect(`/admin/${USASPENDING_META.pathSegment}/${USASPENDING_META.defaultSlug}`);
}
