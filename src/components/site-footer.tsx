import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { TealBackground } from "@/components/teal-background";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { useStudioSocials, isPlaceholderWhatsApp } from "@/lib/studio-socials";

export function SiteFooter() {
  const { t, locale } = useI18n();
  const socials = useStudioSocials();

  return (
    <footer className="relative isolate overflow-hidden bg-forest-black text-paper">
      {/* Code-made teal glow background for cohesive dark aesthetic */}
      <TealBackground variant="glow" />

      <div className="relative z-10 px-5 pt-20 pb-16 md:px-10 md:pt-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-mint">
            {t.footer.ctaEyebrow}
          </p>
          <div className="mt-8 flex flex-col gap-10 border-b border-paper/15 pb-16 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-4xl font-display text-4xl sm:text-6xl md:text-7xl font-light leading-[1.05] tracking-tight text-balance">
              {locale === "fr" ? (
                <>
                  Commençons par{" "}
                  <span className="italic text-mint font-light">le comprendre</span>.
                </>
              ) : (
                <>
                  Let's start by{" "}
                  <span className="italic text-mint font-light">understanding it</span>.
                </>
              )}
            </h2>
            <Button
              asChild
              className="shrink-0 rounded-full bg-ochre px-8 py-3.5 text-sm sm:text-base font-semibold text-forest-black shadow-xl hover:bg-ochre/90 active:scale-[0.98] transition-all min-h-12 inline-flex items-center justify-center gap-2 border-none"
            >
              <Link to="/start">
                <span>{t.nav.start}</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          {/* Footer nav — top row: links; bottom row: lang + copyright */}
          <div className="pt-8 text-xs uppercase tracking-[0.14em] text-paper/60">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="font-semibold text-primary-foreground">VOLKA</span>
            <span>{t.footer.location}</span>
            <Link to="/journal" className="transition-colors hover:text-mint">
              Journal
            </Link>
            {socials.instagram?.trim() && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-mint"
              >
                Instagram
              </a>
            )}
            {socials.linkedin?.trim() && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-mint"
              >
                LinkedIn
              </a>
            )}
            {socials.twitter?.trim() && (
              <a
                href={socials.twitter}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-mint"
              >
                X
              </a>
            )}
            {socials.tiktok?.trim() && (
              <a
                href={socials.tiktok}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-mint"
              >
                TikTok
              </a>
            )}
            {socials.youtube?.trim() && (
              <a
                href={socials.youtube}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-mint"
              >
                YouTube
              </a>
            )}
            {socials.facebook?.trim() && (
              <a
                href={socials.facebook}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-mint"
              >
                Facebook
              </a>
            )}
            {socials.whatsapp?.trim() && !isPlaceholderWhatsApp(socials.whatsapp) && (
              <a
                href={socials.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-mint"
              >
                WhatsApp
              </a>
            )}
            {socials.email?.trim() && (
              <a
                href={`mailto:${socials.email}`}
                className="transition-colors hover:text-mint"
              >
                {socials.email}
              </a>
            )}
            <Link to="/legal" className="transition-colors hover:text-mint">
              {t.footer.legalNotice}
            </Link>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-paper/15 pt-5">
            <span>© {new Date().getFullYear()} Volka Studio</span>
            <LanguageSwitcher />
          </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
