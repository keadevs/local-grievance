import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ComplaintDetail } from '@/components/complaint-detail';
import { RetryAlertButton } from '@/components/retry-alert-button';
import { StatusUpdateForm } from '@/components/status-update-form';
import { Badge, Card } from '@/components/ui';
import { requireStaff } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'REJECTED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'REJECTED', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  REJECTED: ['CLOSED'],
  CLOSED: [],
};

export default async function AdminComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      photos: true,
      events: { orderBy: { createdAt: 'asc' }, include: { actor: { select: { email: true, role: true } } } },
      notifications: { orderBy: { createdAt: 'desc' } },
      resident: { select: { email: true, mobile: true, resident: true } },
    },
  });

  if (!complaint) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/admin" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Back to console
      </Link>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <ComplaintDetail
          complaint={{
            ...complaint,
            latitude: complaint.latitude ? Number(complaint.latitude) : null,
            longitude: complaint.longitude ? Number(complaint.longitude) : null,
          }}
        />

        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resident</h2>
            <p className="mt-2 font-medium text-slate-900">
              {complaint.resident.resident
                ? `${complaint.resident.resident.firstName} ${complaint.resident.resident.lastName}`
                : '—'}
            </p>
            <p className="text-sm text-slate-600">{complaint.resident.email}</p>
            <p className="text-sm text-slate-600">+91 {complaint.resident.mobile}</p>
            {complaint.resident.resident && (
              <p className="mt-2 text-sm text-slate-600">
                {complaint.resident.resident.addressLine}, {complaint.resident.resident.city} —{' '}
                {complaint.resident.resident.pincode}
              </p>
            )}
          </Card>

          <StatusUpdateForm
            complaintId={complaint.id}
            currentStatus={complaint.status}
            currentPriority={complaint.priority}
            allowedStatuses={TRANSITIONS[complaint.status] ?? []}
          />

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">WhatsApp alerts</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {complaint.notifications.length === 0 && <li className="text-sm text-slate-500">No alerts dispatched yet.</li>}
              {complaint.notifications.map((n) => (
                <li key={n.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      className={
                        n.status === 'SENT'
                          ? 'bg-emerald-100 text-emerald-800 ring-emerald-600/20'
                          : n.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800 ring-rose-600/20'
                            : 'bg-amber-100 text-amber-800 ring-amber-600/20'
                      }
                    >
                      {n.status}
                    </Badge>
                    <span className="text-xs text-slate-500">{n.provider}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">To +{n.recipient}</p>
                  <p className="text-xs text-slate-500">
                    {n.sentAt ? `Sent ${formatDateTime(n.sentAt)} IST` : `Queued ${formatDateTime(n.createdAt)} IST`} ·{' '}
                    {n.attempts} attempt(s)
                  </p>
                  {n.error && <p className="mt-1 text-xs text-rose-600">{n.error}</p>}
                  {n.status !== 'SENT' && (
                    <div className="mt-2">
                      <RetryAlertButton notificationId={n.id} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
