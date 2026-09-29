import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { caseStudies } from "@/data/case-studies";

export const Route = createFileRoute("/cases/")({
  component: CasesIndex,
  head: () => ({
    meta: [
      { title: "Case studies — Volka Studio" },
      {
        name: "description",
        content:
          "Selected work from Volka: brand identities, digital platforms and growth systems built for businesses across West Africa and beyond.",
      },
      { property: "og:title", content: "Case studies — Volka Studio" },
      {
        property: "og:description",
        content: "Brand identities, digital platforms and growth systems, with the results they produced.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const disciplines = ["All work", "Brand identity", "Digital platform"];

function CasesIndex() {
  const [filter, setFilter] = useState("All work");
  const visible = filter === "All work" ? caseStudies : caseStudies.filter((c) => c.discipline === filter);

  return (
    <main className="bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Selected work</p>
          <h1 className="mt-6 max-w-4xl font-display text-6xl font-medium leading-[0.92] md:text-8xl">
            Proof, not promises.
          </h1>
          <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
            Each project below started with the same gap: a business doing serious work that nobody could see clearly.
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            {disciplines.map((discipline) => (
              <button
                key={discipline}
                type="button"
                onClick={() => setFilter(discipline)}
                className={`border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                  filter === discipline
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {discipline}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-2">
          {visible.map((study, index) => (
            <article key={study.slug} className={index % 2 === 1 ? "md:mt-20" : ""}>
              <Link to="/cases/$slug" params={{ slug: study.slug }} className="group block">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={study.image}
                    alt={study.imageAlt}
                    width={1600}
                    height={1200}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-6 flex items-start justify-between gap-6 border-t border-border pt-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {study.discipline} · {study.year}
                    </p>
                    <h2 className="mt-3 font-display text-4xl">{study.client}</h2>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{study.tagline}</p>
                  </div>
                  <ArrowUpRight className="mt-1 size-5 shrink-0 text-gold transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
