import { assertSameOrigin, handleError, ok } from "@/lib/api";
import { destroySessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await destroySessionCookie();
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
