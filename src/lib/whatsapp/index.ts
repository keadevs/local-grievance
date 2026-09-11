import "server-only";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { buildTextMessage, type ComplaintAlert } from "@/lib/whatsapp/message";
import { resolveProvider } from "@/lib/whatsapp/providers";
import { WhatsAppSendError } from "@/lib/whatsapp/types";

export type { ComplaintAlert } from "@/lib/whatsapp/message";

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 800;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * MODULE 3 - delivers a complaint alert to the social worker's WhatsApp number
 * and records every attempt in the `notification_logs` ledger.
 *
 * Never throws: complaint submission must succeed even when the messaging
 * provider is degraded. Failed rows stay in `PENDING`/`FAILED` for retry.
 */
export async function dispatchComplaintAlert(
  complaintId: string,
  alert: ComplaintAlert,
): Promise<void> {
  const env = getEnv();
  const provider = resolveProvider();
  const recipient = env.SOCIAL_WORKER_WHATSAPP;

  const log = await prisma.notificationLog.create({
    data: {
      complaintId,
      channel: "WHATSAPP",
      provider: provider.name,
      recipient,
      status: "PENDING",
      payload: buildTextMessage(alert).slice(0, 6000),
    },
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await provider.send(recipient, alert);
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: "SENT",
          providerRef: result.providerRef,
          attempts: attempt,
          sentAt: new Date(),
          error: null,
        },
      });
      logger.info(
        { complaintId, providerRef: result.providerRef, attempt },
        "WhatsApp alert delivered",
      );
      return;
    } catch (error) {
      const retryable =
        error instanceof WhatsAppSendError ? error.retryable : true;
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { complaintId, attempt, retryable, err: message },
        "WhatsApp alert failed",
      );

      const isLast = attempt === MAX_ATTEMPTS || !retryable;
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: isLast ? "FAILED" : "PENDING",
          attempts: attempt,
          error: message.slice(0, 2000),
        },
      });
      if (isLast) return;
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
    }
  }
}

/** Re-sends a previously failed notification (used by the admin console). */
export async function retryNotification(
  notificationId: string,
): Promise<boolean> {
  const log = await prisma.notificationLog.findUnique({
    where: { id: notificationId },
    include: {
      complaint: {
        include: { photos: true, resident: { include: { resident: true } } },
      },
    },
  });
  if (!log?.complaint) return false;

  const c = log.complaint;
  const alert: ComplaintAlert = {
    referenceCode: c.referenceCode,
    title: c.title,
    description: c.description,
    category: c.category,
    priority: c.priority,
    areaAddress: c.areaAddress,
    landmark: c.landmark,
    ward: c.ward,
    pincode: c.pincode,
    contactNumber: c.contactNumber,
    residentName: c.resident.resident
      ? `${c.resident.resident.firstName} ${c.resident.resident.lastName}`
      : c.resident.email,
    residentEmail: c.resident.email,
    latitude: c.latitude ? Number(c.latitude) : null,
    longitude: c.longitude ? Number(c.longitude) : null,
    photoUrls: c.photos.map((p) => p.url),
    portalUrl: `${getEnv().APP_URL}/admin/complaints/${c.id}`,
    submittedAt: c.createdAt,
  };

  await dispatchComplaintAlert(c.id, alert);
  return true;
}
