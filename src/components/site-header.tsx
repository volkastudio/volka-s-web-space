import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

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

  return (
    <header className={wrapperClass}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10 lg:px-14">
        <Link to="/" className="text-xl font-semibold tracking-[0.12em]" aria-label="Volka home">
          VOLKA
        </Link>
        <nav
          className="hidden items-center gap-7 text-xs font-medium uppercase tracking-[0.14em] md:flex"
          aria-label="Main navigation"
        >
          <Link className="transition-colors hover:text-gold" to="/cases">
            {t.nav.cases}
          </Link>
          <Link className="transition-colors hover:text-gold" to="/" hash="services">
            {t.nav.services}
          </Link>
          <Link className="transition-colors hover:text-gold" to="/" hash="about">
            {t.nav.studio}
          </Link>

          {/* Liquid Glass Language Switcher */}
          <LanguageSwitcher />

          <Button asChild variant="volka" size="volka" className="shadow-sm">
            <Link to="/start">
              {t.nav.start} <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          <LanguageSwitcher />
          <Button
            variant={isDark ? "volkaOutline" : "outline"}
            size="icon"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className={[
            "fixed inset-0 top-[72px] z-40 flex flex-col gap-6 p-8 font-display text-3xl backdrop-blur-2xl md:hidden",
            isDark ? "bg-primary/95 text-primary-foreground" : "bg-background/95 text-foreground",
          ].join(" ")}
          aria-label="Mobile navigation"
        >
          <Link onClick={close} to="/cases">
            {t.nav.cases}
          </Link>
          <Link onClick={close} to="/" hash="services">
            {t.nav.services}
          </Link>
          <Link onClick={close} to="/" hash="about">
            {t.nav.studio}
          </Link>
          <Link onClick={close} to="/start">
            {t.nav.start}
          </Link>
        </nav>
      )}
    </header>
  );
}
