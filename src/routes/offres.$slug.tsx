import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Clock, ArrowLeft } from "lucide-react";

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
    return {
      meta: [
        { title: `${offer?.name ?? "Offre"} — Volka Studio` },
        {
          name: "description",
          content: offer?.tagline ?? "Découvrez nos offres d'accompagnement et systèmes de croissance.",
        },
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

// Visual accent per offer index
const offerAccents: Record<string, { bg: string; accent: string; orb1: string; orb2: string }> = {
  "01": {
    bg: "bg-primary",
    accent: "text-gold",
    orb1: "bg-gold/15",
    orb2: "bg-mint/10",
  },
  "02": {
    bg: "bg-forest",
    accent: "text-mint",
    orb1: "bg-mint/15",
    orb2: "bg-gold/10",
  },
  "03": {
    bg: "bg-primary",
    accent: "text-gold",
    orb1: "bg-gold/10",
    orb2: "bg-mint/15",
  },
};

function OfferPage() {
  const { offer: baseOffer } = Route.useLoaderData();
  const { locale, formatOfferPrice, formatOfferPriceStructured, t } = useI18n();
  const isFr = locale === "fr";
  const offer = getLocalizedOffer(baseOffer, locale);
  const accent = offerAccents[offer.index] ?? offerAccents["01"]!;

  // Adjacent offer for "next" navigation
  const currentIdx = offers.findIndex((o) => o.id === baseOffer.id);
  const nextOffer = offers[(currentIdx + 1) % offers.length]!;
  const localizedNext = getLocalizedOffer(nextOffer, locale);

  return (
    <main className="bg-background text-foreground">
      <SiteHeader />

      {/* ─── Hero band ─── */}
      <section className={`relative overflow-hidden ${accent.bg} px-5 py-20 text-primary-foreground md:px-10 md:py-32 lg:px-14`}>
        {/* Ambient orbs */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full ${accent.orb1} blur-3xl animate-liquid-glow`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full ${accent.orb2} blur-3xl animate-liquid-glow`}
          style={{ animationDelay: "4s" }}
        />

        <div className="relative mx-auto max-w-7xl">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <Link
              to="/"
              hash="services"
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground/50 transition-colors hover:text-primary-foreground"
            >
              <ArrowLeft className="size-3.5" /> {isFr ? "Retour aux offres" : "Back to offers"}
            </Link>
          </motion.div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_auto]">
            <div>
              <motion.p
                className={`text-xs font-medium uppercase tracking-[0.2em] ${accent.accent}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
              >
                {isFr ? `Offre ${offer.index}` : `Offer ${offer.index}`}
              </motion.p>

              <motion.h1
                className="mt-4 font-display text-5xl font-medium leading-none md:text-7xl lg:text-8xl"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: easeOut }}
              >
                {offer.name}
              </motion.h1>

              <motion.p
                className="mt-8 max-w-2xl text-xl font-light leading-relaxed text-primary-foreground/75"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.35, ease: easeOut }}
              >
                {offer.tagline}
              </motion.p>
            </div>

            {/* Price block */}
            <motion.div
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-md lg:items-end lg:text-right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: easeOut }}
            >
              {(() => {
                const p = formatOfferPriceStructured(offer);
                return (
                  <div className="flex flex-col gap-1.5 lg:items-end">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary-foreground/60">
                      {p.prefix}
                    </span>
                    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 lg:justify-end">
                      <span className={`font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight tabular-nums ${accent.accent}`}>
                        {p.amount}
                      </span>
                      {p.vatNote && (
                        <span className="text-xs font-mono uppercase tracking-wider text-primary-foreground/60 font-medium">
                          {p.vatNote}
                        </span>
                      )}
                      {p.suffix && (
                        <span className="text-base sm:text-lg font-light text-primary-foreground/70">
                          {p.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary-foreground/60 font-medium">
                <Clock className="size-3.5" />
                {offer.duration}
              </span>
              <div className="pt-1">
                <CurrencySwitcher variant="dark" />
              </div>
              <Button asChild variant="volka" size="volka" className="mt-2 w-full sm:w-auto">
                <Link to="/start" search={{ offer: offer.id }}>
                  {offer.cta} <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Inclusions ─── */}
      <section className="px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t.offerDetail.whatsIncluded}
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium md:text-5xl">
              {isFr ? "Exemples d'interventions" : "Potential interventions"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t.offerDetail.whatsIncludedSubtitle}
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offer.includes.map((item, idx) => (
              <Reveal key={item} delay={idx * 60}>
                <div className="flex h-full flex-col justify-between border border-border bg-ivory/50 p-7 transition-colors hover:border-gold">
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                      <Check className="size-3" />
                    </span>
                    <p className="text-base font-light leading-relaxed text-foreground">{item}</p>
                  </div>
                  <span className="mt-6 text-xs text-muted-foreground/40 font-mono">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-12 text-xs leading-relaxed text-muted-foreground">
            {t.offers.pricingNote}
          </p>
        </div>
      </section>

      {/* ─── How it works (Process) ─── */}
      <section className="border-t border-border bg-ivory/40 px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              {t.offerDetail.howItWorks}
            </p>
            <h2 className="mt-4 font-display text-4xl font-medium md:text-5xl">
              {t.offerDetail.howItWorksTitle}
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.offerDetail.steps.map((st) => (
              <Reveal key={st.n} delay={Number(st.n) * 80}>
                <div className="flex h-full flex-col justify-between border border-border bg-background p-7">
                  <div>
                    <span className="text-xs font-mono font-medium text-gold">{st.n}</span>
                    <h3 className="mt-4 font-display text-2xl font-medium">{st.title}</h3>
                    <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                      {st.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="border-t border-border bg-mint px-5 py-20 text-foreground md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">
                  {t.offerDetail.readyTitle}
                </p>
                <h2 className="mt-4 font-display text-5xl font-medium md:text-7xl">
                  {t.offerDetail.readyHeadline}
                </h2>
                <p className="mt-4 max-w-xl text-lg font-light text-foreground/80">
                  {isFr
                    ? "Partagez votre situation, vos priorités et vos objectifs. Nous étudions votre demande avec attention avant de vous proposer la suite la plus pertinente."
                    : "Tell us about your business, priorities, and objectives. We will review your request carefully before suggesting the most relevant next step."}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild variant="volka" size="volka">
                  <Link to="/start" search={{ offer: offer.id }}>
                    {offer.cta} <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Next offer band ─── */}
      {nextOffer && (
        <section className="border-t border-border bg-background px-5 py-14 md:px-10 lg:px-14">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {isFr ? "Autre formule" : "Alternative offer"}
            </span>
            <Link
              to="/offres/$slug"
              params={{ slug: nextOffer.slug }}
              className="group inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.14em] text-foreground transition-colors hover:text-gold"
            >
              {localizedNext.name}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
