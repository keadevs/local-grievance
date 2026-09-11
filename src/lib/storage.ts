import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { ApiError } from "@/lib/api";
import { getEnv } from "@/lib/env";

export interface StoredFile {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Content sniffing by magic bytes. The browser-supplied `type` is attacker
 * controlled and must never be trusted for storage decisions.
 */
function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png";
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function safeSegment(name: string): string {
  return path
    .basename(name)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

/**
 * Validates, normalises (EXIF stripped, resized, re-encoded to WebP) and
 * persists an uploaded image.
 */
export async function storeImage(
  file: File,
  folder: "profiles" | "complaints",
): Promise<StoredFile> {
  const env = getEnv();
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

  if (file.size === 0)
    throw new ApiError("Empty file uploaded.", 400, "EMPTY_FILE");
  if (file.size > maxBytes) {
    throw new ApiError(
      `Each image must be ${env.MAX_UPLOAD_MB} MB or smaller.`,
      413,
      "FILE_TOO_LARGE",
    );
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detected = sniffMime(input);
  if (!detected || !ALLOWED.has(detected)) {
    throw new ApiError(
      "Only JPEG, PNG or WebP images are accepted.",
      415,
      "UNSUPPORTED_MEDIA_TYPE",
    );
  }

  // Re-encoding removes EXIF/GPS metadata and any embedded payloads.
  const output = await sharp(input, { failOn: "error" })
    .rotate()
    .resize({
      width: folder === "profiles" ? 512 : 1600,
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const fileName = `${Date.now()}-${randomUUID()}.webp`;
  const relativeDir = path.posix.join(
    folder,
    new Date().toISOString().slice(0, 7),
  );
  const targetDir = path.resolve(env.STORAGE_LOCAL_DIR, relativeDir);

  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, fileName), output, { mode: 0o640 });

  return {
    url: `/api/files/${relativeDir}/${fileName}`,
    fileName: safeSegment(file.name) || fileName,
    mimeType: "image/webp",
    sizeBytes: output.byteLength,
  };
}

/**
 * Resolves a public file URL segment to an absolute path, refusing any attempt
 * to escape the storage root (path traversal).
 */
export function resolveStoredPath(segments: string[]): string {
  const env = getEnv();
  const root = path.resolve(env.STORAGE_LOCAL_DIR);
  const target = path.resolve(root, ...segments.map(safeSegment));
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new ApiError("Invalid file path.", 400, "INVALID_PATH");
  }
  return target;
}
