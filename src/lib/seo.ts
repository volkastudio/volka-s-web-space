/**
 * Shared SEO helpers.
 *
 * Every public page exists at two addresses: French at the plain path, English under /en.
 * Each address declares itself as canonical and lists both languages as alternates (hreflang),
 * with the French page as x-default. Change SITE_URL (or set VITE_SITE_URL) when the production
 * domain changes.
 */
import type { Locale } from "@/i18n/types";
import { localizePath } from "@/lib/locale/url";

const fromEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[
  "VITE_SITE_URL"
];

export const SITE_URL = (fromEnv || "https://volkastudio.com").replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}` || `${SITE_URL}/`;
}

/** Absolute URL of a page in a given language. "/" + "en" → https://site/en */
export function localizedUrl(path: string, locale: Locale): string {
  return absoluteUrl(localizePath(path, locale));
}

/** Pages that search engines should index, in both languages. Everything else gets no SEO links. */
const INDEXABLE: RegExp[] = [
  /^\/$/,
  /^\/start$/,
  /^\/audit$/,
  /^\/cases$/,
  /^\/cases\/[^/]+$/,
  /^\/journal$/,
  /^\/journal\/[^/]+$/,
  /^\/legal$/,
  /^\/offres\/[^/]+$/,
];

export function isIndexablePath(path: string): boolean {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return INDEXABLE.some((pattern) => pattern.test(clean));
}

/**
 * `<link>` entries for a page: its own canonical URL plus the hreflang alternates.
 * `path` is the route path without any language prefix (what the router calls the pathname).
 */
export function seoLinks(path: string, locale: Locale) {
  if (!isIndexablePath(path)) return [];
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return [
    { rel: "canonical", href: localizedUrl(clean, locale) },
    { rel: "alternate", hrefLang: "fr", href: localizedUrl(clean, "fr") },
    { rel: "alternate", hrefLang: "en", href: localizedUrl(clean, "en") },
    { rel: "alternate", hrefLang: "x-default", href: localizedUrl(clean, "fr") },
  ];
}

/**
 * @deprecated Canonical and hreflang links are now produced once, by the root route, for every
 * public page. Do not add this to a route's head: it would create a second canonical.
 */
export function canonicalLink(path: string) {
  return { rel: "canonical", href: absoluteUrl(path === "/" ? "/" : path) };
}
