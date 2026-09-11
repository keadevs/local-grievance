import { ApiError, handleError, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { serialiseComplaint } from "@/lib/complaints";
import { prisma } from "@/lib/db";
import { isStaff } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        photos: true,
        events: {
          orderBy: { createdAt: "asc" },
          include: { actor: { select: { email: true, role: true } } },
        },
      },
    });

    if (!complaint)
      throw new ApiError("Complaint not found.", 404, "NOT_FOUND");

    // Object-level authorisation: residents may only read their own records.
    if (complaint.residentId !== session.sub && !isStaff(session.role)) {
      throw new ApiError("Complaint not found.", 404, "NOT_FOUND");
    }

    return ok(serialiseComplaint(complaint));
  } catch (error) {
    return handleError(error);
  }
}
