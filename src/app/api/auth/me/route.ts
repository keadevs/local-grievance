import { handleError, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ok(null);
    return ok({
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      profile: user.resident,
    });
  } catch (error) {
    return handleError(error);
  }
}
