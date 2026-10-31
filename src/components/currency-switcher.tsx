import { useI18n } from "@/i18n/context";
import { CURRENCIES, type Currency } from "@/lib/locale/prefs";

/**
 * Segmented currency control — EUR · USD · FCFA.
 * Currency is independent from language (D27).
 * Stable height & layout so switching between currencies never causes layout shift.
 */
export function CurrencySwitcher({
  variant = "light",
  className = "",
}: {
  /** `light` for light backgrounds, `dark` for dark ones. */
  variant?: "light" | "dark";
  /** Kept for backward-compatibility with call sites; no layout-shifting disclaimer injected. */
  showNote?: boolean;
  className?: string;
}) {
  const { currency, setCurrency, locale } = useI18n();
  const isFr = locale === "fr";
  const dark = variant === "dark";

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div
        role="group"
        aria-label={isFr ? "Sélectionner la devise" : "Select currency"}
        className={`
          inline-flex items-center rounded-full p-1 transition-colors
          ${
            dark
              ? "bg-white/10 ring-1 ring-white/15 backdrop-blur-md"
              : "bg-foreground/5 ring-1 ring-foreground/10 backdrop-blur-md"
          }
        `}
      >
        <div className="flex items-center gap-0.5">
          {CURRENCIES.map((code: Currency) => {
            const active = currency === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                aria-pressed={active}
                className={`
                  relative min-h-7 min-w-[50px] rounded-full px-2.5 py-1
                  text-[11px] font-semibold tracking-wider transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                  ${
                    active
                      ? dark
                        ? "bg-mint text-forest-black font-bold shadow-sm"
                        : "bg-primary text-primary-foreground font-bold shadow-sm"
                      : dark
                        ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                        : "text-foreground/60 hover:text-foreground hover:bg-foreground/10"
                  }
                `}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
