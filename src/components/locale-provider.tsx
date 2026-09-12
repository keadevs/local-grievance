'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getDictionary, LOCALE_COOKIE, type Locale, type Module } from '@/lib/i18n';

type Dictionary = Record<string, any>;

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: 'en',
  setLocale: () => undefined,
});

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setLocaleState(next);
    window.location.reload();
  };

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useTranslations(module: Module): Dictionary {
  const { locale } = useLocale();
  const dictionary = getDictionary(locale, module) as Dictionary;
  return dictionary;
}

export function useLocaleDocument() {
  const { locale } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === 'mr' ? 'mr-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN';
  }, [locale]);
}
