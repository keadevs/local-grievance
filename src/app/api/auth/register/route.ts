import {
  ApiError,
  assertSameOrigin,
  created,
  enforceRateLimit,
  handleError,
  readJson,
} from "@/lib/api";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { registerSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** MODULE 1 - resident self-registration. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    enforceRateLimit(req, "auth:register", { limit: 5, windowSeconds: 600 });

    const input = registerSchema.parse(await readJson(req));

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { mobile: input.mobile }] },
      select: { email: true, mobile: true },
    });
    if (existingUser) {
      const field =
        existingUser.mobile === input.mobile ? "mobile number" : "email";
      throw new ApiError(
        `An account with this ${field} already exists.`,
        409,
        "DUPLICATE",
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          mobile: input.mobile,
          passwordHash: await hashPassword(input.password),
          role: "RESIDENT",
          resident: {
            create: {
              firstName: input.firstName,
              lastName: input.lastName,
              profilePhoto: input.profilePhoto || null,
              dateOfBirth: input.dateOfBirth
                ? new Date(input.dateOfBirth)
                : null,
              gender: input.gender,
              addressLine: input.addressLine,
              locality: input.locality || null,
              ward: input.ward || null,
              city: input.city,
              state: input.state,
              pincode: input.pincode,
            },
          },
        },
        include: { resident: true },
      });
      return created;
    });

    await createSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: `${user.resident!.firstName} ${user.resident!.lastName}`,
    });

    logger.info({ userId: user.id }, "Resident registered");

    return created({
      id: user.id,
      email: user.email,
      role: user.role,
      name: `${user.resident!.firstName} ${user.resident!.lastName}`,
    });
  } catch (error) {
    return handleError(error);
  }
}
