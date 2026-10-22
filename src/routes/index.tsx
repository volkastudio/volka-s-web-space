import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import { CountUp } from "@/components/count-up";
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
      { title: "Volka — Systèmes de croissance & Studio digital" },
      {
        name: "description",
        content:
          "Volka construit les systèmes qui soutiennent la croissance des entreprises : Perception, Acquisition, Conversion, Ventes et Automatisation.",
      },
      { property: "og:title", content: "Volka — Les systèmes derrière la croissance" },
      {
        property: "og:description",
        content:
          "Nous aidons les entreprises à attirer, convertir et fidéliser leurs clients grâce à des systèmes digitaux cohérents.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
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
  const { locale, t, formatPrice } = useI18n();

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
              alt="A creative professional entering a contemporary studio in Cotonou"
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
            {[
              { to: 40, suffix: "+", label: t.stats.projects },
              { to: 8, suffix: " yrs", label: t.stats.experience },
              { to: 12, suffix: "", label: t.stats.countries },
              { to: 95, suffix: "%", label: t.stats.satisfaction },
            ].map(({ to, suffix, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <p className="font-display text-5xl font-medium text-primary md:text-6xl">
                  <CountUp to={to} suffix={suffix} duration={1.6} />
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
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

          {/* 3-card clean architecture matching Strategy Document */}
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {offers.slice(0, 3).map((offer, index) => {
              const localized = getLocalizedOffer(offer, locale);
              return (
                <Reveal key={offer.id} delay={index * 100}>
                  <LiquidGlassCard
                    variant="light"
                    className="flex h-full min-h-0 md:min-h-[420px] flex-col p-5 sm:p-7 md:p-8 transition-shadow hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]">
                        {offer.index}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {localized.duration}
                      </span>
                    </div>

                    <h3 className="mt-5 sm:mt-8 font-display text-2xl sm:text-3xl lg:text-4xl font-semibold">{localized.name}</h3>
                    <p className="mt-2 sm:mt-3 text-sm font-medium uppercase tracking-[0.12em] text-primary/80">
                      {formatPrice(offer.prices)}
                    </p>
                    <p className="mt-4 sm:mt-6 text-sm leading-relaxed text-foreground/75">
                      {localized.tagline}
                    </p>

                    <div className="mt-auto pt-6 sm:pt-8 flex flex-col gap-3">
                      <Button asChild variant="volka" size="volka" className="w-full justify-between">
                        <Link to="/start" search={{ offer: offer.id }}>
                          {localized.cta} <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                      <Link
                        to="/offres/$slug"
                        params={{ slug: offer.slug }}
                        className="text-center text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
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

      {/* ─── Footer / CTA ─── */}
      <SiteFooter />
    </main>
  );
}
