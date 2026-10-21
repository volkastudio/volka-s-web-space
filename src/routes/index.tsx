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
import { caseStudies } from "@/data/case-studies";
import { getFeaturedCaseStudies } from "@/lib/cases.functions";
import { offers } from "@/data/offers";
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
      { title: "Volka — Digital agency rooted in West Africa" },
      {
        name: "description",
        content:
          "Volka builds distinctive brands, high-performing websites, and digital systems for ambitious businesses in and around West Africa.",
      },
      { property: "og:title", content: "Volka — Bold by design" },
      {
        property: "og:description",
        content:
          "Global standards. Local understanding. Digital work built to move ambitious businesses forward.",
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
    <a href="#work" className="group flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em]">
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
  const { t, formatPrice } = useI18n();
  const displayedCases =
    featuredStudies && featuredStudies.length > 0 ? featuredStudies : caseStudies;

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
        <motion.div
          className="absolute inset-0 bg-primary/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />

        {/* Overlay header — sits on top of the hero */}
        <SiteHeader variant="overlay" />

        <div
          id="top"
          className="relative z-10 mx-auto flex min-h-[calc(92svh-96px)] max-w-7xl flex-col justify-end px-5 pb-12 pt-24 md:px-10 md:pb-16 md:pt-0 lg:px-14"
        >
          <motion.p
            className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-mint"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: easeOut }}
          >
            {t.hero.eyebrow}
          </motion.p>

          {/* Hero headline — uses SplitHeading for the word-by-word wipe animation */}
          <div className="overflow-hidden">
            <h1
              aria-label={`${t.hero.titleLine1} ${t.hero.titleLine2}`}
              className="max-w-5xl font-display text-6xl font-semibold leading-[0.88] md:text-8xl lg:text-[7.4rem]"
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

      {/* ─── Marquee ribbon: Light background, Dark Green text, Horizontal slide with instant hover pause ─── */}
      <section className="border-y border-border/80 bg-background py-3.5 md:py-4">
        <Marquee
          speed={32}
          items={t.marquee}
          variant="light"
        />
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
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <Reveal delay={100}>
                <p className="text-lg font-light leading-relaxed text-muted-foreground">
                  {t.studio.p1}
                </p>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-lg font-light leading-relaxed text-muted-foreground">
                  {t.studio.p2}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Selected work ─── */}
      <section id="work" className="bg-forest px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-12 flex items-end justify-between border-b border-primary-foreground/20 pb-6">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-mint">
                  {t.work.eyebrow}
                </p>
                <SplitHeading as="h2" className="font-display text-5xl font-medium md:text-7xl">
                  {t.work.title}
                </SplitHeading>
              </div>
              <Link
                to="/cases"
                className="hidden text-xs uppercase tracking-[0.16em] text-primary-foreground/60 hover:text-mint md:block"
              >
                {t.work.allCases}
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-10 md:grid-cols-2">
            {displayedCases.slice(0, 2).map((study, index) => (
              <Reveal key={study.slug} delay={index * 120}>
                <article className={index === 1 ? "md:mt-20" : ""}>
                  <Link to="/cases/$slug" params={{ slug: study.slug }} className="group block">
                    <CursorFollower label={t.work.viewProject}>
                      <div className="aspect-[4/3] overflow-hidden rounded-sm bg-primary">
                        <ImageReveal delay={index * 120}>
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

      {/* ─── Services ─── */}
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
                    <span className="text-xs text-gold">{item.number}</span>
                    <h3 className="font-display text-3xl md:text-4xl">{item.title}</h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing / Formules (Single "En savoir plus" button, clean design) ─── */}
      <section className="relative overflow-hidden bg-mint px-5 py-20 md:px-10 md:py-28 lg:px-14">
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
            <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/70">
                  {t.offers.eyebrow}
                </p>
                <h2 className="mt-3 font-display text-4xl font-medium md:text-6xl">
                  {t.offers.title}
                </h2>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-foreground/60">
                {t.offers.subtitle}
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {offers.slice(0, 3).map((offer, index) => (
              <Reveal key={offer.id} delay={index * 100}>
                <LiquidGlassCard
                  variant="light"
                  className="flex h-full min-h-[420px] flex-col p-8 transition-shadow hover:shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]">
                      {offer.index}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {offer.duration}
                    </span>
                  </div>

                  <h3 className="mt-8 font-display text-4xl">{offer.name}</h3>
                  <p className="mt-3 text-3xl font-light text-primary">{formatPrice(offer.prices)}</p>
                  <p className="mt-6 text-sm leading-relaxed text-foreground/75">{offer.tagline}</p>

                  <div className="mt-auto pt-8">
                    <Button asChild variant="volka" size="volka" className="w-full justify-between">
                      <Link to="/offres/$slug" params={{ slug: offer.id.toLowerCase().replace(/\s+/g, "-") }}>
                        {t.offers.learnMore} <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </LiquidGlassCard>
              </Reveal>
            ))}
          </div>

          {/* 4th offer — Accompagnement */}
          <Reveal delay={300}>
            <div className="mt-6 flex flex-col gap-5 border border-border/50 bg-background/50 p-8 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-6">
                <span className="font-display text-3xl font-medium text-primary/30">{offers[3]?.index}</span>
                <div>
                  <h3 className="font-display text-3xl">{offers[3]?.name}</h3>
                  <p className="mt-1 max-w-md text-sm leading-relaxed text-foreground/65">{offers[3]?.tagline}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Button asChild variant="volka" size="volka">
                  <Link to="/offres/$slug" params={{ slug: offers[3]!.id.toLowerCase().replace(/\s+/g, "-") }}>
                    {t.offers.learnMore} <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>

          <p className="mt-8 text-center text-xs text-foreground/60">{t.offers.currencyNote}</p>
        </div>
      </section>

      {/* ─── Footer / CTA ─── */}
      <SiteFooter />
    </main>
  );
}
