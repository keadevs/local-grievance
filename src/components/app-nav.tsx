'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { LogoutButton } from '@/components/logout-button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslations } from '@/components/locale-provider';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
}

export function AppNav({ items, userName, role }: { items: NavItem[]; userName: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations('common');
  const localizedLabels: Record<string, string> = {
    'My complaints': t.myComplaints,
    'New complaint': t.newComplaint,
    'My profile': t.myProfile,
    'Grievance console': t.grievanceConsole,
  };

  const linkClass = (href: string) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-semibold transition',
      pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href))
        ? 'bg-brand-50 text-brand-700'
        : 'text-slate-700 hover:bg-slate-100',
    );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">PC</span>
            <span className="hidden sm:inline">Pune Civic Portal</span>
          </Link>
          <nav aria-label={t.primaryNavigation} className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {localizedLabels[item.label] ?? item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-500">{role.replace('_', ' ').toLowerCase()}</p>
          </div>
          <LogoutButton />
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-label={t.toggleNavigation}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-700 ring-1 ring-slate-300 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M2 5h16v2H2V5zm0 4h16v2H2V9zm0 4h16v2H2v-2z" />
          </svg>
        </button>
      </div>

      {open && (
        <nav aria-label={t.mobileNavigation} className="border-t border-slate-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
                {localizedLabels[item.label] ?? item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-sm font-semibold text-slate-900">{userName}</span>
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
