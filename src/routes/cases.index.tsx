import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

import { CursorFollower } from "@/components/cursor-follower";
import { ImageReveal } from "@/components/image-reveal";
import { Reveal } from "@/components/reveal";
import { SplitHeading } from "@/components/split-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getStaticCaseStudies, getStaticCaseStudy } from "@/data/case-studies";
import { getCaseStudiesList } from "@/lib/cases.functions";
import { easeVolkaOut } from "@/lib/motion";
import { useI18n } from "@/i18n/context";

export const Route = createFileRoute("/cases/")({
  loader: async () => {
    const studies = await getCaseStudiesList();
    return { studies };
  },
  component: CasesIndex,
  head: () => ({
    meta: [
      { title: "Case studies — Volka Studio" },
      {
        name: "description",
        content:
          "Concept projects from Volka: brand identities, digital platforms and growth systems designed for ambitious businesses in Europe and internationally.",
      },
      { property: "og:title", content: "Case studies — Volka Studio" },
      {
        property: "og:description",
        content: "Concept projects showing how Volka designs brands, digital platforms and growth systems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CasesIndex() {
  const { studies } = Route.useLoaderData();
  const { locale, t } = useI18n();

  // Localized list that updates reactively on locale switch
  const baseList = studies && studies.length > 0
    ? studies.map((s) => getStaticCaseStudy(s.slug, locale) || s)
    : getStaticCaseStudies(locale);

  // Fixed canonical filter categories — these never grow unboundedly
  // We map raw discipline values to canonical categories for filtering
  const canonicalFilters = [
    t.casesIndex.allWork,
    t.casesIndex.catBranding,
    t.casesIndex.catDigital,
    t.casesIndex.catStrategy,
    t.casesIndex.catContent,
  ];

  // Mapping: raw discipline value → canonical category label
  function getCanonical(discipline: string | undefined): string {
    if (!discipline) return t.casesIndex.catBranding;
    const d = discipline.toLowerCase();
    if (d.includes("marque") || d.includes("brand") || d.includes("identit")) return t.casesIndex.catBranding;
    if (d.includes("digital") || d.includes("platform") || d.includes("web") || d.includes("plateforme")) return t.casesIndex.catDigital;
    if (d.includes("stratégie") || d.includes("strategy") || d.includes("growth") || d.includes("croissance")) return t.casesIndex.catStrategy;
    if (d.includes("content") || d.includes("contenu") || d.includes("social")) return t.casesIndex.catContent;
    return t.casesIndex.catBranding;
  }

  const [filter, setFilter] = useState<string>(t.casesIndex.allWork);

  // Normalize filter if it drifts out of the fixed set (e.g. on locale change)
  const activeFilter = canonicalFilters.includes(filter) ? filter : t.casesIndex.allWork;

  const visible = activeFilter === t.casesIndex.allWork
    ? baseList
    : baseList.filter((c) => getCanonical(c.discipline) === activeFilter);

  return (
    <main className="bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{t.casesIndex.eyebrow}</p>
            <SplitHeading
              as="h1"
              className="mt-6 max-w-4xl font-display text-6xl font-medium leading-[0.92] md:text-8xl"
            >
              {t.casesIndex.title}
            </SplitHeading>
            <Reveal delay={150}>
              <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
                {t.casesIndex.subtitle}
              </p>
            </Reveal>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-12 flex flex-wrap gap-3">
              {canonicalFilters.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] transition-all duration-300 cursor-pointer ${
                    activeFilter === cat
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <motion.div layout className="mx-auto grid max-w-7xl gap-14 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visible.map((study, index) => (
              <motion.article
                layout
                key={study.slug}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, ease: easeVolkaOut }}
                className={index % 2 === 1 ? "md:mt-16" : ""}
              >
                <Link to="/cases/$slug" params={{ slug: study.slug }} className="group block">
                  <CursorFollower label={t.work.viewProject}>
                    <div className="aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                      <ImageReveal delay={index * 60}>
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

                  <div className="mt-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-gold">
                        {study.discipline}
                        {study.kind === "concept" ? ` · ${t.work.conceptLabel}` : ""}
                      </p>
                      <h2 className="mt-2 font-display text-4xl transition-colors group-hover:text-primary/70 md:text-5xl">
                        {study.client}
                      </h2>
                      <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
                        {study.tagline}
                      </p>
                    </div>
                    <motion.span
                      whileHover={{ x: 4, y: -4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="mt-3 inline-flex"
                    >
                      <ArrowUpRight className="size-6 text-gold transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                    </motion.span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  );
}
