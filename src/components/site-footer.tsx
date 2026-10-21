import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <section className="bg-primary px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-mint">
          {t.footer.ctaEyebrow}
        </p>
        <div className="mt-8 flex flex-col gap-10 border-b border-primary-foreground/20 pb-16 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-4xl font-display text-6xl font-medium leading-[0.9] md:text-8xl">
            {t.footer.ctaHeadline}
          </h2>
          <Button asChild variant="volka" size="volka" className="shrink-0 shadow-lg">
            <Link to="/start">
              {t.nav.start} <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-8 text-xs uppercase tracking-[0.14em] text-primary-foreground/60"
        >
          <span className="font-semibold text-primary-foreground">VOLKA</span>
          <span>{t.footer.location}</span>
          <a
            href="https://www.instagram.com/volkastudio"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-mint"
          >
            Instagram
          </a>
          {/* Update this WhatsApp number before launch */}
          <a
            href="https://wa.me/22900000000?text=Bonjour%20Volka%2C%20je%20voudrais%20d%C3%A9marrer%20un%20projet."
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-mint"
          >
            WhatsApp
          </a>
          <a href="mailto:hello@volkastudio.com" className="transition-colors hover:text-mint">
            hello@volkastudio.com
          </a>
          <Link to="/legal" className="transition-colors hover:text-mint">
            {t.footer.legalNotice}
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <LanguageSwitcher />
            <span>© {new Date().getFullYear()} Volka Studio</span>
          </div>
        </nav>
      </div>
    </section>
  );
}
