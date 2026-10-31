import { describe, expect, it } from "vitest";
import {
  currencyForCountry,
  isLikelyBot,
  localeFromAcceptLanguage,
  normalizeCountry,
  parseCookies,
  resolveVisitorPrefs,
} from "./prefs";
import { formatAmount, formatStartingPrice } from "./format";

const BROWSER =
  "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const GOOGLEBOT =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

describe("currencyForCountry", () => {
  it("uses FCFA for the FCFA zone", () => {
    for (const country of ["BJ", "TG", "CI", "SN", "ML", "BF", "NE", "GW", "CM", "GA", "TD"]) {
      expect(currencyForCountry(country)).toBe("FCFA");
    }
  });

  it("uses EUR for Europe", () => {
    for (const country of ["FR", "BE", "DE", "ES", "CH", "GB"]) {
      expect(currencyForCountry(country)).toBe("EUR");
    }
  });

  it("uses USD everywhere else", () => {
    for (const country of ["CA", "US", "NG", "GH", "CN"]) {
      expect(currencyForCountry(country)).toBe("USD");
    }
  });

  it("uses EUR when the country is unknown or invalid", () => {
    for (const value of [undefined, null, "", "XX", "T1", "benin", "B"]) {
      expect(currencyForCountry(value)).toBe("EUR");
    }
  });

  it("accepts lower-case codes", () => {
    expect(currencyForCountry("bj")).toBe("FCFA");
    expect(normalizeCountry(" bj ")).toBe("BJ");
  });
});

