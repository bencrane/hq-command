import { hqxFetch, HqxAuthError, HqxRequestError } from '@/lib/hqx';

interface Me {
  user_id: string;
  business_user_id: string;
  email: string;
  role: string;
}

export default async function AdminPage() {
  let body: string;
  try {
    const me = await hqxFetch<Me>('/admin/me');
    body = JSON.stringify(me, null, 2);
  } catch (err) {
    if (err instanceof HqxAuthError) {
      body = 'Not signed in.';
    } else if (err instanceof HqxRequestError) {
      body = `hq-x error ${err.status}: ${err.body || err.message}`;
    } else {
      body = `Error: ${(err as Error).message}`;
    }
  }

  return (
    <section className="max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold">/admin/me</h1>
      <pre className="overflow-auto rounded border border-neutral-200 bg-white p-4 text-xs">
        {body}
      </pre>
    </section>
  );
}
