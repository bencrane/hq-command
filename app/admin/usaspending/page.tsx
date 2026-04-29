import { redirect } from 'next/navigation';
import { usaspendingSource } from '@/lib/data-sources/sources/usaspending';

export default function UsaspendingIndex() {
  redirect(`/admin/usaspending/${usaspendingSource.defaultSlug}`);
}