describe("localeFromAcceptLanguage", () => {
  it("returns French when the header is missing", () => {
    expect(localeFromAcceptLanguage(undefined)).toBe("fr");
    expect(localeFromAcceptLanguage("")).toBe("fr");
  });

  it("follows the order of preference", () => {
    expect(localeFromAcceptLanguage("en-US,en;q=0.9,fr;q=0.8")).toBe("en");
    expect(localeFromAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(localeFromAcceptLanguage("fr;q=0.5,en;q=0.9")).toBe("en");
  });

  it("falls back to French when neither language is listed", () => {
    expect(localeFromAcceptLanguage("de-DE,de;q=0.9")).toBe("fr");
    expect(localeFromAcceptLanguage("*")).toBe("fr");
  });

  it("uses English when it is the first supported language", () => {
    expect(localeFromAcceptLanguage("de-DE,de;q=0.9,en;q=0.7")).toBe("en");
  });

  it("ignores languages with q=0", () => {
    expect(localeFromAcceptLanguage("en;q=0,fr;q=0.5")).toBe("fr");
  });
});

describe("parseCookies", () => {
  it("reads names and values", () => {
    expect(parseCookies("a=1; volka_locale=en; volka_currency=FCFA")).toEqual({
      a: "1",
      volka_locale: "en",
      volka_currency: "FCFA",
    });
  });

  it("handles empty and malformed headers", () => {
    expect(parseCookies(null)).toEqual({});
    expect(parseCookies("novalue; =x; ok=%E0%A4%A")).toEqual({ ok: "%E0%A4%A" });
  });
});

describe("isLikelyBot", () => {
  it("detects crawlers, previewers and missing user agents", () => {
    expect(isLikelyBot(GOOGLEBOT)).toBe(true);
    expect(isLikelyBot("facebookexternalhit/1.1")).toBe(true);
    expect(isLikelyBot("WhatsApp/2.23")).toBe(true);
    expect(isLikelyBot("")).toBe(true);
    expect(isLikelyBot(undefined)).toBe(true);
  });

  it("does not flag a normal phone browser", () => {
    expect(isLikelyBot(BROWSER)).toBe(false);
  });
});

describe("resolveVisitorPrefs (the test cases of Phase 15)", () => {
  it("shows FCFA to a visitor from Benin", () => {
    const prefs = resolveVisitorPrefs({ userAgent: BROWSER, country: "BJ", acceptLanguage: "fr-FR" });
    expect(prefs.currency).toBe("FCFA");
    expect(prefs.locale).toBe("fr");
  });

  it("shows EUR to a visitor from France", () => {
    const prefs = resolveVisitorPrefs({ userAgent: BROWSER, country: "FR", acceptLanguage: "fr-FR" });
    expect(prefs.currency).toBe("EUR");
  });

  it("shows USD to a visitor from Canada", () => {
    const prefs = resolveVisitorPrefs({ userAgent: BROWSER, country: "CA", acceptLanguage: "en-CA,en;q=0.9" });
    expect(prefs.currency).toBe("USD");
    expect(prefs.locale).toBe("en");
  });

  it("shows EUR when there is no country header", () => {
    const prefs = resolveVisitorPrefs({ userAgent: BROWSER });
    expect(prefs.currency).toBe("EUR");
    expect(prefs.currencySource).toBe("default");
    expect(prefs.locale).toBe("fr");
  });

  it("gives English text with FCFA prices to an English browser in Cotonou", () => {
    const prefs = resolveVisitorPrefs({
      userAgent: BROWSER,
      country: "BJ",
      acceptLanguage: "en-US,en;q=0.9",
    });
    expect(prefs.locale).toBe("en");
    expect(prefs.currency).toBe("FCFA");
  });

  it("lets a manual choice win over the browser and the country", () => {
    const prefs = resolveVisitorPrefs({
      userAgent: BROWSER,
      country: "BJ",
      acceptLanguage: "fr-FR",
      cookieHeader: "volka_locale=en; volka_currency=USD",
    });
    expect(prefs.locale).toBe("en");
    expect(prefs.localeSource).toBe("cookie");
    expect(prefs.currency).toBe("USD");
    expect(prefs.currencySource).toBe("cookie");
  });

  it("ignores cookies with unknown values", () => {
    const prefs = resolveVisitorPrefs({
      userAgent: BROWSER,
      country: "FR",
      cookieHeader: "volka_locale=de; volka_currency=GBP",
    });
    expect(prefs.locale).toBe("fr");
    expect(prefs.currency).toBe("EUR");
  });

  it("always gives bots French and EUR", () => {
    const prefs = resolveVisitorPrefs({
      userAgent: GOOGLEBOT,
      country: "BJ",
      acceptLanguage: "en-US",
      cookieHeader: "volka_locale=en; volka_currency=USD",
    });
    expect(prefs.isBot).toBe(true);
    expect(prefs.locale).toBe("fr");
    expect(prefs.currency).toBe("EUR");
  });
});

describe("price formatting", () => {
  const nbsp = " ";
  const once = { xof: 200000, eur: 320, usd: 350, monthly: false };
  const monthly = { xof: 150000, eur: 230, usd: 250, monthly: true };

  it("formats FCFA, EUR and USD in French", () => {
    expect(formatStartingPrice(once, "FCFA", "fr")).toBe(`À partir de 200${nbsp}000${nbsp}FCFA`);
    expect(formatStartingPrice(once, "EUR", "fr")).toBe(`À partir de 320${nbsp}€`);
    expect(formatStartingPrice(once, "USD", "fr")).toBe(`À partir de 350${nbsp}$`);
  });

  it("formats FCFA, EUR and USD in English", () => {
    expect(formatStartingPrice(once, "FCFA", "en")).toBe(`From 200,000${nbsp}FCFA`);
    expect(formatStartingPrice(once, "EUR", "en")).toBe("From €320");
    expect(formatStartingPrice(once, "USD", "en")).toBe("From $350");
  });

  it("adds the monthly suffix", () => {
    expect(formatStartingPrice(monthly, "FCFA", "fr")).toBe(`À partir de 150${nbsp}000${nbsp}FCFA/mois`);
    expect(formatStartingPrice(monthly, "EUR", "en")).toBe("From €230/month");
  });

  it("groups thousands", () => {
    expect(formatAmount(1250, "EUR", "fr")).toBe(`1${nbsp}250${nbsp}€`);
    expect(formatAmount(1350, "USD", "en")).toBe("$1,350");
  });
});
