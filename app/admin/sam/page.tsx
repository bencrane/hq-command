import { redirect } from 'next/navigation';
import { samSource } from '@/lib/data-sources/sources/sam';

export default function SamIndex() {
  redirect(`/admin/sam/${samSource.defaultSlug}`);
}
