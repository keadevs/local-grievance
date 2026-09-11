import type { Metadata } from 'next';

import { ProfileForm } from '@/components/profile-form';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = { title: 'My profile' };
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.sub },
    include: { resident: true },
  });

  const r = user.resident;

  return (
    <ProfileForm
      defaults={{
        firstName: r?.firstName ?? '',
        lastName: r?.lastName ?? '',
        mobile: user.mobile,
        email: user.email,
        dateOfBirth: r?.dateOfBirth ? r.dateOfBirth.toISOString().slice(0, 10) : '',
        gender: r?.gender ?? 'PREFER_NOT_TO_SAY',
        addressLine: r?.addressLine ?? '',
        locality: r?.locality ?? '',
        ward: r?.ward ?? '',
        city: r?.city ?? 'Pune',
        state: r?.state ?? 'Maharashtra',
        pincode: r?.pincode ?? '',
        profilePhoto: r?.profilePhoto ?? '',
      }}
    />
  );
}
