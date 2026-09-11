import {
  ApiError,
  assertSameOrigin,
  enforceRateLimit,
  handleError,
  ok,
  readJson,
} from "@/lib/api";
import {
  assertNotLocked,
  createSessionCookie,
  registerFailedLogin,
  registerSuccessfulLogin,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Constant-ish work factor for unknown accounts to blunt user enumeration timing.
const DUMMY_HASH =
  "$2a$12$C6UzMDM.H6dfI/f/IKcEeO1vZ7oKrPPl6aXA2qCPGf4nJrCq9m5Pq";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    enforceRateLimit(req, "auth:login", { limit: 10, windowSeconds: 300 });

    const { email, password } = loginSchema.parse(await readJson(req));
    const user = await prisma.user.findUnique({
      where: { email },
      include: { resident: true },
    });

    if (!user) {
      await verifyPassword(password, DUMMY_HASH);
      throw new ApiError(
        "Invalid email or password.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    assertNotLocked(user);

    if (!user.isActive) {
      throw new ApiError(
        "This account has been deactivated. Contact the ward office.",
        403,
        "ACCOUNT_DISABLED",
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await registerFailedLogin(user.id, user.failedLogins);
      throw new ApiError(
        "Invalid email or password.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    await registerSuccessfulLogin(user.id);

    const name = user.resident
      ? `${user.resident.firstName} ${user.resident.lastName}`
      : user.email;
    await createSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role,
      name,
    });

    return ok({ id: user.id, email: user.email, role: user.role, name });
  } catch (error) {
    return handleError(error);
  }
}
