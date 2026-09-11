import { CATEGORY_LABELS } from "@/lib/validation";

export interface ComplaintAlert {
  referenceCode: string;
  title: string;
  description: string;
  category: keyof typeof CATEGORY_LABELS;
  priority: string;
  areaAddress: string;
  landmark?: string | null;
  ward?: string | null;
  pincode: string;
  contactNumber: string;
  residentName: string;
  residentEmail: string;
  latitude?: number | null;
  longitude?: number | null;
  photoUrls: string[];
  portalUrl: string;
  submittedAt: Date;
}

const IST = "Asia/Kolkata";

export function formatIst(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: IST,
  }).format(date);
}

export function mapsLink(
  lat?: number | null,
  lng?: number | null,
): string | null {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/** Template parameters may not contain newlines or tabs (Meta Cloud API rule). */
export function sanitiseParam(value: string, max = 900): string {
  return (
    value
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, max) || "-"
  );
}

/** Human-readable free-form message used inside the 24-hour service window. */
export function buildTextMessage(alert: ComplaintAlert): string {
  const map = mapsLink(alert.latitude, alert.longitude);
  const lines = [
    "*NEW CIVIC COMPLAINT*",
    `Ref: *${alert.referenceCode}*`,
    "",
    `*Title:* ${alert.title}`,
    `*Category:* ${CATEGORY_LABELS[alert.category] ?? alert.category}`,
    `*Priority:* ${alert.priority}`,
    "",
    `*Description:*`,
    alert.description.slice(0, 900),
    "",
    `*Location:* ${alert.areaAddress}`,
    alert.landmark ? `*Landmark:* ${alert.landmark}` : null,
    alert.ward ? `*Ward:* ${alert.ward}` : null,
    `*PIN:* ${alert.pincode}`,
    map ? `*Map:* ${map}` : null,
    "",
    `*Resident:* ${alert.residentName}`,
    `*Contact:* +91${alert.contactNumber}`,
    `*Email:* ${alert.residentEmail}`,
    alert.photoUrls.length
      ? `*Photos:* ${alert.photoUrls.length} attached`
      : null,
    "",
    `*Submitted:* ${formatIst(alert.submittedAt)} IST`,
    `Open: ${alert.portalUrl}`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

/**
 * Ordered body parameters for the approved `civic_complaint_alert` template.
 * See README for the exact template body that must be registered with Meta.
 */
export function buildTemplateParams(alert: ComplaintAlert): string[] {
  const map = mapsLink(alert.latitude, alert.longitude);
  return [
    sanitiseParam(alert.referenceCode, 32),
    sanitiseParam(CATEGORY_LABELS[alert.category] ?? alert.category, 60),
    sanitiseParam(alert.title, 140),
    sanitiseParam(alert.description, 500),
    sanitiseParam(
      `${alert.areaAddress}${alert.landmark ? `, near ${alert.landmark}` : ""} - ${alert.pincode}`,
      220,
    ),
    sanitiseParam(`${alert.residentName} (+91${alert.contactNumber})`, 120),
    sanitiseParam(map ?? alert.portalUrl, 220),
  ];
}
