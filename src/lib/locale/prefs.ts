/**
 * Language and currency preferences (Phase 15, decisions D26 and D27).
 *
 * Pure functions, no framework imports, so they can be tested and used on both
 * the server (first paint) and the client (switchers).
 *
 * Language  : manual choice (cookie) → browser language → French.
 * Currency  : manual choice (cookie) → visitor country → EUR.
 * Bots      : always French and EUR, whatever the cookies or headers say.
 *
 * Language and currency are independent: an English browser in Cotonou gets
 * English text with FCFA prices; a French browser in Paris gets EUR.
 */
import type { Locale } from "@/i18n/types";

export type Currency = "FCFA" | "EUR" | "USD";

export const CURRENCIES: readonly Currency[] = ["FCFA", "EUR", "USD"];

export const LOCALE_COOKIE = "volka_locale";
export const CURRENCY_COOKIE = "volka_currency";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Country → currency table. One place to change the rule (open item 12 of the plan).
 *
 *  - FCFA : the FCFA-zone countries (UEMOA and CEMAC).
 *  - EUR  : Europe, and any unknown country.
 *  - USD  : everywhere else.
 */
const FCFA_COUNTRIES = new Set([
  // UEMOA (XOF)
  "BJ", "BF", "CI", "GW", "ML", "NE", "SN", "TG",
  // CEMAC (XAF)
  "CM", "CF", "TD", "CG", "GQ", "GA",
]);

const EUR_COUNTRIES = new Set([
  // European Union
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // Rest of Europe
  "IS", "LI", "NO", "CH", "GB", "AD", "MC", "SM", "VA", "AL", "BA", "ME", "MK",
  "RS", "XK", "MD", "UA",
]);

/** Currency for a two-letter country code. Unknown or invalid input gives EUR. */
export function currencyForCountry(country: string | null | undefined): Currency {
  const code = normalizeCountry(country);
  if (!code) return "EUR";
  if (FCFA_COUNTRIES.has(code)) return "FCFA";
  if (EUR_COUNTRIES.has(code)) return "EUR";
  return "USD";
}

/** Upper-case ISO country code, or null for missing, malformed or "unknown" values (XX, T1). */
export function normalizeCountry(country: string | null | undefined): string | null {
  const code = country?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code) || code === "XX") return null;
  return code;
}

export function isLocale(value: unknown): value is Locale {
  return value === "fr" || value === "en";
}

export function isCurrency(value: unknown): value is Currency {
  return value === "FCFA" || value === "EUR" || value === "USD";
}

/** Parses a Cookie header into a name → value map. Bad encodings are kept as-is. */
export function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 1) continue;
    const name = part.slice(0, index).trim();
    const raw = part.slice(index + 1).trim();
    if (!name) continue;
    try {
      out[name] = decodeURIComponent(raw);
    } catch {
      out[name] = raw;
    }
  }
  return out;
}

/**
 * Picks French or English from an Accept-Language header, honouring q-values.
 * The first supported language in order of preference wins; French when none is supported.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return "fr";
  const entries = header
    .split(",")
    .map((chunk, position) => {
      const [tagPart = "", ...params] = chunk.trim().split(";");
      const tag = tagPart.trim().toLowerCase();
      let q = 1;
      for (const param of params) {
        const match = /^\s*q\s*=\s*([0-9.]+)\s*$/i.exec(param);
        if (match) q = Number.parseFloat(match[1] ?? "1");
      }
      return { tag, q: Number.isFinite(q) ? q : 0, position };
    })
    .filter((entry) => entry.tag && entry.tag !== "*" && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.position - b.position);

  for (const entry of entries) {
    const primary = entry.tag.split("-")[0];
    if (primary === "fr") return "fr";
    if (primary === "en") return "en";
  }
  return "fr";
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|whatsapp|telegram|discord|lighthouse|pagespeed|gtmetrix|headless|python-requests|curl\/|wget|go-http-client|httpclient/i;

/** Search engines, link previewers and scripts. A missing user agent counts as a bot. */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim();
  if (!ua) return true;
  return BOT_PATTERN.test(ua);
}

export type VisitorPrefs = {
  locale: Locale;
  currency: Currency;
  /** Normalised country code, when the host provided one. */
  country: string | null;
  localeSource: "cookie" | "browser" | "default";
  currencySource: "cookie" | "country" | "default";
  isBot: boolean;
};

export const DEFAULT_PREFS: VisitorPrefs = {
  locale: "fr",
  currency: "EUR",
  country: null,
  localeSource: "default",
  currencySource: "default",
  isBot: false,
};

export type VisitorSignals = {
  cookieHeader?: string | null;
  acceptLanguage?: string | null;
  /** From the host's country header (x-vercel-ip-country, cf-ipcountry). */
  country?: string | null;
  userAgent?: string | null;
};

export function resolveVisitorPrefs(signals: VisitorSignals): VisitorPrefs {
  const country = normalizeCountry(signals.country);

  if (isLikelyBot(signals.userAgent)) {
    return { ...DEFAULT_PREFS, country, isBot: true };
  }

  const cookies = parseCookies(signals.cookieHeader);
  const cookieLocale = cookies[LOCALE_COOKIE];
  const cookieCurrency = cookies[CURRENCY_COOKIE];

  let locale: Locale;
  let localeSource: VisitorPrefs["localeSource"];
  if (isLocale(cookieLocale)) {
    locale = cookieLocale;
    localeSource = "cookie";
  } else if (signals.acceptLanguage) {
    locale = localeFromAcceptLanguage(signals.acceptLanguage);
    localeSource = "browser";
  } else {
    locale = "fr";
    localeSource = "default";
  }

  let currency: Currency;
  let currencySource: VisitorPrefs["currencySource"];
  if (isCurrency(cookieCurrency)) {
    currency = cookieCurrency;
    currencySource = "cookie";
  } else if (country) {
    currency = currencyForCountry(country);
    currencySource = "country";
  } else {
    currency = "EUR";
    currencySource = "default";
  }

  return { locale, currency, country, localeSource, currencySource, isBot: false };
}

/** Value for `document.cookie`: functional cookie, one year, not readable cross-site. */
export function cookieString(name: string, value: string, secure = false): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${
    secure ? "; Secure" : ""
  }`;
}
