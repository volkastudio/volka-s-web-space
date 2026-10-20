/**
 * Pure helpers for the inquiry pipeline: anti-spam checks, rate-limit maths,
 * IP hashing and text sanitising. No server-only imports, so these are safe to
 * unit-test and to bundle anywhere.
 */

/** A human takes longer than this to fill in the brief. */
export const MIN_FILL_MS = 3_000;
/** Max briefs accepted from one hashed IP inside the window. */
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
/** Identical email + vision inside this window is treated as a double-submit. */
export const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

/** The honeypot field must stay empty. */
export function isHoneypotFilled(website: string | undefined): boolean {
  return (website ?? "").trim().length > 0;
}

/**
 * True when the form was submitted faster than a person could manage, or when
 * the timing field is missing altogether (the real form always sends it).
 */
export function isTooFast(elapsedMs: number | undefined, minMs: number = MIN_FILL_MS): boolean {
  if (elapsedMs === undefined) return true;
  return elapsedMs < minMs;
}

export function isRateLimited(recentCount: number, max: number = RATE_LIMIT_MAX): boolean {
  return recentCount >= max;
}

/** First address in x-forwarded-for, else x-real-ip, else "unknown". */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** sha256(ip + salt) as hex. The raw IP is never stored. */
export async function hashIp(ip: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${ip}|${salt}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Remove CR/LF so visitor-supplied text can never inject extra mail headers. */
export function stripLineBreaks(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}
