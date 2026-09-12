'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ImageUploader, type UploadedFile } from '@/components/image-uploader';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '@/components/ui';
import { useTranslations } from '@/components/locale-provider';
import { GENDERS, PUNE_WARDS } from '@/lib/validation';
import { apiFetch } from '@/lib/utils';

type FieldErrors = Record<string, string[]>;

/** MODULE 1 - resident registration form. */
export function RegisterForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = useTranslations('auth');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      ...Object.fromEntries(form.entries()),
      acceptTerms: form.get('acceptTerms') === 'on',
      profilePhoto: photo[0]?.url ?? '',
    };

    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      const typed = err as Error & { details?: FieldErrors };
      setErrors(typed.details ?? {});
      setFormError(typed.message);
      setBusy(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900">{t.registerTitle}</h1>
      <p className="mt-1 text-sm text-slate-600">{t.registerDescription}</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6" noValidate>
        {formError && <Alert>{formError}</Alert>}

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t.personalDetails}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.firstName} htmlFor="firstName" error={errors.firstName} required>
              <Input id="firstName" name="firstName" autoComplete="given-name" required />
            </Field>
            <Field label={t.lastName} htmlFor="lastName" error={errors.lastName} required>
              <Input id="lastName" name="lastName" autoComplete="family-name" required />
            </Field>
            <Field label={t.dateOfBirth} htmlFor="dateOfBirth" error={errors.dateOfBirth}>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label={t.gender} htmlFor="gender" error={errors.gender}>
              <Select id="gender" name="gender" defaultValue="PREFER_NOT_TO_SAY">
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {{ MALE: t.male, FEMALE: t.female, OTHER: t.other, PREFER_NOT_TO_SAY: t.preferNot }[g]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={t.profilePhoto} htmlFor="upload-profiles" error={errors.profilePhoto}>
            <ImageUploader folder="profiles" value={photo} onChange={setPhoto} max={1} label={t.uploadProfile} />
          </Field>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t.contactCredentials}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.mobile} htmlFor="mobile" error={errors.mobile} hint="10-digit Indian number" required>
              <Input id="mobile" name="mobile" inputMode="numeric" autoComplete="tel-national" required placeholder="9876543210" />
            </Field>
            <Field label={t.email} htmlFor="email" error={errors.email} required>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field
              label={t.password}
              htmlFor="password"
              error={errors.password}
              hint={t.passwordHint}
              required
            >
              <Input id="password" name="password" type="password" autoComplete="new-password" required />
            </Field>
            <Field label={t.confirmPassword} htmlFor="confirmPassword" error={errors.confirmPassword} required>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t.residentialAddress}</h2>

          <Field label={t.address} htmlFor="addressLine" error={errors.addressLine} required>
            <Textarea id="addressLine" name="addressLine" autoComplete="street-address" required rows={2} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.locality} htmlFor="locality" error={errors.locality}>
              <Input id="locality" name="locality" placeholder="e.g. Kothrud Depot" />
            </Field>
            <Field label={t.ward} htmlFor="ward" error={errors.ward}>
              <Select id="ward" name="ward" defaultValue="">
                <option value="">{t.selectWard}</option>
                {PUNE_WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.city} htmlFor="city" error={errors.city} required>
              <Input id="city" name="city" defaultValue="Pune" required />
            </Field>
            <Field label={t.state} htmlFor="state" error={errors.state} required>
              <Input id="state" name="state" defaultValue="Maharashtra" required />
            </Field>
            <Field label={t.pinCode} htmlFor="pincode" error={errors.pincode} required>
              <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} required placeholder="411038" />
            </Field>
          </div>
        </section>

        <Field label="" htmlFor="acceptTerms" error={errors.acceptTerms}>
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
            />
            <span>
              {t.terms}
            </span>
          </label>
        </Field>

        <Button type="submit" size="lg" loading={busy}>
          {t.createAccount}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {t.alreadyRegistered}{' '}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          {t.submitSignIn}
        </Link>
      </p>
    </Card>
  );
}
