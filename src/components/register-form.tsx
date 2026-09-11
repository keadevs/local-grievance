'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ImageUploader, type UploadedFile } from '@/components/image-uploader';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '@/components/ui';
import { GENDERS, PUNE_WARDS } from '@/lib/validation';
import { apiFetch } from '@/lib/utils';

const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

type FieldErrors = Record<string, string[]>;

/** MODULE 1 - resident registration form. */
export function RegisterForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      <h1 className="text-2xl font-bold text-slate-900">Resident registration</h1>
      <p className="mt-1 text-sm text-slate-600">
        Register once to raise and track civic complaints for your area in Pune.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6" noValidate>
        {formError && <Alert>{formError}</Alert>}

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Personal details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" error={errors.firstName} required>
              <Input id="firstName" name="firstName" autoComplete="given-name" required />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName} required>
              <Input id="lastName" name="lastName" autoComplete="family-name" required />
            </Field>
            <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth}>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} />
            </Field>
            <Field label="Gender" htmlFor="gender" error={errors.gender}>
              <Select id="gender" name="gender" defaultValue="PREFER_NOT_TO_SAY">
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Profile photo" htmlFor="upload-profiles" error={errors.profilePhoto}>
            <ImageUploader folder="profiles" value={photo} onChange={setPhoto} max={1} label="Upload profile photo" />
          </Field>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contact &amp; credentials</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mobile number" htmlFor="mobile" error={errors.mobile} hint="10-digit Indian number" required>
              <Input id="mobile" name="mobile" inputMode="numeric" autoComplete="tel-national" required placeholder="9876543210" />
            </Field>
            <Field label="Email address" htmlFor="email" error={errors.email} required>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              error={errors.password}
              hint="Min. 10 characters with upper, lower, number and symbol"
              required
            >
              <Input id="password" name="password" type="password" autoComplete="new-password" required />
            </Field>
            <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword} required>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Residential address</h2>

          <Field label="Address" htmlFor="addressLine" error={errors.addressLine} required>
            <Textarea id="addressLine" name="addressLine" autoComplete="street-address" required rows={2} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Locality / society" htmlFor="locality" error={errors.locality}>
              <Input id="locality" name="locality" placeholder="e.g. Kothrud Depot" />
            </Field>
            <Field label="Ward office" htmlFor="ward" error={errors.ward}>
              <Select id="ward" name="ward" defaultValue="">
                <option value="">Select ward</option>
                {PUNE_WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="City" htmlFor="city" error={errors.city} required>
              <Input id="city" name="city" defaultValue="Pune" required />
            </Field>
            <Field label="State" htmlFor="state" error={errors.state} required>
              <Input id="state" name="state" defaultValue="Maharashtra" required />
            </Field>
            <Field label="PIN code" htmlFor="pincode" error={errors.pincode} required>
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
              I confirm the details are accurate and consent to my complaint details being shared with the assigned
              social worker over WhatsApp.
            </span>
          </label>
        </Field>

        <Button type="submit" size="lg" loading={busy}>
          Create my account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
