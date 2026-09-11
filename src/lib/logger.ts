import pino from "pino";

export const logger = pino({
  level:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: { service: "pune-civic-portal" },
  redact: {
    paths: [
      "password",
      "passwordHash",
      "req.headers.authorization",
      "req.headers.cookie",
      "token",
      "META_WHATSAPP_TOKEN",
      "TWILIO_AUTH_TOKEN",
    ],
    censor: "[redacted]",
  },
});
