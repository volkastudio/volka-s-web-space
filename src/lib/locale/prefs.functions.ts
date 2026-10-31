import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_PREFS, resolveVisitorPrefs, type VisitorPrefs } from "./prefs";

/**
 * Reads the visitor's language and currency from the incoming request so the very
 * first paint is already in the right language and currency (no flash of French).
 *
 * Order, language : cookie → Accept-Language → French.
 * Order, currency : cookie → country header → EUR.
 * Bots always get French and EUR.
 *
 * Country comes from the host: Vercel sets `x-vercel-ip-country`, Cloudflare `cf-ipcountry`.
 * Locally there is none, so the result is EUR. To test other countries in development,
 * open any page with `?country=BJ` (ignored in production).
 */
export const getVisitorPrefs = createServerFn({ method: "GET" }).handler(
  async (): Promise<VisitorPrefs> => {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const request = getRequest();
      if (!request) return DEFAULT_PREFS;

      const headers = request.headers;
      let country = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry");

      if (process.env.NODE_ENV !== "production") {
        try {
          const override = new URL(request.url).searchParams.get("country");
          if (override) country = override;
        } catch {
          // ignore malformed URLs
        }
      }

      return resolveVisitorPrefs({
        cookieHeader: headers.get("cookie"),
        acceptLanguage: headers.get("accept-language"),
        country,
        userAgent: headers.get("user-agent"),
      });
    } catch (error) {
      console.error("getVisitorPrefs failed:", error);
      return DEFAULT_PREFS;
    }
  },
);
