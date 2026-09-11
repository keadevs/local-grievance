import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { handleError } from "@/lib/api";
import { resolveStoredPath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Streams locally stored images. Only WebP files are ever written by the app. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await params;
    const filePath = resolveStoredPath(segments);

    const info = await stat(filePath).catch(() => null);
    if (!info?.isFile()) {
      return new Response("Not found", { status: 404 });
    }

    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(info.size),
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
