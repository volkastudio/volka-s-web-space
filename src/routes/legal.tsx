import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react";
import { motion } from "motion/react";

import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useI18n } from "@/i18n/context";

export const Route = createFileRoute("/legal")({
  component: LegalPage,
  head: () => ({
    meta: [
      { title: "Mentions légales & Confidentialité — Volka Studio" },
      {
        name: "description",
        content:
          "Informations légales, cadre réglementaire et politique de confidentialité de Volka Studio, studio digital indépendant basé à Cotonou, Bénin.",
      },
      { property: "og:title", content: "Mentions légales — Volka Studio" },
      {
        property: "og:description",
        content:
          "Cadre légal, propriété intellectuelle et politique de protection des données de Volka Studio.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/legal" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/legal" }],
  }),
});

function LegalPage() {
  const { t } = useI18n();
  const lp = t.legalPage;

  const sections = [
    { title: lp.publisherTitle, paragraphs: lp.publisherBody },
    { title: lp.hostingTitle, paragraphs: lp.hostingBody },
    { title: lp.ipTitle, paragraphs: lp.ipBody },
    { title: lp.conceptsTitle, paragraphs: lp.conceptsBody },
    { title: lp.privacyTitle, paragraphs: lp.privacyBody },
    { title: lp.cookiesTitle, paragraphs: lp.cookiesBody },
    { title: lp.governingTitle, paragraphs: lp.governingBody },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader variant="light" />

      {/* ─── Hero Header ─── */}
      <section className="border-b border-border bg-ivory px-5 pt-16 pb-12 md:px-10 md:pt-24 md:pb-20 lg:px-14">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volka</span>
          </Link>

          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {lp.eyebrow}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-primary md:text-6xl lg:text-7xl">
              {lp.title}
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-foreground/80 md:text-xl">
              {lp.subtitle}
            </p>
          </Reveal>

          <div className="mt-8">
            <span className="inline-block rounded-full border border-border bg-background px-3.5 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {lp.lastUpdated}
            </span>
          </div>
        </div>
      </section>

      {/* ─── Legal Articles ─── */}
      <section className="px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-4xl divide-y divide-border/80">
          {sections.map((sec, idx) => (
            <Reveal key={idx} delay={idx * 40}>
              <article className="py-10 md:py-14 first:pt-0">
                <h2 className="font-display text-2xl font-medium text-primary md:text-3xl">
                  {sec.title}
                </h2>
                <div className="mt-5 space-y-4 text-base font-light leading-relaxed text-foreground/80 md:text-lg">
                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* ─── Contact Box ─── */}
        <div className="mx-auto mt-12 max-w-4xl border border-primary/15 bg-primary/[0.03] p-8 md:p-10 rounded-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Questions juridiques ou données personnelles
              </p>
              <h3 className="mt-1 font-display text-2xl text-primary md:text-3xl">
                hello@volkastudio.com
              </h3>
              <p className="mt-2 text-sm text-foreground/70">
                Réponse garantie sous 1 jour ouvré.
              </p>
            </div>
            <a
              href="mailto:hello@volkastudio.com"
              className="inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all hover:bg-forest"
            >
              <Mail className="size-4" />
              <span>Nous contacter</span>
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
