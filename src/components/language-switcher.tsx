import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/i18n/context";
import { easeVolkaOut } from "@/lib/motion";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const shouldReduce = useReducedMotion();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`relative inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 p-0.5 backdrop-blur-md transition-colors ${className}`}
    >
      {(["fr", "en"] as const).map((lang) => {
        const isActive = locale === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLocale(lang)}
            aria-pressed={isActive}
            className={`relative z-10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${
              isActive ? "text-primary" : "text-primary-foreground/70 hover:text-primary-foreground"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="active-lang-pill"
                className="absolute inset-0 -z-10 rounded-full bg-mint shadow-sm"
                transition={
                  shouldReduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 450, damping: 30 }
                }
              />
            )}
            {lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
