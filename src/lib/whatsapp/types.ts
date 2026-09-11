import type { ComplaintAlert } from "@/lib/whatsapp/message";

export interface SendResult {
  providerRef: string | null;
  raw?: unknown;
}

export interface WhatsAppProvider {
  readonly name: string;
  send(to: string, alert: ComplaintAlert): Promise<SendResult>;
}

export class WhatsAppSendError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "WhatsAppSendError";
  }
}
