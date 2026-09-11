import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-runtime safe session primitives (no Node built-ins, no Prisma) so that
 * `middleware.ts` can validate sessions without a database round-trip.
 */
export const SESSION_COOKIE = "pcp_session";

export type Role = "RESIDENT" | "SOCIAL_WORKER" | "ADMIN";

export interface SessionPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
}

const ISSUER = "pune-civic-portal";
const AUDIENCE = "pune-civic-portal:web";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short (min 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

export function sessionTtlSeconds(): number {
  const hours = Number(process.env.SESSION_TTL_HOURS ?? 12);
  return (Number.isFinite(hours) && hours > 0 ? hours : 12) * 3600;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const ttl = sessionTtlSeconds();
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.role !== "string") return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      role: payload.role as Role,
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

export const isStaff = (role: Role) =>
  role === "ADMIN" || role === "SOCIAL_WORKER";
