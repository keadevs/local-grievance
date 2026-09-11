'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Alert, Button, Card, Field, Input } from '@/components/ui';
import { apiFetch } from '@/lib/utils';

interface SessionUser {
  id: string;
  role: 'RESIDENT' | 'SOCIAL_WORKER' | 'ADMIN';
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      const user = await apiFetch<SessionUser>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      const fallback = user.role === 'RESIDENT' ? '/dashboard' : '/admin';
      const next = params.get('next');
      router.replace(next && next.startsWith('/') ? next : fallback);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-600">Access your complaints and track their progress.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        {error && <Alert>{error}</Alert>}

        <Field label="Email address" htmlFor="email" required>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>

        <Button type="submit" loading={busy} size="lg">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to the portal?{' '}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Register as a resident
        </Link>
      </p>
    </Card>
  );
}
