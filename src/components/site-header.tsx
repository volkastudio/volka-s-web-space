import { Link } from "@tanstack/react-router";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";

/**
 * SiteHeader variants:
 * - `dark`    — opaque dark background (primary colour). Used on interior pages.
 * - `light`   — opaque light background. Used on light-background pages.
 * - `overlay` — absolutely positioned, transparent with frosted glass nav items. Floats over the hero image.
 *               The parent section must be `relative`.
 */
export function SiteHeader({ variant = "dark" }: { variant?: "dark" | "light" | "overlay" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useI18n();
  const close = () => setMenuOpen(false);

  // Close on Escape and lock body scroll while mobile menu is open
  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isOverlay = variant === "overlay";
  const isDark = variant === "dark" || variant === "overlay";

  const wrapperClass = [
    isOverlay ? "absolute inset-x-0 top-0" : "relative",
    "z-30 transition-all duration-300",
    isOverlay
      ? "border-b border-primary-foreground/10 bg-primary/20 backdrop-blur-md"
      : isDark
        ? "border-b border-primary-foreground/15 bg-primary/95 backdrop-blur-xl"
        : "border-b border-border/80 bg-background/90 backdrop-blur-xl",
    isDark ? "text-primary-foreground" : "text-foreground",
  ]
    .filter(Boolean)
    .join(" ");

  const navItems = [
    { label: t.nav.cases, to: "/cases" as const, hash: undefined },
    { label: t.nav.services, to: "/" as const, hash: "services" },
    { label: t.nav.studio, to: "/" as const, hash: "about" },
  ];

  return (
    <>
      <header className={wrapperClass}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10 md:py-5 lg:px-14">
          {/* Logo — icon only on mobile, icon + VOLKA text on desktop */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-xl font-semibold tracking-[0.12em]"
            aria-label="Volka home"
          >
            <img
              src={isDark ? "/volka-icon-light.png" : "/volka-icon-dark.png"}
              alt="Volka"
              width={28}
              height={28}
              className="size-7 shrink-0 object-contain"
            />
            {/* Hide text on mobile so header stays compact and doesn't overlap hero text */}
            <span className="hidden sm:inline">VOLKA</span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-7 text-xs font-medium uppercase tracking-[0.14em] md:flex"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                className="transition-colors hover:text-gold"
                to={item.to}
                {...(item.hash ? { hash: item.hash } : {})}
              >
                {item.label}
              </Link>
            ))}

            {/* Liquid Glass Language Switcher */}
            <LanguageSwitcher />

            <Button asChild variant="volka" size="volka" className="shadow-sm">
              <Link to="/start">
                {t.nav.start} <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </nav>

          {/* Mobile: lang switcher + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <LanguageSwitcher />
            <button
              type="button"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
              className={[
                "relative flex size-10 flex-col items-center justify-center gap-[5px] transition-colors",
                isDark
                  ? "text-primary-foreground hover:text-gold"
                  : "text-foreground hover:text-primary",
              ].join(" ")}
            >
              {/* Animated hamburger → X */}
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="block h-px w-5 bg-current origin-center"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.2 }}
                className="block h-px w-5 bg-current"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="block h-px w-5 bg-current origin-center"
              />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Full-screen mobile menu overlay ─── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="fixed inset-0 z-50 flex flex-col overflow-hidden md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Dark gradient background */}
            <motion.div
              className="absolute inset-0 bg-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* Ambient orbs */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-mint/10 blur-3xl"
            />

            {/* Header bar inside menu */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-primary-foreground/10">
              <Link
                to="/"
                onClick={close}
                className="flex items-center gap-2.5 text-primary-foreground"
                aria-label="Volka home"
              >
                <img
                  src="/volka-icon-light.png"
                  alt="Volka"
                  width={28}
                  height={28}
                  className="size-7 object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer le menu"
                className="flex size-10 items-center justify-center text-primary-foreground/70 transition-colors hover:text-gold"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Nav links — staggered slide in */}
            <nav className="relative z-10 flex flex-1 flex-col justify-center px-8">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.08 + i * 0.07,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    to={item.to}
                    {...(item.hash ? { hash: item.hash } : {})}
                    onClick={close}
                    className="group flex items-baseline justify-between border-b border-primary-foreground/10 py-5"
                  >
                    <span className="font-display text-5xl font-medium text-primary-foreground transition-colors group-hover:text-gold">
                      {item.label}
                    </span>
                    <ArrowUpRight className="size-5 text-primary-foreground/30 transition-all group-hover:text-gold group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              ))}

              {/* CTA link */}
              <motion.div
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{
                  duration: 0.45,
                  delay: 0.08 + navItems.length * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-10"
              >
                <Link
                  to="/start"
                  onClick={close}
                  className="inline-flex items-center gap-3 border border-gold bg-gold/10 px-7 py-4 text-xs font-medium uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold hover:text-primary"
                >
                  {t.nav.start} <ArrowUpRight className="size-4" />
                </Link>
              </motion.div>
            </nav>

            {/* Footer row */}
            <motion.div
              className="relative z-10 flex items-center justify-between px-8 py-6 border-t border-primary-foreground/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground/40">
                Studio · Cotonou
              </p>
              <LanguageSwitcher />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
