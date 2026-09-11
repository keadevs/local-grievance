'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiFetch } from '@/lib/utils';

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await apiFetch('/api/auth/logout', { method: 'POST' });
        } finally {
          router.replace('/login');
          router.refresh();
        }
      }}
      className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
