'use client';

import { useActionState } from 'react';
import { signIn, type SignInState } from '@/app/auth/actions';

const initial: SignInState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initial);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6">
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">HQ</h1>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          required
          className="rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
        />
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          required
          className="rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:border-neutral-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
        {state.error ? (
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
        ) : null}
      </form>
    </main>
  );
}
