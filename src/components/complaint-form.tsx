'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ImageUploader, type UploadedFile } from '@/components/image-uploader';
import { useTranslations } from '@/components/locale-provider';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '@/components/ui';
import { CATEGORY_LABELS, COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, PUNE_WARDS } from '@/lib/validation';
import { apiFetch } from '@/lib/utils';

// Leaflet touches `window`, so the picker is client-only.
const MapPicker = dynamic(() => import('@/components/map-picker'), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-200 sm:h-80" />,
});

interface Props {
  defaults: {
    contactNumber: string;
    areaAddress: string;
    ward: string;
    pincode: string;
  };
}

type FieldErrors = Record<string, string[]>;

/** MODULE 2 - grievance submission. */
export function ComplaintForm({ defaults }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [coords, setCoords] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = useTranslations('complaints');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      ...Object.fromEntries(form.entries()),
      latitude: coords.latitude,
      longitude: coords.longitude,
      photos: photos.map(({ url, fileName, mimeType, sizeBytes }) => ({ url, fileName, mimeType, sizeBytes })),
    };

    try {
      const complaint = await apiFetch<{ id: string }>('/api/complaints', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.replace(`/dashboard/complaints/${complaint.id}?created=1`);
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
      <h1 className="text-2xl font-bold text-slate-900">{t.fileTitle}</h1>
      <p className="mt-1 text-sm text-slate-600">{t.fileDescription}</p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6" noValidate>
        {formError && <Alert>{formError}</Alert>}

        <Field label={t.title} htmlFor="title" error={errors.title} required>
          <Input id="title" name="title" required maxLength={150} placeholder={t.titlePlaceholder} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.category} htmlFor="category" error={errors.category} required>
            <Select id="category" name="category" defaultValue="GARBAGE" required>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.categoryLabels[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.priority} htmlFor="priority" error={errors.priority}>
            <Select id="priority" name="priority" defaultValue="MEDIUM">
              {COMPLAINT_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t.priorityLabels[p]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label={t.description} htmlFor="description" error={errors.description} hint={t.descriptionHint} required>
          <Textarea id="description" name="description" rows={5} required maxLength={5000} />
        </Field>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t.whereIssue}</h2>

          <Field label={t.areaAddress} htmlFor="areaAddress" error={errors.areaAddress} required>
            <Textarea id="areaAddress" name="areaAddress" rows={2} defaultValue={defaults.areaAddress} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t.landmark} htmlFor="landmark" error={errors.landmark}>
              <Input id="landmark" name="landmark" placeholder={t.landmarkPlaceholder} />
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
            <Field label="PIN code" htmlFor="pincode" error={errors.pincode} required>
              <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} defaultValue={defaults.pincode} required />
            </Field>
          </div>

          <Field label={t.pinLocation} htmlFor="map" error={errors.latitude ?? errors.longitude}>
            <MapPicker
              latitude={coords.latitude}
              longitude={coords.longitude}
              onChange={(next) => setCoords(next)}
            />
          </Field>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t.contactNumber}
            htmlFor="contactNumber"
            error={errors.contactNumber}
            hint={t.contactHint}
            required
          >
            <Input
              id="contactNumber"
              name="contactNumber"
              inputMode="numeric"
              defaultValue={defaults.contactNumber}
              required
            />
          </Field>
          <Field label={t.photos} htmlFor="upload-complaints" error={errors.photos}>
            <ImageUploader folder="complaints" value={photos} onChange={setPhotos} max={5} label={t.addPhotos} />
          </Field>
        </div>

        <Button type="submit" size="lg" loading={busy}>
          {t.submit}
        </Button>
      </form>
    </Card>
  );
}
