'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ImageUploader, type UploadedFile } from '@/components/image-uploader';
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
      <h1 className="text-2xl font-bold text-slate-900">File a complaint</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your complaint is delivered to the assigned social worker on WhatsApp as soon as you submit it.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-6" noValidate>
        {formError && <Alert>{formError}</Alert>}

        <Field label="Complaint title" htmlFor="title" error={errors.title} required>
          <Input id="title" name="title" required maxLength={150} placeholder="Overflowing garbage bin near the school gate" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" error={errors.category} required>
            <Select id="category" name="category" defaultValue="GARBAGE" required>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" htmlFor="priority" error={errors.priority}>
            <Select id="priority" name="priority" defaultValue="MEDIUM">
              {COMPLAINT_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Description" htmlFor="description" error={errors.description} hint="Minimum 20 characters" required>
          <Textarea id="description" name="description" rows={5} required maxLength={5000} />
        </Field>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Where is the issue?</h2>

          <Field label="Area address" htmlFor="areaAddress" error={errors.areaAddress} required>
            <Textarea id="areaAddress" name="areaAddress" rows={2} defaultValue={defaults.areaAddress} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Landmark" htmlFor="landmark" error={errors.landmark}>
              <Input id="landmark" name="landmark" placeholder="Opposite Vanaz Metro" />
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
            <Field label="PIN code" htmlFor="pincode" error={errors.pincode} required>
              <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} defaultValue={defaults.pincode} required />
            </Field>
          </div>

          <Field label="Pin the exact location" htmlFor="map" error={errors.latitude ?? errors.longitude}>
            <MapPicker
              latitude={coords.latitude}
              longitude={coords.longitude}
              onChange={(next) => setCoords(next)}
            />
          </Field>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Contact number"
            htmlFor="contactNumber"
            error={errors.contactNumber}
            hint="The social worker will call this number"
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
          <Field label="Complaint photos" htmlFor="upload-complaints" error={errors.photos}>
            <ImageUploader folder="complaints" value={photos} onChange={setPhotos} max={5} label="Add photos" />
          </Field>
        </div>

        <Button type="submit" size="lg" loading={busy}>
          Submit complaint &amp; notify social worker
        </Button>
      </form>
    </Card>
  );
}
