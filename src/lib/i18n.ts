import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enHome from '@/locales/en/home.json';
import enComplaints from '@/locales/en/complaints.json';
import enDashboard from '@/locales/en/dashboard.json';
import enAdmin from '@/locales/en/admin.json';
import enProfile from '@/locales/en/profile.json';
import mrCommon from '@/locales/mr/common.json';
import mrAuth from '@/locales/mr/auth.json';
import mrHome from '@/locales/mr/home.json';
import mrComplaints from '@/locales/mr/complaints.json';
import mrDashboard from '@/locales/mr/dashboard.json';
import mrAdmin from '@/locales/mr/admin.json';
import mrProfile from '@/locales/mr/profile.json';
import hiCommon from '@/locales/hi/common.json';
import hiAuth from '@/locales/hi/auth.json';
import hiHome from '@/locales/hi/home.json';
import hiComplaints from '@/locales/hi/complaints.json';
import hiDashboard from '@/locales/hi/dashboard.json';
import hiAdmin from '@/locales/hi/admin.json';
import hiProfile from '@/locales/hi/profile.json';

export const LOCALES = ['en', 'mr', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = 'portal-locale';

const dictionaries = {
  en: { common: enCommon, auth: enAuth, home: enHome, complaints: enComplaints, dashboard: enDashboard, admin: enAdmin, profile: enProfile },
  mr: { common: mrCommon, auth: mrAuth, home: mrHome, complaints: mrComplaints, dashboard: mrDashboard, admin: mrAdmin, profile: mrProfile },
  hi: { common: hiCommon, auth: hiAuth, home: hiHome, complaints: hiComplaints, dashboard: hiDashboard, admin: hiAdmin, profile: hiProfile },
} as const;

export type Module = keyof (typeof dictionaries)['en'];

export function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && LOCALES.includes(value as Locale));
}

export function getDictionary(locale: Locale, module: Module) {
  return dictionaries[locale][module];
}

