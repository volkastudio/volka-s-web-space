import {
  ClientEventSchema,
  computeDailyVisitorHash,
  detectBrowserFamily,
  detectDeviceClass,
  isBotUserAgent,
  SAFE_PATH_REGEX,
} from "./schema";
import { logSecurityEvent } from "@/lib/admin/security.server";

// 1x1 transparent GIF buffer for <noscript> pixel support
const TRANSPARENT_1X1_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
]);

// In-memory sliding rate limiter: ipHash -> timestamps array (retains 1 minute)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX_PER_MINUTE = 120;

function isRateLimited(ipHash: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const timestamps = rateLimitMap.get(ipHash) ?? [];
  const validTimestamps = timestamps.filter((t) => t > windowStart);
  if (validTimestamps.length >= RATE_LIMIT_MAX_PER_MINUTE) {
    return true;
  }
  validTimestamps.push(now);
  rateLimitMap.set(ipHash, validTimestamps);

  // Periodically trim map size if needed
  if (rateLimitMap.size > 10_000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.every((t) => t <= windowStart)) {
        rateLimitMap.delete(k);
      }
    }
  }
  return false;
}

function getClientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

function getClientCountry(headers: Headers): string | null {
  return (
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code") ??
    null
  );
}

/**
 * Validates Origin or Referer to ensure incoming beacons come from our domain.
 */
function isAllowedOrigin(originHeader: string | null, refererHeader: string | null): boolean {
  const check = (val: string | null) => {
    if (!val) return true; // Direct beacons sometimes omit Origin
    try {
      const parsed = new URL(val);
      const host = parsed.hostname;
      return (
        host === "volkastudio.com" ||
        host.endsWith(".volkastudio.com") ||
        host === "localhost" ||
        host === "127.0.0.1"
      );
    } catch {
      return false;
    }
  };

  return check(originHeader) && check(refererHeader);
}

/**
 * Extracts referrer host cleanly.
 */
function extractReferrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Handles incoming analytics ingest requests (/api/m).
 * Returns 204 No Content on POST, or 1x1 transparent GIF on GET.
 */
export async function handleAnalyticsIngest(request: Request): Promise<Response> {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  // Handle <noscript> tracking pixel (GET)
  if (method === "GET") {
    const rawPath = url.searchParams.get("p") || "/";
    const safePath = SAFE_PATH_REGEX.test(rawPath) ? rawPath : "/";
    const headers = request.headers;
    const ip = getClientIp(headers);
    const userAgent = headers.get("user-agent") ?? "";

    // Ignore known bots
    if (!isBotUserAgent(userAgent)) {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const salt = process.env["SECRET_SALT"] || process.env["ANALYTICS_SALT"] || "volka-salt-default";
        const visitorHash = await computeDailyVisitorHash(ip, userAgent, todayStr, salt);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        await supabaseAdmin.from("site_events").insert({
          event_name: "pageview",
          path: safePath,
          visitor_hash: visitorHash,
          device_class: detectDeviceClass(userAgent),
          browser_family: detectBrowserFamily(userAgent),
          country: getClientCountry(headers),
          source: url.searchParams.get("src") ?? "no-js",
          metadata: { noScriptPixel: true },
        });
      } catch (err) {
        console.error("[AnalyticsIngest] Pixel insert error:", err);
      }
    }

    return new Response(TRANSPARENT_1X1_GIF, {
      status: 200,
      headers: {
        "content-type": "image/gif",
        "cache-control": "no-store, no-cache, must-revalidate, private",
      },
    });
  }

  // Handle beacon tracking (POST)
  if (method !== "POST") {
    return new Response(null, { status: 405 });
  }

  const headers = request.headers;

  // D18: Respect Do Not Track and Global Privacy Control signals
  const dnt = headers.get("dnt");
  const secGpc = headers.get("sec-gpc");
  if (dnt === "1" || secGpc === "1") {
    // Respect user privacy by returning 204 immediately without tracking
    return new Response(null, { status: 204 });
  }

  const userAgent = headers.get("user-agent") ?? "";
  // Ignore known search bots / crawlers
  if (isBotUserAgent(userAgent)) {
    return new Response(null, { status: 204 });
  }

  // Check Origin / Referer
  const origin = headers.get("origin");
  const referer = headers.get("referer");
  if (!isAllowedOrigin(origin, referer)) {
    await logSecurityEvent({
      type: "analytics_forbidden_origin",
      severity: "warning",
      path: "/api/m",
      details: { origin, referer },
    });
    return new Response(null, { status: 403 });
  }

  const ip = getClientIp(headers);
  const salt = process.env["SECRET_SALT"] || process.env["ANALYTICS_SALT"] || "volka-salt-default";
  const todayStr = new Date().toISOString().slice(0, 10);
  const visitorHash = await computeDailyVisitorHash(ip, userAgent, todayStr, salt);

  // Rate limit by visitor hash (max 120 events / min)
  if (isRateLimited(visitorHash)) {
    await logSecurityEvent({
      type: "rate_limited",
      severity: "warning",
      ipHash: visitorHash.slice(0, 16),
      path: "/api/m",
      details: { reason: "Analytics flood protection" },
    });
    return new Response(null, { status: 429 });
  }

  // Parse and validate payload
  let rawBody: unknown;
  try {
    const text = await request.text();
    rawBody = JSON.parse(text);
  } catch {
    await logSecurityEvent({
      type: "analytics_malformed_payload",
      severity: "info",
      path: "/api/m",
      details: { reason: "Invalid JSON in analytics body" },
    });
    return new Response(null, { status: 400 });
  }

  const parseResult = ClientEventSchema.safeParse(rawBody);
  if (!parseResult.success) {
    await logSecurityEvent({
      type: "analytics_invalid_schema",
      severity: "info",
      path: "/api/m",
      details: { errors: parseResult.error.flatten() },
    });
    return new Response(null, { status: 400 });
  }

  const event = parseResult.data;

  // Never track admin pages
  if (event.path.startsWith("/admin")) {
    return new Response(null, { status: 204 });
  }

  const country = getClientCountry(headers);
  const deviceClass = detectDeviceClass(userAgent);
  const browserFamily = detectBrowserFamily(userAgent);
  const referrerHost = extractReferrerHost(event.referrer);

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("site_events").insert({
      event_name: event.eventName,
      path: event.path,
      entity_type: event.entityType ?? null,
      entity_id: event.entityId ?? null,
      visitor_hash: visitorHash,
      session_id: event.sessionId ?? null,
      source: event.source ?? (referrerHost ? referrerHost : "direct"),
      referrer: event.referrer ?? null,
      referrer_host: referrerHost,
      utm_source: event.utmSource ?? null,
      utm_medium: event.utmMedium ?? null,
      utm_campaign: event.utmCampaign ?? null,
      utm_content: event.utmContent ?? null,
      country: country,
      device_class: deviceClass,
      browser_family: browserFamily,
      locale: event.locale ?? null,
      duration_seconds: event.durationSeconds,
      scroll_depth: event.scrollDepth,
      metadata: (event.metadata ?? {}) as any,
    });
  } catch (err) {
    console.error("[AnalyticsIngest] Failed to insert event:", err);
  }

  // Fast response for sendBeacon
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": origin ?? "*",
      "cache-control": "no-store",
    },
  });
}

