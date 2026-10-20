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
import { caseStudies } from "@/data/case-studies";
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
          "Concept projects from Volka: brand identities, digital platforms and growth systems designed for businesses across West Africa and beyond.",
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
  const { t } = useI18n();
  const disciplines = [t.casesIndex.allWork, t.casesIndex.brandIdentity, t.casesIndex.digitalPlatform];
  const [filter, setFilter] = useState(disciplines[0]!);
  // Remap filter to data discipline value
  const disciplineMap: Record<string, string> = {
    [t.casesIndex.brandIdentity]: "Brand identity",
    [t.casesIndex.digitalPlatform]: "Digital platform",
  };
  const list = studies && studies.length > 0 ? studies : caseStudies;
  const visible = filter === disciplines[0]
    ? list
    : list.filter((c) => c.discipline === disciplineMap[filter]);

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
                          {disciplines.map((discipline) => (
                <button
                  key={discipline}
                  type="button"
                  onClick={() => setFilter(discipline)}
                  className={`border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] transition-all duration-300 ${
                    filter === discipline
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  {discipline}
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
                  <CursorFollower label="View project">
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
                          transition={{ duration: 0.7, ease: easeVolkaOut }}
                        />
                      </ImageReveal>
                    </div>
                  </CursorFollower>
                  <div className="mt-6 flex items-start justify-between gap-6 border-t border-border pt-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {study.discipline} · {study.year}
                        {study.kind === "concept" ? ` · ${t.work.conceptLabel}` : ""}
                      </p>
                      <h2 className="mt-3 font-display text-4xl transition-colors group-hover:text-primary">
                        {study.client}
                      </h2>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                        {study.tagline}
                      </p>
                    </div>
                    <motion.span
                      whileHover={{ x: 4, y: -4 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="mt-1 inline-flex"
                    >
                      <ArrowUpRight className="size-5 shrink-0 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
