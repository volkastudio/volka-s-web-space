/**
 * Shared SEO helpers.
 *
 * Canonical URLs are always absolute and always point to the French-served page at the same path,
 * with no query string. Change SITE_URL (or set VITE_SITE_URL) when the production domain changes.
 */
const fromEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[
  "VITE_SITE_URL"
];

export const SITE_URL = (fromEnv || "https://volkastudio.com").replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}` || `${SITE_URL}/`;
}

/** `<link rel="canonical">` entry for a route's `head().links`. */
export function canonicalLink(path: string) {
  return { rel: "canonical", href: absoluteUrl(path === "/" ? "/" : path) };
}
