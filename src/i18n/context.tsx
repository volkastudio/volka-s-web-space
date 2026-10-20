import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fr } from "./fr";
import { en } from "./en";
import type { Locale, Translations } from "./types";

type I18nContextType = {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  formatPrice: (prices: { xof: string; eur: string; usd: string }) => string;
};

const dictionaries: Record<Locale, Translations> = { fr, en };

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "volka_locale";

export function I18nProvider({
  children,
  defaultLocale = "fr", // French is primary (Studio in Cotonou, Bénin) per Decision D3
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // Read from cookie or localStorage on client mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "fr" || saved === "en") {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = defaultLocale;
      }
    }
  }, [defaultLocale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `volka_locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
      document.documentElement.lang = newLocale;
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "fr" ? "en" : "fr");
  };

  // Locale-aware price formatting: FCFA for FR, EUR/USD for EN (Decision D4)
  const formatPrice = (prices: { xof: string; eur: string; usd: string }) => {
    return locale === "fr" ? `${prices.xof} (${prices.eur})` : `${prices.eur} / ${prices.usd}`;
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        t: dictionaries[locale],
        setLocale,
        toggleLocale,
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
      formatPrice: (p) => `${p.xof} (${p.eur})`,
    };
  }
  return ctx;
}
