import {
  ApiError,
  assertSameOrigin,
  enforceRateLimit,
  handleError,
  ok,
} from "@/lib/api";
import { requireStaff } from "@/lib/auth";
import { retryNotification } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Manually re-drive a failed WhatsApp alert. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    await requireStaff();
    enforceRateLimit(req, "notifications:retry", {
      limit: 20,
      windowSeconds: 300,
    });

    const { id } = await params;
    const done = await retryNotification(id);
    if (!done) throw new ApiError("Notification not found.", 404, "NOT_FOUND");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
