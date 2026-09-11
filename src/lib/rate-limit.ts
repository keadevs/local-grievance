import "server-only";

/**
 * Fixed-window in-memory rate limiter.
 *
 * Suitable for a single Node instance. For multi-replica deployments swap the
 * `store` for Redis (INCR + EXPIRE) — the exported API stays identical.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return {
      ok: true,
      limit,
      remaining: limit - 1,
      retryAfterSeconds: windowSeconds,
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    ok: bucket.count <= limit,
    limit,
    remaining,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Best-effort client IP extraction behind a reverse proxy / load balancer. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}
