'use client';

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(form.entries()), profilePhoto: photo[0]?.url ?? '' };

    try {
      await apiFetch('/api/residents/me', { method: 'PUT', body: JSON.stringify(payload) });
      setMessage({ tone: 'success', text: 'Profile updated successfully.' });
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
      <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
      <p className="mt-1 text-sm text-slate-600">Keep your address current so complaints reach the right ward office.</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5" noValidate>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" error={errors.firstName} required>
            <Input id="firstName" name="firstName" defaultValue={defaults.firstName} required />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName} required>
            <Input id="lastName" name="lastName" defaultValue={defaults.lastName} required />
          </Field>
          <Field label="Email address" htmlFor="email">
            <Input id="email" name="email" defaultValue={defaults.email} disabled />
          </Field>
          <Field label="Mobile number" htmlFor="mobile" error={errors.mobile} required>
            <Input id="mobile" name="mobile" inputMode="numeric" defaultValue={defaults.mobile} required />
          </Field>
          <Field label="Date of birth" htmlFor="dateOfBirth" error={errors.dateOfBirth}>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={defaults.dateOfBirth} />
          </Field>
          <Field label="Gender" htmlFor="gender" error={errors.gender}>
            <Select id="gender" name="gender" defaultValue={defaults.gender}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {GENDER_LABELS[g]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Profile photo" htmlFor="upload-profiles">
          <ImageUploader folder="profiles" value={photo} onChange={setPhoto} max={1} label="Change photo" />
        </Field>

        <Field label="Address" htmlFor="addressLine" error={errors.addressLine} required>
          <Textarea id="addressLine" name="addressLine" rows={2} defaultValue={defaults.addressLine} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Locality / society" htmlFor="locality" error={errors.locality}>
            <Input id="locality" name="locality" defaultValue={defaults.locality} />
          </Field>
          <Field label="Ward office" htmlFor="ward" error={errors.ward}>
            <Select id="ward" name="ward" defaultValue={defaults.ward}>
              <option value="">Select ward</option>
              {PUNE_WARDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="City" htmlFor="city" error={errors.city} required>
            <Input id="city" name="city" defaultValue={defaults.city} required />
          </Field>
          <Field label="State" htmlFor="state" error={errors.state} required>
            <Input id="state" name="state" defaultValue={defaults.state} required />
          </Field>
          <Field label="PIN code" htmlFor="pincode" error={errors.pincode} required>
            <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} defaultValue={defaults.pincode} required />
          </Field>
        </div>

        <Button type="submit" size="lg" loading={busy} className="sm:self-start">
          Save changes
        </Button>
      </form>
    </Card>
  );
}
