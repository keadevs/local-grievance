import Image from 'next/image';

import { Badge, Card } from '@/components/ui';
import { getServerDictionary } from '@/lib/server-i18n';
import { CATEGORY_LABELS, COMPLAINT_PRIORITIES, STATUS_LABELS } from '@/lib/validation';
import { PRIORITY_STYLES, STATUS_STYLES, formatDateTime } from '@/lib/utils';

interface Photo {
  id: string;
  url: string;
  fileName: string;
}

interface EventItem {
  id: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: Date;
  actor?: { email: string; role: string } | null;
}

export interface ComplaintDetailData {
  id: string;
  referenceCode: string;
  title: string;
  description: string;
  category: keyof typeof CATEGORY_LABELS;
  priority: (typeof COMPLAINT_PRIORITIES)[number];
  status: keyof typeof STATUS_LABELS;
  areaAddress: string;
  landmark: string | null;
  ward: string | null;
  pincode: string;
  contactNumber: string;
  latitude: number | null;
  longitude: number | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: Photo[];
  events: EventItem[];
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export async function ComplaintDetail({ complaint }: { complaint: ComplaintDetailData }) {
  const t = await getServerDictionary('complaints');
  const mapUrl =
    complaint.latitude != null && complaint.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${complaint.latitude},${complaint.longitude}`
      : null;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-slate-500">{complaint.referenceCode}</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{complaint.title}</h1>
          </div>
          <div className="flex gap-2">
            <Badge className={STATUS_STYLES[complaint.status]}>{STATUS_LABELS[complaint.status]}</Badge>
            <Badge className={PRIORITY_STYLES[complaint.priority]}>{t.priorityLabels[complaint.priority]}</Badge>
          </div>
        </div>

        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{complaint.description}</p>

        <dl className="mt-6">
          <Row label={t.detail.category} value={t.categoryLabels[complaint.category]} />
          <Row label={t.detail.areaAddress} value={complaint.areaAddress} />
          {complaint.landmark && <Row label={t.detail.landmark} value={complaint.landmark} />}
          {complaint.ward && <Row label={t.detail.ward} value={complaint.ward} />}
          <Row label={t.detail.pinCode} value={complaint.pincode} />
          <Row label={t.detail.contact} value={`+91 ${complaint.contactNumber}`} />
          <Row
            label="Geolocation"
            value={
              mapUrl ? (
                <a href={mapUrl} target="_blank" rel="noreferrer noopener" className="font-semibold text-brand-700 underline">
                  {complaint.latitude?.toFixed(5)}, {complaint.longitude?.toFixed(5)} - {t.detail.openMaps}
                </a>
              ) : (
                t.detail.notProvided
              )
            }
          />
          <Row label={t.detail.submitted} value={`${formatDateTime(complaint.createdAt)} IST`} />
          {complaint.resolutionNote && <Row label={t.detail.latestRemark} value={complaint.resolutionNote} />}
        </dl>
      </Card>

      {complaint.photos.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t.detail.photos}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {complaint.photos.map((photo) => (
              <li key={photo.id} className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-slate-200">
                <Image src={photo.url} alt={photo.fileName} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover" unoptimized />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t.detail.timeline}</h2>
        <ol className="mt-4 space-y-4">
          {complaint.events.map((event) => (
            <li key={event.id} className="flex gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-hidden />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {event.fromStatus
                    ? `${STATUS_LABELS[event.fromStatus as keyof typeof STATUS_LABELS]} → ${STATUS_LABELS[event.toStatus as keyof typeof STATUS_LABELS]}`
                    : STATUS_LABELS[event.toStatus as keyof typeof STATUS_LABELS]}
                </p>
                {event.note && <p className="text-sm text-slate-600">{event.note}</p>}
                <p className="text-xs text-slate-500">
                  {formatDateTime(event.createdAt)} IST{event.actor ? ` · ${event.actor.email}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
