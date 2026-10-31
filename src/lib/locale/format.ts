/**
 * Price formatting for the starting prices (D27). Amounts are the ones entered in
 * `src/data/offers.ts` for each currency. They are never converted automatically.
 */
import type { Locale } from "@/i18n/types";
import type { Currency } from "./prefs";

export type StartingAmounts = {
  /** FCFA */
  xof: number;
  eur: number;
  usd: number;
  /** Shown as "/mois" or "/month" */
  monthly: boolean;
};

const NBSP = "\u00a0";

export function formatAmount(amount: number, currency: Currency, locale: Locale): string {
  const formatter = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: 0,
  });
  // Normalise any narrow/standard non-breaking spaces used as grouping separators.
  const digits = formatter.format(amount).replace(/[\u00a0\u202f\u0020]/g, NBSP);
  if (currency === "FCFA") return `${digits}${NBSP}FCFA`;
  if (currency === "EUR") return locale === "fr" ? `${digits}${NBSP}\u20ac` : `\u20ac${digits}`;
  // For USD in French, test expects digits + NBSP + $ (legacy compatibility)
  return locale === "fr" ? `${digits}${NBSP}$` : `$${digits}`;
}

export function amountFor(amounts: StartingAmounts, currency: Currency): number {
  if (currency === "FCFA") return amounts.xof;
  if (currency === "EUR") return amounts.eur;
  return amounts.usd;
}

/**
 * Returns a structured price object so the UI can style each part independently.
 *
 * ```
 * { prefix: "À partir de", amount: "1 500 €", vatNote: "HT", suffix: "" }
 * { prefix: "From",        amount: "$1,650",  vatNote: "",    suffix: "" }
 * ```
 */
export type FormattedPrice = {
  /** "À partir de" / "From" */
  prefix: string;
  /** Formatted number + currency symbol, e.g. "1 500 €" or "$1,650" */
  amount: string;
  /** Currency code for pill/badge: "EUR" | "USD" | "FCFA" */
  currency: Currency;
  /** "HT" for EUR in French, "excl. VAT" for EUR in English, "" for FCFA and USD */
  vatNote: string;
  /** "/mois" or "/month" for monthly offers, "" otherwise */
  suffix: string;
};

export function formatStartingPriceStructured(
  amounts: StartingAmounts,
  currency: Currency,
  locale: Locale,
): FormattedPrice {
  const prefix = locale === "fr" ? "À partir de" : "From";
  const amount = formatAmount(amountFor(amounts, currency), currency, locale);
  const vatNote = currency === "EUR" ? (locale === "fr" ? "HT" : "excl.\u00a0VAT") : "";
  const suffix = amounts.monthly ? (locale === "fr" ? "/mois" : "/month") : "";
  return { prefix, amount, currency, vatNote, suffix };
}

/**
 * "À partir de 200 000 FCFA", "From €320", "À partir de 150 000 FCFA/mois".
 * Preserves standard string format expected by tests and legacy consumers.
 */
export function formatStartingPrice(
  amounts: StartingAmounts,
  currency: Currency,
  locale: Locale,
): string {
  const prefix = locale === "fr" ? "À partir de " : "From ";
  const suffix = amounts.monthly ? (locale === "fr" ? "/mois" : "/month") : "";
  return `${prefix}${formatAmount(amountFor(amounts, currency), currency, locale)}${suffix}`;
}
