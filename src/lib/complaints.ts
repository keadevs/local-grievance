import "server-only";

import { randomInt } from "node:crypto";

import type { Complaint, ComplaintPhoto } from "@prisma/client";

/** Human-friendly, collision-resistant public reference: PCP-YYMMDD-XXXXXX */
export function generateReferenceCode(): string {
  const now = new Date();
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let suffix = "";
  for (let i = 0; i < 6; i += 1) suffix += alphabet[randomInt(alphabet.length)];
  return `PCP-${ymd}-${suffix}`;
}

type ComplaintWithPhotos = Complaint & { photos?: ComplaintPhoto[] };

/** Prisma `Decimal` is not JSON-serialisable; normalise before responding. */
export function serialiseComplaint(complaint: ComplaintWithPhotos) {
  return {
    ...complaint,
    latitude: complaint.latitude ? Number(complaint.latitude) : null,
    longitude: complaint.longitude ? Number(complaint.longitude) : null,
  };
}
