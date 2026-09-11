import {
  assertSameOrigin,
  enforceRateLimit,
  handleError,
  ok,
  readJson,
} from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** MODULE 1 - read the signed-in resident's profile. */
export async function GET() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        mobile: true,
        role: true,
        createdAt: true,
        resident: true,
      },
    });
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

/** MODULE 1 - update profile details. */
export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireSession();
    enforceRateLimit(req, "profile:update", { limit: 20, windowSeconds: 300 });

    const input = profileUpdateSchema.parse(await readJson(req));

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.sub },
        data: { mobile: input.mobile },
      });
      return tx.resident.upsert({
        where: { userId: session.sub },
        update: {
          firstName: input.firstName,
          lastName: input.lastName,
          profilePhoto: input.profilePhoto || null,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          gender: input.gender,
          addressLine: input.addressLine,
          locality: input.locality || null,
          ward: input.ward || null,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
        },
        create: {
          userId: session.sub,
          firstName: input.firstName,
          lastName: input.lastName,
          profilePhoto: input.profilePhoto || null,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          gender: input.gender,
          addressLine: input.addressLine,
          locality: input.locality || null,
          ward: input.ward || null,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
        },
      });
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
