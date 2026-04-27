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
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <div className="text-sm font-semibold">hq</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-600">{user.email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded border border-neutral-300 px-3 py-1 hover:bg-neutral-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
