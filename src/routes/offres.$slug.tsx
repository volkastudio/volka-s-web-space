import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Clock, ArrowLeft } from "lucide-react";

import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getOffer, offers } from "@/data/offers";
import { useI18n } from "@/i18n/context";

export const Route = createFileRoute("/offres/$slug")({
  loader: ({ params }) => {
    const offer = offers.find((o) => o.id.toLowerCase().replace(/\s+/g, "-") === params.slug);
    if (!offer) throw notFound();
    return { offer };
  },
  component: OfferPage,
  head: ({ loaderData }) => {
    const offer = loaderData?.offer;
    return {
      meta: [
        { title: `${offer?.name ?? "Offre"} — Volka Studio` },
        {
          name: "description",
          content: offer?.tagline ?? "Découvrez nos formules d'engagement sur mesure.",
        },
        { property: "og:type", content: "website" },
      ],
    };
  },
});

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
  "04": {
    bg: "bg-forest",
    accent: "text-mint",
    orb1: "bg-mint/10",
    orb2: "bg-gold/15",
  },
};

function OfferPage() {
  const { offer } = Route.useLoaderData();
  const { formatPrice } = useI18n();
  const accent = offerAccents[offer.index] ?? offerAccents["01"]!;

  // Adjacent offer for "next" navigation
  const currentIdx = offers.findIndex((o) => o.id === offer.id);
  const nextOffer = offers[(currentIdx + 1) % offers.length];

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
              <ArrowLeft className="size-3.5" /> Retour aux formules
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
                Formule {offer.index}
              </motion.p>

              <motion.h1
                className="mt-4 font-display text-6xl font-medium leading-none md:text-8xl"
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
              className="flex flex-col gap-4 lg:items-end lg:text-right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: easeOut }}
            >
              <p className="text-4xl font-light md:text-5xl">{formatPrice({ xof: offer.prices.xof, eur: offer.prices.eur, usd: offer.prices.usd })}</p>
              <div className={`flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] ${accent.accent}`}>
                <Clock className="size-4" />
                {offer.duration}
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            className="mt-12 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: easeOut }}
          >
            <Button asChild variant="volka" size="volka" className="bg-gold border-gold text-primary hover:bg-gold/90">
              <Link to="/start" search={{ offer: offer.id }}>
                Lancer ce projet <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── What's included ─── */}
      <section className="border-b border-border px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.65fr_1.35fr]">
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Ce qui est inclus
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-xs">
                Chaque formule est livrée avec un périmètre précis et un engagement qualité sans compromis.
              </p>
            </Reveal>

            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                {offer.includes.map((item, i) => (
                  <Reveal key={item} delay={i * 70}>
                    <div className="flex items-start gap-4 border border-border p-5 transition-colors hover:border-primary">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="size-3.5 text-primary-foreground" />
                      </span>
                      <p className="text-base leading-snug">{item}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Process / how it works ─── */}
      <section className="bg-ivory px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Comment ça fonctionne
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-tight md:text-6xl">
              Un processus clair,<br />du brief à la livraison.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Brief",
                desc: "Vous partagez votre vision, vos objectifs et vos contraintes via notre formulaire structuré.",
              },
              {
                n: "02",
                title: "Cadrage",
                desc: "Nous analysons votre demande et vous répondons sous un jour ouvré avec un périmètre précis et un tarif ferme.",
              },
              {
                n: "03",
                title: "Livraison",
                desc: "On travaille selon votre formule. Chaque livrable est soigné, ponctuel, et dépasse vos attentes.",
              },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 100}>
                <article className="border-t-2 border-primary pt-6">
                  <p className="font-display text-5xl font-medium text-primary/20">{step.n}</p>
                  <h3 className="mt-4 font-display text-3xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA / Next offer ─── */}
      <section className="bg-primary px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Prêt à commencer ?</p>
              <h2 className="mt-4 font-display text-5xl font-medium leading-tight md:text-7xl">
                Lancez votre projet<br />dès aujourd'hui.
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <div className="flex flex-col gap-4 md:items-end">
                <Button asChild variant="volka" size="volka" className="bg-gold border-gold text-primary hover:bg-gold/90">
                  <Link to="/start" search={{ offer: offer.id }}>
                    Démarrer avec {offer.name} <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
                {nextOffer && (
                  <Link
                    to="/offres/$slug"
                    params={{ slug: nextOffer.id.toLowerCase().replace(/\s+/g, "-") }}
                    className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground/50 transition-colors hover:text-primary-foreground"
                  >
                    Formule suivante : {nextOffer.name} <ArrowUpRight className="size-3.5" />
                  </Link>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
