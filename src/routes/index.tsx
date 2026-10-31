import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUpRight, Check, Sparkles } from "lucide-react";

import { CountUp } from "@/components/count-up";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { CursorFollower } from "@/components/cursor-follower";
import { ImageReveal } from "@/components/image-reveal";
import { LiquidGlassCard } from "@/components/liquid-glass-card";
import { Marquee } from "@/components/marquee";
import { Parallax } from "@/components/parallax";
import { Reveal } from "@/components/reveal";
import { SplitHeading } from "@/components/split-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getStaticCaseStudies, getStaticCaseStudy } from "@/data/case-studies";
import { getFeaturedCaseStudies } from "@/lib/cases.functions";
import { offers, getLocalizedOffer } from "@/data/offers";
import { useI18n } from "@/i18n/context";

import heroImage from "@/assets/volka-hero.jpg";
import heroMobileImage from "@/assets/volka-hero-mobile.jpg";

export const Route = createFileRoute("/")({
  loader: async () => {
    const featuredStudies = await getFeaturedCaseStudies();
    return { featuredStudies };
  },
  component: Index,
  head: () => ({
    meta: [
      { title: "Volka — Les systèmes derrière la croissance des entreprises" },
      {
        name: "description",
        content:
          "Volka construit les systèmes qui soutiennent la croissance des entreprises : Perception, Acquisition, Conversion, Ventes et Automatisation.",
      },
      { property: "og:title", content: "Volka — Les systèmes derrière la croissance" },
      {
        property: "og:description",
        content:
          "De la façon dont votre entreprise est perçue à la manière dont elle attire, convertit et suit ses clients — avec l'automatisation pour relier le tout.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: "Volka",
          url: "https://volkastudio.com",
          description:
            "Volka construit les systèmes qui soutiennent la croissance des entreprises : Perception, Acquisition, Conversion, Ventes et Automatisation.",
          sameAs: ["https://linkedin.com/company/volkastudio"],
          address: {
            "@type": "PostalAddress",
            addressLocality: "Cotonou",
            addressCountry: "BJ",
          },
          areaServed: ["FR", "BE", "CH", "BJ", "CI", "SN", "TG", "EU"],
          priceRange: "€€€",
        }),
      },
    ],
  }),
});

const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Scroll-arrow: pulses once then settles — no infinite bounce */
function ScrollArrow({ label }: { label: string }) {
  const shouldReduce = useReducedMotion();
  return (
    <a href="#about" className="group flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em]">
      {label}{" "}
      <span className="flex size-10 items-center justify-center border border-primary-foreground/35 transition-colors duration-300 group-hover:border-mint group-hover:bg-mint group-hover:text-primary">
        <motion.span
          animate={shouldReduce ? {} : { y: [0, 6, 0, 4, 0] }}
          transition={{ duration: 1.4, delay: 1.8, ease: "easeInOut", repeat: 0 }}
          style={{ display: "inline-flex" }}
        >
          <ArrowDown className="size-4" />
        </motion.span>
      </span>
    </a>
  );
}

