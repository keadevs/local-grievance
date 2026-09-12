import Link from 'next/link';

import { LanguageSwitcher } from '@/components/language-switcher';
import { getSession } from '@/lib/auth';
import { getServerDictionary } from '@/lib/server-i18n';
import { isStaff } from '@/lib/session';

export default async function HomePage() {
  const session = await getSession();
  const t = await getServerDictionary('home');
  const common = await getServerDictionary('common');
  const dashboardHref = session ? (isStaff(session.role) ? '/admin' : '/dashboard') : '/register';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">PC</span>
            <span className="hidden sm:inline">{common.brand}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {session ? (
              <Link href={dashboardHref} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                {common.dashboard}
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  {common.signIn}
                </Link>
                <Link href="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  {common.register}
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main" className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                {t.serviceArea}
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{t.heroTitle}</h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">{t.heroDescription}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={dashboardHref} className="rounded-lg bg-brand-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm hover:bg-brand-700">
                  {session ? t.openDashboard : t.registerResident}
                </Link>
                <Link href="/login" className="rounded-lg bg-white px-6 py-3 text-center text-base font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">
                  {t.fileComplaint}
                </Link>
              </div>
            </div>

            <ol className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              {t.steps.map((step: string, index: number) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{index + 1}</span>
                  <p className="pt-1 text-sm text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-14">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3">
            {t.features.map((feature: { title: string; body: string }) => (
              <div key={feature.title} className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-8 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Pune Civic Portal - a community initiative.</p>
          <p>{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
