import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  buildTemplateParams,
  buildTextMessage,
  type ComplaintAlert,
} from "@/lib/whatsapp/message";
import {
  WhatsAppSendError,
  type SendResult,
  type WhatsAppProvider,
} from "@/lib/whatsapp/types";

const TIMEOUT_MS = 15_000;

async function post(
  url: string,
  init: RequestInit,
): Promise<{ status: number; body: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }
    return { status: res.status, body };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new WhatsAppSendError("WhatsApp provider timed out", true);
    }
    throw new WhatsAppSendError(
      "Network failure contacting WhatsApp provider",
      true,
      err,
    );
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Meta WhatsApp Cloud API                                             */
/* ------------------------------------------------------------------ */

export class MetaWhatsAppProvider implements WhatsAppProvider {
  readonly name = "meta";

  private endpoint(): string {
    const env = getEnv();
    return `https://graph.facebook.com/${env.META_GRAPH_VERSION}/${env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`;
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${getEnv().META_WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };
  }

  async send(to: string, alert: ComplaintAlert): Promise<SendResult> {
    const env = getEnv();

    // Business-initiated messages outside the 24h service window must use an
    // approved template; free-form text is attempted only as a fallback.
    const templatePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: env.META_WHATSAPP_TEMPLATE_NAME,
        language: { code: env.META_WHATSAPP_TEMPLATE_LANG },
        components: [
          {
            type: "body",
            parameters: buildTemplateParams(alert).map((text) => ({
              type: "text",
              text,
            })),
          },
        ],
      },
    };

    const first = await post(this.endpoint(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(templatePayload),
    });

    if (first.status < 300) {
      return {
        providerRef: first.body?.messages?.[0]?.id ?? null,
        raw: first.body,
      };
    }

    logger.warn(
      { status: first.status, body: first.body },
      "WhatsApp template send failed, attempting free-form fallback",
    );

    const fallback = await post(this.endpoint(), {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: true, body: buildTextMessage(alert) },
      }),
    });

    if (fallback.status < 300) {
      return {
        providerRef: fallback.body?.messages?.[0]?.id ?? null,
        raw: fallback.body,
      };
    }

    const message =
      fallback.body?.error?.message ??
      first.body?.error?.message ??
      "Unknown WhatsApp API error";
    throw new WhatsAppSendError(
      message,
      fallback.status >= 500 || fallback.status === 429,
      {
        template: first.body,
        text: fallback.body,
      },
    );
  }
}

/* ------------------------------------------------------------------ */
/* Twilio WhatsApp                                                     */
/* ------------------------------------------------------------------ */

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  readonly name = "twilio";

  async send(to: string, alert: ComplaintAlert): Promise<SendResult> {
    const env = getEnv();
    const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
    const params = new URLSearchParams({
      From: env.TWILIO_WHATSAPP_FROM!,
      To: `whatsapp:+${to}`,
      Body: buildTextMessage(alert),
    });

    const res = await post(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (res.status < 300) {
      return { providerRef: res.body?.sid ?? null, raw: res.body };
    }
    throw new WhatsAppSendError(
      res.body?.message ?? "Twilio send failed",
      res.status >= 500 || res.status === 429,
      res.body,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Console (local development only)                                    */
/* ------------------------------------------------------------------ */

export class ConsoleWhatsAppProvider implements WhatsAppProvider {
  readonly name = "console";

  async send(to: string, alert: ComplaintAlert): Promise<SendResult> {
    logger.info(
      { to, message: buildTextMessage(alert) },
      "WhatsApp (console provider) message",
    );
    return { providerRef: `console-${alert.referenceCode}` };
  }
}

export function resolveProvider(): WhatsAppProvider {
  switch (getEnv().WHATSAPP_PROVIDER) {
    case "meta":
      return new MetaWhatsAppProvider();
    case "twilio":
      return new TwilioWhatsAppProvider();
    default:
      return new ConsoleWhatsAppProvider();
  }
}
