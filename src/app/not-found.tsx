import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="max-w-md text-slate-600">
        The page you are looking for does not exist, or you do not have access to it.
      </p>
      <Link href="/" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        Back to home
      </Link>
    </div>
  );
}
