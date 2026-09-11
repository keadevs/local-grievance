import { z } from "zod";

/**
 * Centralised, fail-fast environment validation.
 * Importing this module anywhere on the server guarantees configuration sanity
 * before a single request is served.
 */
const booleanish = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_NAME: z.string().min(1).default("Pune Civic Portal"),
    APP_URL: z.string().url().default("http://localhost:3000"),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    AUTH_SECRET: z
      .string()
      .min(32, "AUTH_SECRET must be at least 32 characters"),
    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(12),

    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    STORAGE_LOCAL_DIR: z.string().default("./storage/uploads"),
    MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(25).default(8),

    SOCIAL_WORKER_WHATSAPP: z
      .string()
      .regex(
        /^\d{10,15}$/,
        "SOCIAL_WORKER_WHATSAPP must be digits only in E.164 form, e.g. 919812345678",
      ),
    WHATSAPP_PROVIDER: z.enum(["meta", "twilio", "console"]).default("console"),

    META_WHATSAPP_TOKEN: z.string().optional(),
    META_WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    META_GRAPH_VERSION: z.string().default("v21.0"),
    META_WHATSAPP_TEMPLATE_NAME: z.string().default("civic_complaint_alert"),
    META_WHATSAPP_TEMPLATE_LANG: z.string().default("en"),
    META_WHATSAPP_VERIFY_TOKEN: z.string().optional(),
    META_WHATSAPP_APP_SECRET: z.string().optional(),

    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_WHATSAPP_FROM: z.string().optional(),

    RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).default(60),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(60),

    DISABLE_ENV_VALIDATION: booleanish,
  })
  .superRefine((cfg, ctx) => {
    if (cfg.WHATSAPP_PROVIDER === "meta") {
      if (!cfg.META_WHATSAPP_TOKEN || !cfg.META_WHATSAPP_PHONE_NUMBER_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID are required when WHATSAPP_PROVIDER=meta",
        });
      }
    }
    if (cfg.WHATSAPP_PROVIDER === "twilio") {
      if (
        !cfg.TWILIO_ACCOUNT_SID ||
        !cfg.TWILIO_AUTH_TOKEN ||
        !cfg.TWILIO_WHATSAPP_FROM
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM are required when WHATSAPP_PROVIDER=twilio",
        });
      }
    }
    if (cfg.NODE_ENV === "production" && cfg.WHATSAPP_PROVIDER === "console") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "WHATSAPP_PROVIDER=console is a development stub and must not be used in production",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

function load(): AppEnv {
  // `next build` collects page data without a real environment; allow an opt-out.
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "env"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cached) cached = load();
  return cached;
}

export const isProduction = () => process.env.NODE_ENV === "production";
