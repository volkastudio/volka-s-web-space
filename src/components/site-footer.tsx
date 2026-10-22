import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { useStudioSocials } from "@/lib/studio-socials";

export function SiteFooter() {
  const { t } = useI18n();
  const socials = useStudioSocials();

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
        {/* Footer nav — top row: links; bottom row: lang + copyright */}
        <div className="pt-8 text-xs uppercase tracking-[0.14em] text-primary-foreground/60">
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
            {socials.whatsapp?.trim() && (
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
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-primary-foreground/10 pt-5">
            <span>© {new Date().getFullYear()} Volka Studio</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </section>
  );
}
