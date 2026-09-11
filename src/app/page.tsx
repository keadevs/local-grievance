import Link from 'next/link';

import { getSession } from '@/lib/auth';
import { isStaff } from '@/lib/session';

const FEATURES = [
  {
    title: 'Resident Registration',
    body: 'Create a verified household profile with your address, ward and PIN code so every complaint is routed to the right area.',
  },
  {
    title: 'Grievance Management',
    body: 'Raise complaints with photos, exact map location and a contact number. Track the status from submitted to resolved.',
  },
  {
    title: 'Instant WhatsApp Alert',
    body: 'Every new complaint is pushed to the social worker’s WhatsApp within seconds — no email, no waiting, no paperwork.',
  },
];

const STEPS = [
  'Register once with your Pune address details',
  'File a complaint with photos and a pinned location',
  'Your social worker receives it on WhatsApp instantly',
  'Follow the status until it is marked resolved',
];

export default async function HomePage() {
  const session = await getSession();
  const dashboardHref = session ? (isStaff(session.role) ? '/admin' : '/dashboard') : '/register';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">PC</span>
            <span className="hidden sm:inline">Pune Civic Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            {session ? (
              <Link
                href={dashboardHref}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Register
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
                Serving Pune &amp; Pimpri-Chinchwad wards
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Your civic complaint, in your social worker&apos;s hands within seconds.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                Potholes, overflowing garbage, broken street lights or no water supply — register once, report in a
                minute, and let the portal deliver it straight to WhatsApp with photos and a map pin.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={dashboardHref}
                  className="rounded-lg bg-brand-600 px-6 py-3 text-center text-base font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  {session ? 'Open dashboard' : 'Register as a resident'}
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg bg-white px-6 py-3 text-center text-base font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50"
                >
                  File a complaint
                </Link>
              </div>
            </div>

            <ol className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              {STEPS.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-14">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
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
          <p>© {new Date().getFullYear()} Pune Civic Portal — a community initiative.</p>
          <p>Built for residents of Pune, Maharashtra.</p>
        </div>
      </footer>
    </div>
  );
}
