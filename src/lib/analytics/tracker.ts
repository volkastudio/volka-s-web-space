import type { AnalyticsEventName, ClientEventPayload } from "./types";

const OPTOUT_KEY = "volka_analytics_optout";
const SESSION_KEY = "volka_sid";

/**
 * Returns whether the current browser session has opted out of analytics tracking
 * (e.g. via the Admin "Don't count my visits" toggle or browser DNT/GPC).
 */
export function isTrackingOptedOut(): boolean {
  if (typeof window === "undefined") return true;

  try {
    if (window.localStorage.getItem(OPTOUT_KEY) === "true") {
      return true;
    }
  } catch {
    // localStorage might be blocked in strict private browsing
  }

  // D18: Respect Do Not Track and Global Privacy Control
  const nav = window.navigator as unknown as { doNotTrack?: string; globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) {
    return true;
  }

  return false;
}

/**
 * Toggles the admin exclusion flag ("Don't count my visits").
 */
export function setTrackingOptOut(optOut: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (optOut) {
      window.localStorage.setItem(OPTOUT_KEY, "true");
    } else {
      window.localStorage.removeItem(OPTOUT_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieves or initializes a temporary session ID stored strictly in sessionStorage (ends with the tab).
 */
export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = window.sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      window.sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "s_ephemeral";
  }
}

/**
 * Parses UTM query parameters from the current URL.
 */
function getUtmParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
} {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") ?? params.get("src") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      utmContent: params.get("utm_content") ?? undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Dispatches an analytics event to the first-party ingest endpoint (/api/m)
 * using navigator.sendBeacon with fetch fallback.
 */
export function track(
  eventName: AnalyticsEventName,
  payload: Partial<Omit<ClientEventPayload, "eventName">> = {},
): void {
  if (typeof window === "undefined") return;

  // Never track visits on admin routes
  const currentPath = payload.path ?? window.location.pathname;
  if (currentPath.startsWith("/admin")) {
    return;
  }

  // Check opt-out and DNT
  if (isTrackingOptedOut()) {
    return;
  }

  const utms = getUtmParams();
  const sessionId = getOrCreateSessionId();
  const locale = (document.documentElement.lang === "en" ? "en" : "fr") as "fr" | "en";

  const eventData: ClientEventPayload = {
    eventName,
    path: currentPath,
    entityType: payload.entityType,
    entityId: payload.entityId,
    source: payload.source ?? utms.utmSource,
    referrer: payload.referrer ?? (document.referrer || undefined),
    utmSource: payload.utmSource ?? utms.utmSource,
    utmMedium: payload.utmMedium ?? utms.utmMedium,
    utmCampaign: payload.utmCampaign ?? utms.utmCampaign,
    utmContent: payload.utmContent ?? utms.utmContent,
    locale: payload.locale ?? locale,
    durationSeconds: payload.durationSeconds ?? 0,
    scrollDepth: payload.scrollDepth ?? 0,
    sessionId: payload.sessionId ?? sessionId,
    metadata: payload.metadata ?? {},
  };

  const body = JSON.stringify(eventData);

  // Send via sendBeacon for reliable background transmission without delaying page unload
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    const success = navigator.sendBeacon("/api/m", blob);
    if (success) return;
  }

  // Fallback to fetch with keepalive
  try {
    fetch("/api/m", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Silently discard failed telemetry
    });
  } catch {
    // Ignore network failures
  }
}

