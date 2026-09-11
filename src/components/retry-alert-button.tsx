'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui';
import { apiFetch } from '@/lib/utils';

export function RetryAlertButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await apiFetch(`/api/admin/notifications/${notificationId}/retry`, { method: 'POST' });
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Retry failed');
          } finally {
            setBusy(false);
          }
        }}
      >
        Resend WhatsApp alert
      </Button>
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