function Index() {
  const { featuredStudies } = Route.useLoaderData();
  const { locale, t, formatOfferPrice, formatOfferPriceStructured } = useI18n();

  // Localized case studies that switch reactively on locale toggle (supports up to 4 concepts)
  const displayedCases = (
    featuredStudies && featuredStudies.length > 0
      ? featuredStudies.map((s) => getStaticCaseStudy(s.slug, locale) || s)
      : getStaticCaseStudies(locale)
  ).slice(0, 4);

  return (
    <main className="bg-background text-foreground">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[92svh] overflow-hidden bg-primary text-primary-foreground">
        {/* Parallax hero image (responsive: mobile 9:16 portrait, desktop 16:9 landscape) */}
        <Parallax speed={80} className="absolute inset-0 h-full w-full">
          <picture className="h-full w-full">
            <source media="(max-width: 767px)" srcSet={heroMobileImage} />
            <source media="(min-width: 768px)" srcSet={heroImage} />
            <img
              src={heroImage}
              alt="Volka — Systèmes de croissance d'entreprise"
              width={1920}
              height={1088}
              fetchPriority="high"
              className="h-full w-full object-cover object-center"
              style={{ minHeight: "110%" }}
            />
          </picture>
        </Parallax>

        {/* Overlays */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-primary/80 mix-blend-multiply"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-primary/50"
        />
        {/* Subtle radial focus on headline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(0,0,0,0)_0%,rgba(21,38,25,0.6)_100%)]"
        />

        <SiteHeader variant="overlay" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col justify-end px-5 pt-28 pb-16 md:px-10 md:pt-36 md:pb-24 lg:px-14">
          <motion.p
            className="text-xs font-medium uppercase tracking-[0.24em] text-gold"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: easeOut }}
          >
            {t.hero.eyebrow}
          </motion.p>

          <div className="mt-6 max-w-5xl">
            <h1
              className="font-display text-5xl font-medium leading-[0.94] tracking-tight sm:text-6xl md:text-8xl lg:text-9xl"
              style={{ textWrap: "balance" }}
            >
              {/* Line 1 */}
              <motion.span
                className="block overflow-hidden"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.95, delay: 0.5, ease: easeOut }}
              >
                {t.hero.titleLine1}
              </motion.span>
              {/* Line 2 — slightly delayed */}
              <motion.span
                className="block overflow-hidden"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.95, delay: 0.65, ease: easeOut }}
              >
                {t.hero.titleLine2}
              </motion.span>
            </h1>
          </div>

          <motion.div
            className="mt-8 border-t border-primary-foreground/25"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, delay: 0.85, ease: easeOut }}
            style={{ transformOrigin: "left" }}
          />

          <motion.div
            className="flex flex-col gap-7 pt-7 md:flex-row md:items-end md:justify-between"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.0, ease: easeOut }}
          >
            <p className="max-w-xl text-lg font-light leading-relaxed text-primary-foreground/85 md:text-xl">
              {t.hero.subtitle}
            </p>
            <ScrollArrow label={t.hero.seeApproach} />
          </motion.div>
        </div>
      </section>

      {/* ─── Stats band ─── */}
      <section className="border-b border-border bg-ivory px-5 py-12 md:px-10 lg:px-14">
        <Reveal>
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <p className="font-display text-4xl sm:text-5xl font-medium text-primary md:text-6xl">
                <CountUp to={40} suffix="+" />
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {t.stats.projects}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-display text-4xl sm:text-5xl font-medium text-primary md:text-6xl">
                <CountUp to={8} suffix=" yrs" />
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {t.stats.experience}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-display text-4xl sm:text-5xl font-medium text-primary md:text-6xl">
                <CountUp to={12} />
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {t.stats.countries}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-display text-4xl sm:text-5xl font-medium text-primary md:text-6xl">
                <CountUp to={95} suffix="%" />
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {t.stats.satisfaction}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── Marquee ribbon ─── */}
      <section className="border-y border-border/80 bg-background py-3.5 md:py-4">
        <Marquee speed={32} items={t.marquee} variant="light" />
      </section>

      {/* ─── Studio ─── */}
      <section id="about" className="border-b border-border px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t.studio.eyebrow}
            </p>
          </Reveal>
          <div>
            <SplitHeading
              as="h2"
              className="max-w-4xl font-display text-5xl font-medium leading-[0.98] md:text-7xl"
            >
              {t.studio.title}
            </SplitHeading>
            <Reveal delay={200}>
              <div className="mt-10 grid gap-8 md:grid-cols-2">
                <p className="text-base font-light leading-relaxed text-muted-foreground">
                  {t.studio.p1}
                </p>
                <p className="text-base font-light leading-relaxed text-muted-foreground">
                  {t.studio.p2}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Selected Work (Concepts sélectionnés: up to 4 concepts) ─── */}
      <section id="work" className="border-b border-border bg-forest px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-14 flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-mint">
                  {t.work.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-4xl font-medium md:text-6xl">
                  {t.work.title}
                </h2>
              </div>
              <Link
                to="/cases"
                className="hidden text-xs uppercase tracking-[0.16em] text-primary-foreground/60 transition-colors hover:text-mint md:block"
              >
                {t.work.allCases}
              </Link>
            </div>
          </Reveal>

          {/* Up to 4 concepts grid */}
          <div className="grid gap-12 md:grid-cols-2 md:gap-x-12 md:gap-y-16">
            {displayedCases.map((study, index) => (
              <Reveal key={study.slug} delay={index * 100}>
                <article className={index % 2 === 1 ? "md:mt-16" : ""}>
                  <Link to="/cases/$slug" params={{ slug: study.slug }} className="group block">
                    <CursorFollower label={t.work.viewProject}>
                      <div className="aspect-[4/3] overflow-hidden rounded-sm bg-primary">
                        <ImageReveal delay={index * 80}>
                          <motion.img
                            src={study.image}
                            alt={study.imageAlt}
                            width={1600}
                            height={1200}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            style={{ viewTransitionName: `case-cover-${study.slug}` }}
                            whileHover={{ scale: 1.04 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </ImageReveal>
                      </div>
                    </CursorFollower>
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-3xl transition-colors group-hover:text-mint">
                          {study.client}
                        </h3>
                        <p className="mt-1 text-sm text-primary-foreground/60">
                          {study.discipline} · {study.sector}
                        </p>
                      </div>
                      <motion.span
                        whileHover={{ x: 4, y: -4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="mt-2 inline-flex"
                      >
                        <ArrowUpRight className="size-5 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </motion.span>
                    </div>
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>

          <Link
            to="/cases"
            className="mt-12 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] md:hidden"
          >
            {t.work.allCases} <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ─── Services / The 5 Pillars ─── */}
      <section id="services" className="px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <Reveal>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t.services.eyebrow}
                </p>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {t.services.subtitle}
                </p>
              </div>
            </Reveal>
            <div>
              {t.services.items.map((item, i) => (
                <Reveal key={item.number} delay={i * 80}>
                  <article className="grid gap-3 border-t border-border py-7 md:grid-cols-[70px_1fr_1.3fr] md:gap-6">
                    <span className="text-xs text-gold font-mono">{item.number}</span>
                    <div>
                      <h3 className="font-display text-3xl md:text-4xl font-semibold md:font-bold">{item.title}</h3>
                      {item.keywords && item.keywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.keywords.map((kw) => (
                            <span key={kw} className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </article>
                </Reveal>
              ))}
              <Reveal delay={400}>
                <div className="mt-8 border-t border-border pt-6">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
                    {locale === "fr"
                      ? "Vous n'avez pas besoin de tout acheter. Nous partons du problème que vous avez aujourd'hui."
                      : "You don't need to buy everything. We start from the problem you have today."}
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing / The 3 Offers ─── */}
      <section id="offers" className="relative overflow-hidden bg-mint px-5 py-14 sm:py-20 md:py-28 lg:px-14">
        {/* Soft liquid ambient lighting orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-forest/10 blur-3xl animate-liquid-glow"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-gold/20 blur-3xl animate-liquid-glow"
          style={{ animationDelay: "3s" }}
        />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-8 sm:mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/70">
                  {t.offers.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium md:text-6xl">
                  {t.offers.title}
                </h2>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-foreground/60">
                {t.offers.subtitle}
              </p>
            </div>
          </Reveal>

          <div className="mb-8 flex justify-start md:justify-end">
            <CurrencySwitcher variant="light" />
          </div>

          {/* 3-card clean architecture matching Strategy Document */}
          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {offers.slice(0, 3).map((offer, index) => {
              const localized = getLocalizedOffer(offer, locale);
              const p = formatOfferPriceStructured(offer);
              const isFeatured = index === 1;

              return (
                <Reveal key={offer.id} delay={index * 100} className="h-full">
                  <LiquidGlassCard
                    variant="light"
                    className={`flex h-full flex-col p-6 sm:p-8 transition-all duration-300 ${
                      isFeatured
                        ? "ring-2 ring-primary/20 shadow-2xl relative bg-background/90 md:-translate-y-2"
                        : "hover:shadow-xl hover:border-foreground/20"
                    }`}
                  >
                    {/* Header: index + badge + duration */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-border/70 bg-background/80 px-2.5 py-0.5 text-[11px] font-mono font-medium text-foreground/70">
                          {offer.index}
                        </span>
                        {isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                            <Sparkles className="size-3" />
                            {locale === "fr" ? "Système complet" : "Core system"}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
                        {localized.duration}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-5 font-display text-2xl sm:text-3xl font-semibold leading-tight text-foreground">
                      {localized.name}
                    </h3>

                    {/* Elevated Price Block */}
                    <div className="my-5 rounded-xl border border-border/60 bg-foreground/[0.02] p-4 transition-colors">
                      <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/70">
                        {p.prefix}
                      </span>
                      <div className="mt-1 flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
                        <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-primary tabular-nums">
                          {p.amount}
                        </span>
                        {p.vatNote && (
                          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80 font-medium">
                            {p.vatNote}
                          </span>
                        )}
                        {p.suffix && (
                          <span className="text-sm font-normal text-muted-foreground">
                            {p.suffix}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tagline */}
                    <p className="text-xs sm:text-sm leading-relaxed text-foreground/70 min-h-[44px]">
                      {localized.tagline}
                    </p>

                    {/* Key inclusions preview */}
                    <div className="my-5 space-y-2 border-t border-border/40 pt-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60">
                        {locale === "fr" ? "Ce que cela peut couvrir" : "What this can cover"}
                      </p>
                      <ul className="space-y-2">
                        {localized.includes.slice(0, 3).map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
                            <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Check className="size-2.5" />
                            </span>
                            <span className="line-clamp-2">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-auto flex flex-col gap-2.5 pt-2">
                      <Button
                        asChild
                        variant={isFeatured ? "volka" : "outline"}
                        size="volka"
                        className={`w-full justify-between transition-transform active:scale-[0.99] ${
                          !isFeatured ? "hover:bg-primary hover:text-primary-foreground border-foreground/20" : ""
                        }`}
                      >
                        <Link to="/start" search={{ offer: offer.id }}>
                          <span>{localized.cta}</span>
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                      <Link
                        to="/offres/$slug"
                        params={{ slug: offer.slug }}
                        className="text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground py-1"
                      >
                        {t.offers.learnMore}
                      </Link>
                    </div>
                  </LiquidGlassCard>
                </Reveal>
              );
            })}
          </div>

          <p className="mt-8 sm:mt-10 text-center text-xs leading-relaxed text-foreground/60 max-w-3xl mx-auto">
            {t.offers.pricingNote}
          </p>
        </div>
      </section>

      {/* ─── Free Audit block ─── */}
      <section id="audit" className="border-t border-border bg-ivory px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                  {locale === "fr" ? "Première étape sans engagement" : "A free first step"}
                </p>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium md:text-5xl text-primary">
                  {locale === "fr" ? "Audit croissance gratuit." : "Free growth audit."}
                </h2>
                <p className="mt-4 text-sm md:text-base leading-relaxed text-muted-foreground">
                  {locale === "fr"
                    ? "Un diagnostic écrit d'une partie de votre système de croissance, à partir d'informations publiques et de vos réponses. Il identifie les principaux points de friction, propose des actions prioritaires et indique l'offre la plus pertinente."
                    : "A written diagnosis of one part of your growth system, based on public information and your answers. It identifies the main friction points, suggests priority actions, and points to the most relevant way to work together."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground/75">
                  {locale === "fr"
                    ? "Gratuit, avec un nombre de places limité chaque mois. Ce n'est ni un devis, ni une mise en œuvre, ni une garantie de résultat."
                    : "Free, with a limited number of spots each month. It is not a quote, an implementation, or a guarantee of results."}
                </p>
              </div>
              <div className="shrink-0">
                <Button asChild variant="volka" size="volka" className="w-full sm:w-auto">
                  <Link to="/audit">
                    {locale === "fr" ? "Demander mon audit gratuit" : "Request my free audit"} <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer / CTA ─── */}
      <SiteFooter />
    </main>
  );
}
