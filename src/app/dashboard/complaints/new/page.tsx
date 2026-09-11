import type { Metadata } from 'next';
import Link from 'next/link';

import { ComplaintForm } from '@/components/complaint-form';
import { Alert } from '@/components/ui';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = { title: 'File a complaint' };
export const dynamic = 'force-dynamic';

export default async function NewComplaintPage() {
  const session = await requireSession();
  const [resident, user] = await Promise.all([
    prisma.resident.findUnique({ where: { userId: session.sub } }),
    prisma.user.findUnique({ where: { id: session.sub }, select: { mobile: true } }),
  ]);

  if (!resident) {
    return (
      <Alert tone="info">
        Complete your{' '}
        <Link href="/dashboard/profile" className="font-semibold underline">
          resident profile
        </Link>{' '}
        before filing a complaint.
      </Alert>
    );
  }

  return (
    <ComplaintForm
      defaults={{
        contactNumber: user?.mobile ?? '',
        areaAddress: resident.addressLine,
        ward: resident.ward ?? '',
        pincode: resident.pincode,
      }}
    />
  );
}
