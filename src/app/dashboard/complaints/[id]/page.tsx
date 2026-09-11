import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ComplaintDetail } from '@/components/complaint-detail';
import { Alert } from '@/components/ui';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ComplaintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { created } = await searchParams;

  const complaint = await prisma.complaint.findFirst({
    where: { id, residentId: session.sub },
    include: {
      photos: true,
      events: { orderBy: { createdAt: 'asc' }, include: { actor: { select: { email: true, role: true } } } },
    },
  });

  if (!complaint) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link href="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Back to my complaints
      </Link>

      {created && (
        <Alert tone="success">
          Complaint <strong>{complaint.referenceCode}</strong> submitted. The social worker has been alerted on WhatsApp.
        </Alert>
      )}

      <ComplaintDetail
        complaint={{
          ...complaint,
          latitude: complaint.latitude ? Number(complaint.latitude) : null,
          longitude: complaint.longitude ? Number(complaint.longitude) : null,
        }}
      />
    </div>
  );
}
