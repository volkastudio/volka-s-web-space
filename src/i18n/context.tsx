import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fr } from "./fr";
import { en } from "./en";
import type { Locale, Translations } from "./types";
import type { Offer } from "@/data/offers";
import { formatStartingPrice, formatStartingPriceStructured, type FormattedPrice } from "@/lib/locale/format";
import {
  CURRENCY_COOKIE,
  LOCALE_COOKIE,
  cookieString,
  type Currency,
  type VisitorPrefs,
} from "@/lib/locale/prefs";

type LegacyPrices = { xof: string; eur: string; usd: string };

type I18nContextType = {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  /** Display currency. Independent from the language (D27). */
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  /** "À partir de 200 000 FCFA" / "From €320 HT", in the visitor's language and currency. */
  formatOfferPrice: (offer: Pick<Offer, "amounts">) => string;
  /** Structured price for rich rendering: prefix, amount, vatNote, suffix separately. */
  formatOfferPriceStructured: (offer: Pick<Offer, "amounts">) => FormattedPrice;
  /** @deprecated Use formatOfferPrice. Returns the legacy text price for the current currency. */
  formatPrice: (prices: LegacyPrices) => string;
};

const dictionaries: Record<Locale, Translations> = { fr, en };

const I18nContext = createContext<I18nContextType | null>(null);

/** Writes a functional preference cookie. Never throws (private modes, blocked cookies). */
function writeCookie(name: string, value: string) {
  try {
    document.cookie = cookieString(name, value, window.location.protocol === "https:");
  } catch {
    // The choice still applies for this visit.
  }
}

export function I18nProvider({
  children,
  defaultLocale = "fr", // French is primary (Studio in Cotonou, Bénin) per Decision D3
  initialPrefs,
}: {
  children: ReactNode;
  defaultLocale?: Locale;
  /**
   * Resolved on the server from the request (cookie → browser/country → defaults),
   * so the first paint already has the right language and currency.
   */
  initialPrefs?: Pick<VisitorPrefs, "locale" | "currency"> | undefined;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialPrefs?.locale ?? defaultLocale);
  const [currency, setCurrencyState] = useState<Currency>(initialPrefs?.currency ?? "EUR");

  useEffect(() => {
    document.documentElement.lang = locale;
    // Runs once on mount; later changes go through setLocale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A manual choice is stored in a cookie, so the server renders it on the next request.
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof document !== "undefined") {
      writeCookie(LOCALE_COOKIE, newLocale);
      document.documentElement.lang = newLocale;
    }
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    if (typeof document !== "undefined") {
      writeCookie(CURRENCY_COOKIE, newCurrency);
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "fr" ? "en" : "fr");
  };

  const formatOfferPrice = (offer: Pick<Offer, "amounts">) =>
    formatStartingPrice(offer.amounts, currency, locale);

  const formatOfferPriceStructured = (offer: Pick<Offer, "amounts">) =>
    formatStartingPriceStructured(offer.amounts, currency, locale);

  const formatPrice = (prices: LegacyPrices) =>
    currency === "FCFA" ? prices.xof : currency === "EUR" ? prices.eur : prices.usd;

  return (
    <I18nContext.Provider
      value={{
        locale,
        t: dictionaries[locale],
        setLocale,
        toggleLocale,
        currency,
        setCurrency,
        formatOfferPrice,
        formatOfferPriceStructured,
        formatPrice,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Graceful fallback for components rendered outside the provider (or during tests)
    return {
      locale: "fr",
      t: fr,
      setLocale: () => {},
      toggleLocale: () => {},
      currency: "EUR",
      setCurrency: () => {},
      formatOfferPrice: (offer) => formatStartingPrice(offer.amounts, "EUR", "fr"),
      formatOfferPriceStructured: (offer) => formatStartingPriceStructured(offer.amounts, "EUR", "fr"),
      formatPrice: (p) => p.eur,
    };
  }
  return ctx;
}
