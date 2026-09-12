'use client';

import { useState, type FormEvent } from 'react';

import { ImageUploader, type UploadedFile } from '@/components/image-uploader';
import { useTranslations } from '@/components/locale-provider';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '@/components/ui';
import { GENDERS, PUNE_WARDS } from '@/lib/validation';
import { apiFetch } from '@/lib/utils';

export interface ProfileDefaults {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  gender: (typeof GENDERS)[number];
  addressLine: string;
  locality: string;
  ward: string;
  city: string;
  state: string;
  pincode: string;
  profilePhoto: string;
}

type FieldErrors = Record<string, string[]>;

/** MODULE 1 - profile management. */
export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [photo, setPhoto] = useState<UploadedFile[]>(
    defaults.profilePhoto
      ? [{ url: defaults.profilePhoto, fileName: 'Profile photo', mimeType: 'image/webp', sizeBytes: 0 }]
      : [],
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const t = useTranslations('auth');
  const profileT = useTranslations('profile');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), profilePhoto: photo[0]?.url ?? '' };

    try {
      await apiFetch('/api/residents/me', { method: 'PUT', body: JSON.stringify(payload) });
      setMessage({ tone: 'success', text: profileT.updated });
    } catch (err) {
      const typed = err as Error & { details?: FieldErrors };
      setErrors(typed.details ?? {});
      setMessage({ tone: 'error', text: typed.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900">{profileT.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{profileT.description}</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5" noValidate>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.firstName} htmlFor="firstName" error={errors.firstName} required>
            <Input id="firstName" name="firstName" defaultValue={defaults.firstName} required />
          </Field>
          <Field label={t.lastName} htmlFor="lastName" error={errors.lastName} required>
            <Input id="lastName" name="lastName" defaultValue={defaults.lastName} required />
          </Field>
          <Field label={t.email} htmlFor="email">
            <Input id="email" name="email" defaultValue={defaults.email} disabled />
          </Field>
          <Field label={t.mobile} htmlFor="mobile" error={errors.mobile} required>
            <Input id="mobile" name="mobile" inputMode="numeric" defaultValue={defaults.mobile} required />
          </Field>
          <Field label={t.dateOfBirth} htmlFor="dateOfBirth" error={errors.dateOfBirth}>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={defaults.dateOfBirth} />
          </Field>
          <Field label={t.gender} htmlFor="gender" error={errors.gender}>
            <Select id="gender" name="gender" defaultValue={defaults.gender}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {{ MALE: t.male, FEMALE: t.female, OTHER: t.other, PREFER_NOT_TO_SAY: t.preferNot }[g]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label={t.profilePhoto} htmlFor="upload-profiles">
          <ImageUploader folder="profiles" value={photo} onChange={setPhoto} max={1} label={t.uploadProfile} />
        </Field>

        <Field label={t.address} htmlFor="addressLine" error={errors.addressLine} required>
          <Textarea id="addressLine" name="addressLine" rows={2} defaultValue={defaults.addressLine} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.locality} htmlFor="locality" error={errors.locality}>
            <Input id="locality" name="locality" defaultValue={defaults.locality} />
          </Field>
          <Field label={t.ward} htmlFor="ward" error={errors.ward}>
            <Select id="ward" name="ward" defaultValue={defaults.ward}>
              <option value="">{t.selectWard}</option>
              {PUNE_WARDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.city} htmlFor="city" error={errors.city} required>
            <Input id="city" name="city" defaultValue={defaults.city} required />
          </Field>
          <Field label={t.state} htmlFor="state" error={errors.state} required>
            <Input id="state" name="state" defaultValue={defaults.state} required />
          </Field>
          <Field label={t.pinCode} htmlFor="pincode" error={errors.pincode} required>
            <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} defaultValue={defaults.pincode} required />
          </Field>
        </div>

        <Button type="submit" size="lg" loading={busy} className="sm:self-start">
          {profileT.save}
        </Button>
      </form>
    </Card>
  );
}
