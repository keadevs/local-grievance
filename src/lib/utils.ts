import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function relativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  const rtf = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(-Math.round(diff / ms), unit);
  }
  return "just now";
}

export const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-sky-100 text-sky-800 ring-sky-600/20",
  ACKNOWLEDGED: "bg-indigo-100 text-indigo-800 ring-indigo-600/20",
  IN_PROGRESS: "bg-amber-100 text-amber-800 ring-amber-600/20",
  RESOLVED: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  REJECTED: "bg-rose-100 text-rose-800 ring-rose-600/20",
  CLOSED: "bg-slate-200 text-slate-700 ring-slate-600/20",
};

export const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-600/20",
  MEDIUM: "bg-blue-100 text-blue-800 ring-blue-600/20",
  HIGH: "bg-orange-100 text-orange-800 ring-orange-600/20",
  CRITICAL: "bg-red-100 text-red-800 ring-red-600/20",
};

/** Reads the standard `{ data }` / `{ error }` API envelope. */
export async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, {
    credentials: "same-origin",
    ...init,
    headers:
      init?.body instanceof FormData
        ? init?.headers
        : { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error?.message ?? "Request failed") as Error & {
      details?: Record<string, string[]>;
      code?: string;
    };
    err.details = json?.error?.details;
    err.code = json?.error?.code;
    throw err;
  }
  return json.data as T;
}
