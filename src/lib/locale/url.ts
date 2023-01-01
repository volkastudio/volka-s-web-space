/**
 * Language in the URL (Phase 15, stage B).
 *
 *   French  : /cases/some-project        (default, unprefixed)
 *   English : /en/cases/some-project
 *
 * Routes are written once, without any prefix. The router strips "/en" when it reads a URL and adds
 * it back when it builds a link (see src/router.tsx), so no page needs to know about it.
 *
 * Pure functions, no framework imports: used by the router, the server entry and the sitemap.
 */
import type { Locale } from "@/i18n/types";
import { resolveVisitorPrefs } from "./prefs";

export const EN_PREFIX = "/en";

/**
 * Paths that never get a language prefix: the back office, API endpoints, framework internals
 * and static files (anything ending in a file extension).
 */
export function isLocalizablePath(pathname: string): boolean {
  if (/^\/(admin|api)(\/|$)/.test(pathname)) return false;
  if (/^\/_/.test(pathname)) return false;
  if (/\.[a-z0-9]{2,6}$/i.test(pathname)) return false;
  return true;
}

/** Splits "/en/cases" into { locale: "en", path: "/cases" }. Everything else is French. */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  if (pathname === EN_PREFIX || pathname === `${EN_PREFIX}/`) return { locale: "en", path: "/" };
  if (pathname.startsWith(`${EN_PREFIX}/`)) {
    return { locale: "en", path: pathname.slice(EN_PREFIX.length) };
  }
  return { locale: "fr", path: pathname || "/" };
}

/** "/cases" + "en" → "/en/cases"; "/" + "en" → "/en". French paths are returned unchanged. */
export function localizePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale !== "en" || !isLocalizablePath(clean)) return clean;
  if (clean === "/") return EN_PREFIX;
  if (clean === EN_PREFIX || clean.startsWith(`${EN_PREFIX}/`)) return clean;
  return `${EN_PREFIX}${clean}`;
}

/** Language of a public href such as "/en/cases?x=1#top". Used by the router's `publicHref`. */
export function localeFromHref(href: string | null | undefined): Locale {
  if (!href) return "fr";
  const pathname = href.split(/[?#]/, 1)[0] ?? "";
  return splitLocalePath(pathname).locale;
}

/**
 * For a first visit on a French URL, decides whether to send the visitor to the English version.
 * Returns the target URL (path + search), or null to serve the page as requested.
 *
 *  - Only page navigations (GET/HEAD asking for HTML) on unprefixed public paths.
 *  - Choice order: manual choice (cookie) → browser language. Search engines and link previewers are
 *    never redirected, so they always see the French URL and the hreflang tags.
 */
export function localeRedirectTarget(request: Request): string | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (!(request.headers.get("accept") ?? "").includes("text/html")) return null;

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return null;
  }

  const { locale: urlLocale } = splitLocalePath(url.pathname);
  if (urlLocale === "en") return null;
  if (!isLocalizablePath(url.pathname)) return null;

  const prefs = resolveVisitorPrefs({
    cookieHeader: request.headers.get("cookie"),
    acceptLanguage: request.headers.get("accept-language"),
    userAgent: request.headers.get("user-agent"),
  });
  if (prefs.isBot || prefs.locale !== "en") return null;

  return `${localizePath(url.pathname, "en")}${url.search}`;
}
