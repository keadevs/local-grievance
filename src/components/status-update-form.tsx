'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Alert, Button, Card, Field, Select, Textarea } from '@/components/ui';
import { useTranslations } from '@/components/locale-provider';
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
  const t = useTranslations('complaints');

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
      setMessage({ tone: 'success', text: t.status.updated });
      router.refresh();
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t.status.update}</h2>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        {message && <Alert tone={message.tone}>{message.text}</Alert>}

        <Field label={t.status.new} htmlFor="status" required>
          <Select id="status" name="status" defaultValue={currentStatus} required>
            <option value={currentStatus}>{STATUS_LABELS[currentStatus]} ({t.status.noChange})</option>
            {allowedStatuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t.priority} htmlFor="priority">
          <Select id="priority" name="priority" defaultValue={currentPriority}>
            {COMPLAINT_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t.priorityLabels[p]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t.status.remark} htmlFor="note" hint={t.status.remarkHint}>
          <Textarea id="note" name="note" rows={3} maxLength={2000} />
        </Field>

        <Button type="submit" loading={busy}>
          {t.status.save}
        </Button>
      </form>
    </Card>
  );
}
