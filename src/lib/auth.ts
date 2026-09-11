import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  sessionTtlSeconds,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/session";

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const hashPassword = (plain: string) =>
  bcrypt.hash(plain, BCRYPT_ROUNDS);
export const verifyPassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);

export async function createSessionCookie(
  payload: SessionPayload,
): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds(),
  });
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Throws when there is no valid session. Use inside API route handlers. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("Authentication required", 401);
  return session;
}

export async function requireStaff(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "ADMIN" && session.role !== "SOCIAL_WORKER") {
    throw new AuthError(
      "You do not have permission to perform this action",
      403,
    );
  }
  return session;
}

/** Loads the full user record for the active session; null when deactivated. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { resident: true },
  });
  if (!user || !user.isActive) return null;
  return user;
}

export function assertNotLocked(user: { lockedUntil: Date | null }) {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new AuthError(
      `Account temporarily locked. Try again in ${mins} minute(s).`,
      423,
    );
  }
}

export async function registerFailedLogin(
  userId: string,
  currentFailures: number,
): Promise<void> {
  const failed = currentFailures + 1;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLogins: failed,
      lockedUntil:
        failed >= MAX_FAILED_LOGINS
          ? new Date(Date.now() + LOCK_MINUTES * 60_000)
          : null,
    },
  });
}

export async function registerSuccessfulLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
}
