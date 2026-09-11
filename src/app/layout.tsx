import type { Metadata, Viewport } from 'next';

import { PwaRegister } from '@/components/pwa-register';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Pune Civic Portal | Resident Grievance Redressal',
    template: '%s | Pune Civic Portal',
  },
  description:
    'Register as a Pune resident, raise civic grievances with photos and geo-location, and have them delivered instantly to your ward social worker on WhatsApp.',
  applicationName: 'Pune Civic Portal',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Pune Civic Portal',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  keywords: ['Pune', 'PMC', 'civic complaint', 'grievance', 'resident', 'WhatsApp'],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Pune Civic Portal',
    description: 'File civic complaints in Pune and reach your social worker instantly on WhatsApp.',
    locale: 'en_IN',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1b5ff5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-full font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
