'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Alert, Button, Card, Field, Select, Textarea } from '@/components/ui';
import { COMPLAINT_PRIORITIES, COMPLAINT_STATUSES, STATUS_LABELS } from '@/lib/validation';
import { apiFetch } from '@/lib/utils';

interface Props {
  complaintId: string;
  currentStatus: (typeof COMPLAINT_STATUSES)[number];
  currentPriority: (typeof COMPLAINT_PRIORITIES)[number];
  allowedStatuses: string[];
}

/** Staff action panel: advance the grievance lifecycle with an audit note. */
export function StatusUpdateForm({ complaintId, currentStatus, currentPriority, allowedStatuses }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    try {
      await apiFetch(`/api/admin/complaints/${complaintId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: form.get('status'),
          priority: form.get('priority'),
          note: form.get('note'),
        }),
      });
      setMessage({ tone: 'success', text: 'Complaint updated.' });
      router.refresh();
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Update status</h2>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        {message && <Alert tone={message.tone}>{message.text}</Alert>}

        <Field label="New status" htmlFor="status" required>
          <Select id="status" name="status" defaultValue={currentStatus} required>
            <option value={currentStatus}>{STATUS_LABELS[currentStatus]} (no change)</option>
            {allowedStatuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Priority" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue={currentPriority}>
            {COMPLAINT_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Remark" htmlFor="note" hint="Visible to the resident on the complaint timeline">
          <Textarea id="note" name="note" rows={3} maxLength={2000} />
        </Field>

        <Button type="submit" loading={busy}>
          Save update
        </Button>
      </form>
    </Card>
  );
}
