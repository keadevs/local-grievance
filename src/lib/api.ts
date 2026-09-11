import "server-only";

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthError } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export interface ApiErrorBody {
  error: { code: string; message: string; details?: Record<string, string[]> };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function failure(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>,
) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, details } },
    { status },
  );
}

/**
 * Converts any thrown value into a safe JSON response. Internal details are
 * logged but never leaked to the client.
 */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return failure(
      "VALIDATION_ERROR",
      "Please correct the highlighted fields.",
      422,
      error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  if (error instanceof AuthError) {
    return failure("UNAUTHORIZED", error.message, error.status);
  }
  if (error instanceof ApiError) {
    return failure(error.code, error.message, error.status);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const targetValue = error.meta?.target;
      const target = Array.isArray(targetValue)
        ? targetValue.join(", ")
        : typeof targetValue === "string"
          ? targetValue
          : "field";
      return failure(
        "DUPLICATE",
        `An account with this ${target} already exists.`,
        409,
      );
    }
    if (error.code === "P2025") {
      return failure("NOT_FOUND", "The requested record was not found.", 404);
    }
  }
  logger.error({ err: error }, "Unhandled API error");
  return failure(
    "INTERNAL_ERROR",
    "Something went wrong. Please try again later.",
    500,
  );
}

/** Rejects cross-site state-changing requests (CSRF defence-in-depth). */
export function assertSameOrigin(req: Request) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (server-to-server) carry no Origin

  const allowed = new Set([getEnv().APP_URL, new URL(req.url).origin]);
  if (!allowed.has(origin)) {
    throw new ApiError(
      "Cross-origin request blocked.",
      403,
      "FORBIDDEN_ORIGIN",
    );
  }
}

export function enforceRateLimit(
  req: Request,
  scope: string,
  overrides?: { limit?: number; windowSeconds?: number },
) {
  const env = getEnv();
  const limit = overrides?.limit ?? env.RATE_LIMIT_MAX_REQUESTS;
  const windowSeconds =
    overrides?.windowSeconds ?? env.RATE_LIMIT_WINDOW_SECONDS;
  const result = rateLimit(`${scope}:${clientIp(req)}`, limit, windowSeconds);
  if (!result.ok) {
    throw new ApiError(
      `Too many requests. Retry in ${result.retryAfterSeconds}s.`,
      429,
      "RATE_LIMITED",
    );
  }
}

/** Parses JSON bodies with a hard size guard. */
export async function readJson(req: Request): Promise<unknown> {
  const raw = await req.text();
  if (raw.length > 256_000) {
    throw new ApiError("Request payload too large.", 413, "PAYLOAD_TOO_LARGE");
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new ApiError("Malformed JSON body.", 400, "INVALID_JSON");
  }
}
