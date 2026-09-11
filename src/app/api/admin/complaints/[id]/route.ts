import {
  ApiError,
  assertSameOrigin,
  handleError,
  ok,
  readJson,
} from "@/lib/api";
import { requireStaff } from "@/lib/auth";
import { serialiseComplaint } from "@/lib/complaints";
import { prisma } from "@/lib/db";
import { complaintStatusUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Allowed grievance lifecycle transitions. */
const TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["ACKNOWLEDGED", "IN_PROGRESS", "REJECTED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "REJECTED", "RESOLVED"],
  IN_PROGRESS: ["RESOLVED", "REJECTED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  REJECTED: ["CLOSED"],
  CLOSED: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const session = await requireStaff();
    const { id } = await params;

    const input = complaintStatusUpdateSchema.parse(await readJson(req));
    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) throw new ApiError("Complaint not found.", 404, "NOT_FOUND");

    if (
      existing.status !== input.status &&
      !TRANSITIONS[existing.status]?.includes(input.status)
    ) {
      throw new ApiError(
        `Cannot move a complaint from ${existing.status} to ${input.status}.`,
        422,
        "INVALID_TRANSITION",
      );
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: input.status,
        priority: input.priority ?? existing.priority,
        resolutionNote: input.note || existing.resolutionNote,
        resolvedAt:
          input.status === "RESOLVED" ? new Date() : existing.resolvedAt,
        events: {
          create: {
            actorId: session.sub,
            fromStatus: existing.status,
            toStatus: input.status,
            note: input.note || null,
          },
        },
      },
      include: { photos: true, events: { orderBy: { createdAt: "asc" } } },
    });

    return ok(serialiseComplaint(updated));
  } catch (error) {
    return handleError(error);
  }
}
