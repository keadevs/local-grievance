import { redirect } from 'next/navigation';

import { AppNav } from '@/components/app-nav';
import { getSession } from '@/lib/auth';

const NAV = [
  { href: '/dashboard', label: 'My complaints' },
  { href: '/dashboard/complaints/new', label: 'New complaint' },
  { href: '/dashboard/profile', label: 'My profile' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav items={NAV} userName={session.name || session.email} role={session.role} />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
