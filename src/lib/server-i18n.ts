import { cookies } from 'next/headers';

import { getDictionary, isLocale, LOCALE_COOKIE, type Module } from '@/lib/i18n';

export async function getLocale() {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : 'en';
}

export async function getServerDictionary(module: Module) {
  return getDictionary(await getLocale(), module);
}
