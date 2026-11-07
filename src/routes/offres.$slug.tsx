import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Clock, ArrowLeft, HelpCircle, AlertCircle, ArrowRight } from "lucide-react";

import { CurrencySwitcher } from "@/components/currency-switcher";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getOffer, getLocalizedOffer, offers } from "@/data/offers";
import { useI18n } from "@/i18n/context";

export const Route = createFileRoute("/offres/$slug")({
  loader: ({ params }) => {
    const offer = getOffer(params.slug);
    if (!offer) throw notFound();
    return { offer };
  },
  head: ({ loaderData }) => {
    const offer = loaderData?.offer;
    if (!offer) {
      return {
        meta: [{ title: "Offre introuvable — Volka Studio" }, { name: "robots", content: "noindex" }],
      };
    }

    const seoMeta: Record<string, { title: string; description: string }> = {
      "resoudre-un-probleme-precis": {
        title: "Résoudre un problème précis — Intervention ciblée dès 750 € | Volka Studio",
        description:
          "Une intervention ciblée pour débloquer un point de friction identifié : positionnement, conversion, flux CRM ou automatisation. Périmètre clair, dès 750 € HT.",
      },
      "construire-un-systeme-de-croissance-coherent": {
        title: "Construire un système de croissance cohérent — Dès 2 500 € | Volka Studio",
        description:
          "Reliez les bons éléments de votre activité : marque, site web, acquisition et suivi commercial coordonnés autour d'un même objectif. À partir de 2 500 € HT.",
      },
      "faire-progresser-le-systeme-dans-la-duree": {
        title: "Accompagnement continu & Optimisation — Dès 500 €/mois | Volka Studio",
        description:
          "Accompagnement récurrent pour piloter, mesurer et optimiser votre système : campagnes, contenus, conversion et suivi commercial. À partir de 500 € HT/mois.",
      },
    };

    const currentSeo = seoMeta[offer.slug] ?? {
      title: `${offer.name} — Volka Studio`,
      description: offer.tagline,
    };

    return {
      meta: [
        { title: currentSeo.title },
        { name: "description", content: currentSeo.description },
        { property: "og:title", content: currentSeo.title },
        { property: "og:description", content: currentSeo.description },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: OfferPage,
  notFoundComponent: OfferNotFound,
});

function OfferNotFound() {
  const { locale } = useI18n();
  const isFr = locale === "fr";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-24 text-center md:px-10 md:py-32">
        <img
          src="/vectors/project_not_found.svg"
          alt="Offre introuvable"
          width={500}
          height={500}
          className="mx-auto h-48 w-auto md:h-64 object-contain"
        />
        <h1 className="mt-8 font-display text-4xl font-medium md:text-6xl">
          {isFr ? "Cette offre n'existe pas." : "This offer does not exist."}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {isFr
            ? "L'offre que vous cherchez a peut-être évolué ou a été remplacée."
            : "The offer you're looking for may have been updated or moved."}
        </p>
        <Button asChild variant="volka" size="volka" className="mt-8">
          <Link to="/" hash="services">
            {isFr ? "Voir toutes nos offres" : "View all offers"}
          </Link>
        </Button>
      </section>
      <SiteFooter />
    </main>
  );
}

const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Distinct ambient glow per offer
const offerVisualThemes: Record<
  string,
  {
    accentText: string;
    orbPrimary: string;
    orbSecondary: string;
    badgeBg: string;
  }
> = {
  "01": {
    accentText: "text-gold",
    orbPrimary: "bg-gold/15",
    orbSecondary: "bg-amber-500/10",
    badgeBg: "border-gold/30 bg-gold/10 text-gold",
  },
  "02": {
    accentText: "text-mint",
    orbPrimary: "bg-mint/15",
    orbSecondary: "bg-emerald-500/10",
    badgeBg: "border-mint/30 bg-mint/10 text-mint",
  },
  "03": {
    accentText: "text-gold",
    orbPrimary: "bg-gold/12",
    orbSecondary: "bg-mint/15",
    badgeBg: "border-gold/30 bg-gold/10 text-gold",
  },
};

function OfferPage() {
  const { offer: baseOffer } = Route.useLoaderData();
  const { locale, formatOfferPriceStructured, t } = useI18n();
  const isFr = locale === "fr";
  const offer = getLocalizedOffer(baseOffer, locale);
  const theme = offerVisualThemes[offer.index] ?? offerVisualThemes["01"]!;
  const priceStructured = formatOfferPriceStructured(offer);

  // Alternative offer recommendation from fitGuide
  const recommendedAlternative = offer.fitGuide.recommendedAlternativeSlug
    ? getOffer(offer.fitGuide.recommendedAlternativeSlug)
    : null;
  const localizedRecommended = recommendedAlternative
    ? getLocalizedOffer(recommendedAlternative, locale)
    : null;

  return (
    <main className="bg-background text-foreground pb-24 md:pb-0">
      {/* ─── Full-screen Hero ─── */}
      <section className="relative isolate min-h-svh flex flex-col justify-between overflow-hidden bg-forest-black text-primary-foreground">
        {/* Subtle code-made background lines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "80px 100%",
          }}
        />

        {/* Ambient liquid glow tailored per offer */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full ${theme.orbPrimary} blur-3xl animate-liquid-glow`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full ${theme.orbSecondary} blur-3xl animate-liquid-glow`}
          style={{ animationDelay: "3.5s" }}
        />

        {/* Floating frosted SiteHeader */}
        <SiteHeader variant="overlay" />

        {/* Hero content container */}
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pt-32 pb-14 md:px-10 md:pt-40 md:pb-20 lg:px-14">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="mb-8"
          >
            <Link
              to="/"
              hash="services"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground/50 transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="size-3.5" /> {t.offerDetail.backToOffers}
            </Link>
          </motion.div>

          {/* Big number watermark + Content grid */}
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              {/* Big "01 / 02 / 03" Display Tag */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
                className="flex items-center gap-4"
              >
                <span className="font-display text-6xl sm:text-7xl md:text-8xl font-light text-white/20 select-none tracking-tighter">
                  {offer.index}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] ${theme.badgeBg}`}
                >
                  {isFr ? `Offre ${offer.index}` : `Offer ${offer.index}`} · {offer.duration}
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1
                className="mt-4 font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight text-balance leading-[0.98]"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: easeOut }}
              >
                {offer.name}
              </motion.h1>

              {/* Tagline */}
              <motion.p
                className="mt-6 max-w-2xl text-lg sm:text-xl font-light leading-relaxed text-primary-foreground/80"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.35, ease: easeOut }}
              >
                {offer.tagline}
              </motion.p>
            </div>

            {/* Price block & Rectangular Button */}
            <motion.div
              className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-md lg:min-w-[340px]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: easeOut }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary-foreground/60">
                  {priceStructured.prefix}
                </span>
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <span
                    className={`font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight tabular-nums ${theme.accentText}`}
                  >
                    {priceStructured.amount}
                  </span>
                  {priceStructured.vatNote && (
                    <span className="text-xs font-mono uppercase tracking-wider text-primary-foreground/60 font-medium">
                      {priceStructured.vatNote}
                    </span>
                  )}
                  {priceStructured.suffix && (
                    <span className="text-base sm:text-lg font-light text-primary-foreground/70">
                      {priceStructured.suffix}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <CurrencySwitcher variant="dark" />
              </div>

              {/* One clean rectangular button */}
              <Button asChild variant="volka" size="volka" className="mt-2 w-full rounded-sm">
                <Link to="/start" search={{ offer: offer.id }}>
                  <span>{offer.cta}</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Mobile Sticky Bar (price + button pinned at bottom) ─── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-forest-black/95 backdrop-blur-md border-t border-white/15 px-5 py-3.5 flex items-center justify-between md:hidden shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary-foreground/60">
            {priceStructured.prefix}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-display text-2xl font-bold ${theme.accentText}`}>
              {priceStructured.amount}
            </span>
            {priceStructured.vatNote && (
              <span className="text-[10px] font-mono uppercase text-primary-foreground/60">
                {priceStructured.vatNote}
              </span>
            )}
            {priceStructured.suffix && (
              <span className="text-xs text-primary-foreground/60">{priceStructured.suffix}</span>
            )}
          </div>
        </div>

        <Button asChild variant="volka" size="sm" className="rounded-sm px-5 py-2.5 text-xs">
          <Link to="/start" search={{ offer: offer.id }}>
            <span>{offer.cta}</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {/* ─── Inclusions: Numbered list with thin dividing lines ─── */}
      <section className="bg-background px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t.offerDetail.whatsIncluded}
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl">
              {t.offerDetail.whatsIncluded}
            </h2>
            <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
              {t.offerDetail.whatsIncludedSubtitle}
            </p>
          </Reveal>

          {/* Numbered rows with thin dividing lines (like homepage services) */}
          <div className="mt-14 divide-y divide-border border-y border-border">
            {offer.includes.map((item, idx) => (
              <Reveal key={item} delay={idx * 60}>
                <div className="group flex items-baseline gap-6 md:gap-10 py-6 md:py-8 transition-colors hover:bg-muted/20 px-2 sm:px-4">
                  <span className="font-mono text-xs md:text-sm font-semibold text-gold shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="font-display text-xl md:text-2xl font-light leading-snug text-foreground group-hover:text-gold transition-colors">
                    {item}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-10 text-xs leading-relaxed text-muted-foreground/80 max-w-3xl">
            {t.offers.pricingNote}
          </p>
        </div>
      </section>

      {/* ─── Fit Guide: "For you if / Not for you if" + Orientation ─── */}
      <section className="border-t border-border bg-background px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {t.offerDetail.fitGuideTitle}
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl">
              {isFr ? "Cette offre vous correspond-elle ?" : "Is this the right fit for you?"}
            </h2>
            <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
              {t.offerDetail.fitGuideSubtitle}
            </p>
          </Reveal>

          {/* 2-column Fit Guide comparison */}
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {/* For you if... */}
            <Reveal delay={100}>
              <div className="h-full rounded-2xl border border-border bg-muted/20 p-7 sm:p-9">
                <div className="flex items-center gap-3 border-b border-border/80 pb-5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                    <Check className="size-4" />
                  </span>
                  <h3 className="font-display text-2xl font-medium">
                    {t.offerDetail.forYouIfTitle}
                  </h3>
                </div>

                <ul className="mt-6 space-y-5">
                  {offer.fitGuide.forYouIf.map((q, i) => (
                    <li key={i} className="flex items-start gap-4 text-sm font-light leading-relaxed text-foreground/90">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Not for you if... */}
            <Reveal delay={200}>
              <div className="h-full rounded-2xl border border-border bg-muted/20 p-7 sm:p-9">
                <div className="flex items-center gap-3 border-b border-border/80 pb-5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                    <AlertCircle className="size-4" />
                  </span>
                  <h3 className="font-display text-2xl font-medium">
                    {t.offerDetail.notForYouIfTitle}
                  </h3>
                </div>

                <ul className="mt-6 space-y-5">
                  {offer.fitGuide.notForYouIf.map((q, i) => (
                    <li key={i} className="flex items-start gap-4 text-sm font-light leading-relaxed text-muted-foreground">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500/60" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Orientation callout */}
          <Reveal delay={300}>
            <div className="mt-10 rounded-2xl border border-gold/30 bg-gold/5 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <p className="text-xs font-mono font-medium uppercase tracking-[0.18em] text-gold">
                  {t.offerDetail.orientationTitle}
                </p>
                <p className="mt-2 text-base font-light leading-relaxed text-foreground">
                  {offer.fitGuide.guidance}
                </p>
              </div>

              {localizedRecommended && (
                <Button
                  asChild
                  variant="outline"
                  className="shrink-0 border-gold/40 text-foreground hover:bg-gold hover:text-forest-black transition-colors rounded-sm"
                >
                  <Link to="/offres/$slug" params={{ slug: localizedRecommended.slug }}>
                    <span>{localizedRecommended.name}</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Process: Simple numbered timeline ─── */}
      <section className="border-t border-border bg-background px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {t.offerDetail.howItWorks}
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl">
              {t.offerDetail.howItWorksTitle}
            </h2>
          </Reveal>

          {/* Numbered timeline */}
          <div className="relative mt-16">
            {/* Connecting horizontal line on desktop */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-6 left-0 right-0 h-[1px] bg-border"
            />

            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
              {t.offerDetail.steps.map((st, idx) => (
                <Reveal key={st.n} delay={idx * 100}>
                  <div className="relative flex flex-col">
                    {/* Step indicator node */}
                    <div className="relative flex items-center mb-6">
                      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-background text-sm font-mono font-semibold text-gold shadow-sm group-hover:border-gold">
                        {st.n}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl font-medium text-foreground">
                      {st.title}
                    </h3>
                    <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                      {st.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Choosing between offers: Full-width comparative strip ─── */}
      <section className="border-t border-border bg-muted/20 px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  {t.offerDetail.compareTitle}
                </p>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight">
                  {t.offerDetail.compareTitle}
                </h2>
              </div>
              <p className="max-w-md text-sm font-light text-muted-foreground">
                {t.offerDetail.compareSubtitle}
              </p>
            </div>
          </Reveal>

          {/* 3-column side-by-side comparison strip */}
          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {offers.map((item) => {
              const loc = getLocalizedOffer(item, locale);
              const p = formatOfferPriceStructured(item);
              const isCurrent = item.id === baseOffer.id;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-2xl border p-7 sm:p-8 transition-all ${
                    isCurrent
                      ? "border-gold/60 bg-gold/[0.04] shadow-lg ring-1 ring-gold/30"
                      : "border-border bg-background hover:border-gold/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium text-gold">
                        {item.index}
                      </span>
                      {isCurrent ? (
                        <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-mono font-medium text-gold uppercase tracking-wider">
                          {t.offerDetail.currentOffer}
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          {loc.duration}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 font-display text-2xl font-medium leading-snug">
                      {loc.name}
                    </h3>

                    <div className="mt-4 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xs font-mono uppercase text-muted-foreground">
                        {p.prefix}
                      </span>
                      <span className="font-display text-2xl font-bold text-foreground">
                        {p.amount}
                      </span>
                      {p.vatNote && (
                        <span className="text-[11px] font-mono uppercase text-muted-foreground">
                          {p.vatNote}
                        </span>
                      )}
                      {p.suffix && (
                        <span className="text-xs text-muted-foreground">{p.suffix}</span>
                      )}
                    </div>

                    <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
                      {loc.tagline}
                    </p>
                  </div>

                  <div className="mt-8 border-t border-border/60 pt-5">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold font-medium">
                        <Check className="size-3.5" /> {t.offerDetail.currentOffer}
                      </span>
                    ) : (
                      <Link
                        to="/offres/$slug"
                        params={{ slug: item.slug }}
                        className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:text-gold"
                      >
                        <span>{t.offerDetail.viewOffer}</span>
                        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Single Dark Closing CTA Block ─── */}
      <section className="relative isolate overflow-hidden bg-forest-black px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14 border-t border-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gold/10 blur-3xl animate-liquid-glow"
        />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-mint">
                  {t.offerDetail.readyTitle}
                </p>
                <h2 className="mt-4 font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-balance">
                  {t.offerDetail.readyHeadline}
                </h2>
                <p className="mt-4 text-base sm:text-lg font-light leading-relaxed text-primary-foreground/80">
                  {t.offerDetail.readyBody}
                </p>
              </div>

              <div>
                <Button asChild variant="volka" size="volka" className="rounded-sm">
                  <Link to="/start" search={{ offer: offer.id }}>
                    <span>{offer.cta}</span>
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
