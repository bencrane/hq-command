import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-black text-white">
      <Link
        href="/admin"
        className="absolute left-6 top-4 z-10 text-lg font-semibold tracking-tight hover:opacity-80"
      >
        HQ
      </Link>
      {children}
      <form action={signOut} className="absolute bottom-4 left-6">
        <button
          type="submit"
          className="text-xs text-neutral-500 hover:text-white"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
