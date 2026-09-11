import { createHmac, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Meta webhook subscription handshake. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = getEnv().META_WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function signatureValid(
  rawBody: string,
  header: string | null,
  appSecret: string,
): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const digest = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const received = Buffer.from(header.slice(7), "utf8");
  const computed = Buffer.from(digest, "utf8");
  return (
    received.length === computed.length && timingSafeEqual(received, computed)
  );
}

/**
 * Receives delivery receipts (sent / delivered / read / failed) and keeps the
 * notification ledger in sync.
 */
export async function POST(req: Request) {
  const env = getEnv();
  const rawBody = await req.text();

  if (!env.META_WHATSAPP_APP_SECRET) {
    logger.warn(
      "Webhook received but META_WHATSAPP_APP_SECRET is not configured; rejecting",
    );
    return new Response("Forbidden", { status: 403 });
  }
  if (
    !signatureValid(
      rawBody,
      req.headers.get("x-hub-signature-256"),
      env.META_WHATSAPP_APP_SECRET,
    )
  ) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    const statuses =
      body?.entry
        ?.flatMap((e: any) => e?.changes ?? [])
        .flatMap((c: any) => c?.value?.statuses ?? []) ?? [];

    for (const s of statuses) {
      if (!s?.id) continue;
      await prisma.notificationLog.updateMany({
        where: { providerRef: s.id },
        data: {
          status: s.status === "failed" ? "FAILED" : "SENT",
          error: s.errors?.[0]?.title ?? null,
        },
      });
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to process WhatsApp webhook");
  }

  // Always 200 so Meta does not disable the subscription.
  return new Response("OK", { status: 200 });
}
