import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getCaseStudy, getNextCaseStudy } from "@/data/case-studies";

export const Route = createFileRoute("/cases/$slug")({
  loader: ({ params }) => {
    const study = getCaseStudy(params.slug);
    if (!study) throw notFound();
    return { study, next: getNextCaseStudy(params.slug) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Case study not found — Volka Studio" }, { name: "robots", content: "noindex" }] };
    }
    const { study } = loaderData;
    const title = `${study.client} — ${study.discipline} case study | Volka`;
    return {
      meta: [
        { title },
        { name: "description", content: study.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: study.summary },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CaseStudyPage,
  notFoundComponent: CaseNotFound,
});

function CaseNotFound() {
  return (
    <main className="bg-background text-foreground">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-32 md:px-10 lg:px-14">
        <h1 className="font-display text-6xl">This project isn&rsquo;t here.</h1>
        <p className="mt-6 text-muted-foreground">It may have been renamed or retired.</p>
        <Button asChild variant="volka" size="volka" className="mt-10">
          <Link to="/cases">See all case studies</Link>
        </Button>
      </section>
      <SiteFooter />
    </main>
  );
}

function CaseStudyPage() {
  const { study, next } = Route.useLoaderData();

  return (
    <main className="bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border px-5 py-14 md:px-10 md:py-20 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Link to="/cases" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All case studies
          </Link>
          <p className="mt-10 text-xs font-medium uppercase tracking-[0.2em] text-gold">{study.discipline}</p>
          <h1 className="mt-6 max-w-5xl font-display text-6xl font-medium leading-[0.92] md:text-8xl">{study.client}</h1>
          <p className="mt-6 max-w-2xl text-xl font-light leading-relaxed text-muted-foreground">{study.tagline}</p>

          <dl className="mt-14 grid gap-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Sector", study.sector],
              ["Location", study.location],
              ["Year", study.year],
              ["Engagement", study.offer],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
                <dd className="mt-2 font-display text-2xl">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-5 pt-10 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            <img src={study.image} alt={study.imageAlt} width={1600} height={1200} fetchPriority="high" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          {[
            ["The context", study.context],
            ["The challenge", study.challenge],
            ["The execution", study.execution],
          ].map(([heading, body]) => (
            <article key={heading} className="grid gap-5 border-t border-border py-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
              <h2 className="font-display text-3xl md:text-4xl">{heading}</h2>
              <p className="max-w-3xl text-lg font-light leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}

          <div className="grid gap-5 border-t border-border py-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
            <h2 className="font-display text-3xl md:text-4xl">What we delivered</h2>
            <div className="grid gap-10 sm:grid-cols-2">
              <ul className="space-y-3">
                {study.deliverables.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="text-gold">—</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Services</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {study.services.map((service) => (
                    <span key={service} className="border border-border px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-mint px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em]">The impact</p>
          <div className="mt-10 grid border-y border-primary/25 md:grid-cols-3">
            {study.results.map((result, index) => (
              <div key={result.label} className={`py-10 md:px-8 ${index > 0 ? "border-t border-primary/25 md:border-l md:border-t-0" : ""}`}>
                <p className="font-display text-6xl">{result.value}</p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/70">{result.label}</p>
              </div>
            ))}
          </div>
          <blockquote className="mt-14 max-w-4xl">
            <p className="font-display text-4xl leading-[1.15] md:text-5xl">&ldquo;{study.quote.text}&rdquo;</p>
            <footer className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
              {study.quote.author} · {study.quote.role}
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="bg-forest px-5 py-20 text-primary-foreground md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-mint">Next project</p>
          <Link to="/cases/$slug" params={{ slug: next.slug }} className="group mt-8 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-5xl md:text-7xl">{next.client}</h2>
              <p className="mt-3 max-w-xl text-primary-foreground/70">{next.tagline}</p>
            </div>
            <ArrowUpRight className="size-10 text-gold transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
