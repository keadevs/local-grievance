import {
  ApiError,
  assertSameOrigin,
  created,
  enforceRateLimit,
  handleError,
} from "@/lib/api";
import { getSession } from "@/lib/auth";
import { storeImage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FOLDERS = new Set(["profiles", "complaints"]);

/**
 * Image upload endpoint. `profiles` is open to unauthenticated visitors because
 * the registration form runs before a session exists; it is rate limited hard.
 */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);

    const form = await req.formData();
    const folder = String(form.get("folder") ?? "complaints");
    if (!FOLDERS.has(folder))
      throw new ApiError("Unknown upload target.", 400, "INVALID_FOLDER");

    const session = await getSession();
    if (folder === "complaints" && !session) {
      throw new ApiError("Authentication required.", 401, "UNAUTHORIZED");
    }
    enforceRateLimit(req, `upload:${folder}`, {
      limit: session ? 40 : 6,
      windowSeconds: 600,
    });

    const files = form
      .getAll("files")
      .filter((f): f is File => f instanceof File);
    if (files.length === 0)
      throw new ApiError("No files received.", 400, "NO_FILES");
    if (files.length > 5)
      throw new ApiError(
        "Upload at most 5 images at a time.",
        400,
        "TOO_MANY_FILES",
      );

    const stored = [];
    for (const file of files) {
      stored.push(await storeImage(file, folder as "profiles" | "complaints"));
    }

    return created({ files: stored });
  } catch (error) {
    return handleError(error);
  }
}
