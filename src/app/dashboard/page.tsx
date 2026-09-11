import Link from 'next/link';

import { Badge, Card, EmptyState } from '@/components/ui';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CATEGORY_LABELS, COMPLAINT_STATUSES, STATUS_LABELS } from '@/lib/validation';
import { PRIORITY_STYLES, STATUS_STYLES, relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 10;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const status = COMPLAINT_STATUSES.includes(params.status as never) ? (params.status as never) : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const where = { residentId: session.sub, ...(status ? { status } : {}) };

  const [complaints, total, grouped] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: { photos: { take: 1 }, _count: { select: { photos: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.complaint.count({ where }),
    prisma.complaint.groupBy({
      by: ['status'],
      where: { residentId: session.sub },
      _count: { _all: true },
    }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My complaints</h1>
          <p className="text-sm text-slate-600">Track every grievance you have raised for your area.</p>
        </div>
        <Link
          href="/dashboard/complaints/new"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          File a new complaint
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((key) => (
          <Card key={key} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{STATUS_LABELS[key]}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts[key] ?? 0}</p>
          </Card>
        ))}
      </div>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${!status ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-300'}`}
        >
          All
        </Link>
        {COMPLAINT_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/dashboard?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${status === s ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-300'}`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </nav>

      {complaints.length === 0 ? (
        <EmptyState
          title="No complaints yet"
          description="When you report an issue in your area it will appear here, and your social worker is alerted on WhatsApp immediately."
          action={
            <Link
              href="/dashboard/complaints/new"
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              File your first complaint
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {complaints.map((complaint) => (
            <li key={complaint.id}>
              <Link
                href={`/dashboard/complaints/${complaint.id}`}
                className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-400"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-500">{complaint.referenceCode}</p>
                    <h2 className="mt-1 truncate text-base font-semibold text-slate-900">{complaint.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {CATEGORY_LABELS[complaint.category]} · {complaint.areaAddress} · {complaint.pincode}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge className={STATUS_STYLES[complaint.status]}>{STATUS_LABELS[complaint.status]}</Badge>
                    <Badge className={PRIORITY_STYLES[complaint.priority]}>{complaint.priority}</Badge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Raised {relativeTime(complaint.createdAt)}</span>
                  <span>{complaint._count.photos} photo(s)</span>
                  {complaint.latitude && <span>Geo-tagged</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard?${new URLSearchParams({ ...(status ? { status: status as string } : {}), page: String(p) }).toString()}`}
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
