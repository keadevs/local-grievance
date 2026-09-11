import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, EmptyState } from '@/components/ui';
import { requireStaff } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CATEGORY_LABELS, COMPLAINT_STATUSES, STATUS_LABELS } from '@/lib/validation';
import { PRIORITY_STYLES, STATUS_STYLES, relativeTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Grievance console' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 15;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;

  const status = COMPLAINT_STATUSES.includes(params.status as never) ? (params.status as never) : undefined;
  const q = params.q?.trim().slice(0, 100);
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { referenceCode: { contains: q } },
            { areaAddress: { contains: q } },
            { pincode: { contains: q } },
          ],
        }
      : {}),
  };

  const [complaints, total, grouped, pendingAlerts] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: {
        resident: { select: { email: true, mobile: true, resident: { select: { firstName: true, lastName: true } } } },
        notifications: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.complaint.count({ where }),
    prisma.complaint.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.notificationLog.count({ where: { status: 'FAILED' } }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Grievance console</h1>
        <p className="text-sm text-slate-600">Every complaint raised across Pune, newest first.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'] as const).map((key) => (
          <Card key={key} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{STATUS_LABELS[key]}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts[key] ?? 0}</p>
          </Card>
        ))}
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failed alerts</p>
          <p className={`mt-1 text-2xl font-bold ${pendingAlerts ? 'text-rose-600' : 'text-slate-900'}`}>{pendingAlerts}</p>
        </Card>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search reference, title, address or PIN"
          className="min-w-64 flex-1 rounded-lg border-0 bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="rounded-lg border-0 bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300"
        >
          <option value="">All statuses</option>
          {COMPLAINT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Filter
        </button>
      </form>

      {complaints.length === 0 ? (
        <EmptyState title="No complaints found" description="Try clearing the filters or search term." />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Complaint</th>
                <th className="px-4 py-3">Resident</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Alert</th>
                <th className="px-4 py-3">Raised</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    <Link href={`/admin/complaints/${c.id}`} className="font-semibold text-brand-700 hover:underline">
                      {c.referenceCode}
                    </Link>
                  </td>
                  <td className="max-w-72 px-4 py-3">
                    <p className="truncate font-medium text-slate-900">{c.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {CATEGORY_LABELS[c.category]} · {c.pincode}
                      {c.ward ? ` · ${c.ward}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-900">
                      {c.resident.resident ? `${c.resident.resident.firstName} ${c.resident.resident.lastName}` : '—'}
                    </p>
                    <p className="text-xs text-slate-500">+91 {c.contactNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge className={STATUS_STYLES[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                      <Badge className={PRIORITY_STYLES[c.priority]}>{c.priority}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.notifications[0]?.status === 'SENT' ? (
                      <span className="text-emerald-700">Delivered</span>
                    ) : c.notifications[0]?.status === 'FAILED' ? (
                      <span className="font-semibold text-rose-600">Failed</span>
                    ) : (
                      <span className="text-slate-500">Pending</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{relativeTime(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin?${new URLSearchParams({ ...(status ? { status: status as string } : {}), ...(q ? { q } : {}), page: String(p) }).toString()}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ${p === page ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-700 ring-slate-300'}`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
