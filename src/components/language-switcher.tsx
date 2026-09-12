'use client';

import { useLocale, useTranslations } from '@/components/locale-provider';
import { LOCALES, type Locale } from '@/lib/i18n';

const labels: Record<Locale, string> = { en: 'English', mr: 'मराठी', hi: 'हिंदी' };

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations('common');

  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
      <span className="sr-only">{t.language}</span>
      <select
        aria-label={t.language}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="rounded-lg border-0 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
      >
        {LOCALES.map((value) => (
          <option key={value} value={value}>
            {labels[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
