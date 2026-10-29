import { z } from "zod";
import { ALLOWED_EVENT_NAMES, type AnalyticsEventName } from "./types";

/**
 * Path regex: allow relative paths starting with /, only alphanumeric, -, _, /, .
 * Maximum 200 characters to prevent buffer attacks.
 */
export const SAFE_PATH_REGEX = /^\/[a-zA-Z0-9\-_./]*$/;

/**
 * Known bot user-agents regex to filter out automated crawlers without storing visits.
 */
export const BOT_UA_REGEX =
  /(bot|spider|crawl|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|linkedinbot|embedly|quora link preview|pinterest|slackbot|googlebot|bingbot|yandex|baiduspider|duckduckbot|ahrefsbot|semrushbot|petalbot|bytespider|gptbot|claudebot)/i;

/**
 * Zod schema for incoming tracking event payload.
 */
export const ClientEventSchema = z.object({
  eventName: z.enum(ALLOWED_EVENT_NAMES),
  path: z
    .string()
    .min(1)
    .max(200)
    .refine((val) => SAFE_PATH_REGEX.test(val), {
      message: "Invalid path format",
    }),
  entityType: z.enum(["post", "case", "sales", "audit", "general"]).optional(),
  entityId: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  referrer: z.string().max(300).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  locale: z.enum(["fr", "en"]).optional(),
  durationSeconds: z.number().int().min(0).max(86400).optional().default(0),
  scrollDepth: z.number().int().min(0).max(100).optional().default(0),
  sessionId: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export type ValidatedClientEvent = z.infer<typeof ClientEventSchema>;

/**
 * Detects whether a User-Agent belongs to a known automated bot.
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim() === "") return false;
  return BOT_UA_REGEX.test(userAgent);
}

/**
 * Detects device class: 'mobile' | 'tablet' | 'desktop'
 */
export function detectDeviceClass(userAgent: string | null | undefined): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Detects browser family: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Other'
 */
export function detectBrowserFamily(userAgent: string | null | undefined): string {
  if (!userAgent) return "Other";
  const ua = userAgent;
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  if (/Firefox\//i.test(ua)) return "Firefox";
  return "Other";
}

/**
 * Computes anonymous daily visitor hash per D18:
 * sha256(IP + user-agent + date + secret)
 * Rotates daily, never stores IP, cannot be reversed.
 */
export async function computeDailyVisitorHash(
  ip: string,
  userAgent: string,
  dateStr: string,
  secret: string,
): Promise<string> {
  const enc = new TextEncoder();
  const rawInput = `${ip.trim()}|${userAgent.trim()}|${dateStr}|${secret}`;
  const buffer = await crypto.subtle.digest("SHA-256", enc.encode(rawInput));
  const hashArr = Array.from(new Uint8Array(buffer));
  return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Evaluates whether an article or case study view qualifies as a "Read" per Decision D17:
 * "Scrolled past ~70% of the article AND the tab was visible for at least min(30 s, 40% of estimated reading time)"
 *
 * @param scrollDepth - Max scroll reached as percentage (0-100)
 * @param visibleDurationSeconds - Total active time the tab was visible and focused (seconds)
 * @param estimatedReadingMinutes - Author or calculated reading time (minutes, e.g. 5)
 */
export function isReadQualified(
  scrollDepth: number,
  visibleDurationSeconds: number,
  estimatedReadingMinutes: number,
): boolean {
  if (scrollDepth < 70) return false;
  const estimatedSeconds = Math.max(1, estimatedReadingMinutes) * 60;
  const requiredTimeSeconds = Math.min(30, estimatedSeconds * 0.4);
  return visibleDurationSeconds >= requiredTimeSeconds;
}

