import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

import { Reveal } from "@/components/reveal";
import { caseStudies } from "@/data/case-studies";

import heroImage from "@/assets/volka-hero.jpg";
import brandImage from "@/assets/volka-work-brand.jpg";
import digitalImage from "@/assets/volka-work-digital.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
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
        content: "Global standards. Local understanding. Digital work built to move ambitious businesses forward.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="bg-background text-foreground">
      <section className="relative min-h-[92svh] overflow-hidden bg-primary text-primary-foreground">
        <img
          src={heroImage}
          alt="A creative professional entering a contemporary studio in Cotonou"
          width={1920}
          height={1088}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full animate-volka-drift object-cover object-center"
        />
        <div className="absolute inset-0 animate-volka-fade bg-primary/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />

        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-10 lg:px-14">
          <a href="#top" className="text-xl font-semibold tracking-[0.12em]" aria-label="Volka home">
            VOLKA
          </a>
          <nav className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[0.14em] md:flex" aria-label="Main navigation">
            <Link className="link-underline transition-colors hover:text-mint" to="/cases">Case studies</Link>
            <a className="link-underline transition-colors hover:text-mint" href="#services">Services</a>
            <a className="link-underline transition-colors hover:text-mint" href="#about">Studio</a>
            <Button asChild variant="volka" size="volka">
              <Link to="/start">Start a project <ArrowUpRight /></Link>
            </Button>
          </nav>
          <Button
            variant="volkaOutline"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </header>

        {menuOpen && (
          <nav className="absolute inset-x-0 top-20 z-30 mx-5 border border-primary-foreground/20 bg-primary p-6 md:hidden" aria-label="Mobile navigation">
            <div className="flex flex-col gap-5 font-display text-3xl">
              <Link onClick={closeMenu} to="/cases">Case studies</Link>
              <a onClick={closeMenu} href="#services">Services</a>
              <a onClick={closeMenu} href="#about">Studio</a>
              <Link onClick={closeMenu} to="/start">Start a project</Link>
            </div>
          </nav>
        )}

        <div id="top" className="relative z-10 mx-auto flex min-h-[calc(92svh-96px)] max-w-7xl flex-col justify-end px-5 pb-12 md:px-10 md:pb-16 lg:px-14">
          <p className="mb-5 animate-volka-rise text-xs font-medium uppercase tracking-[0.2em] text-mint">
            Independent digital studio · Cotonou, Bénin
          </p>
          <h1 className="max-w-5xl animate-volka-rise animate-delay-100 font-display text-6xl font-semibold leading-[0.88] md:text-8xl lg:text-[7.4rem]">
            Ambition should<br />look the part.
          </h1>
          <div className="reveal-line mt-8 border-t border-primary-foreground/25" />
          <div className="flex animate-volka-rise animate-delay-350 flex-col gap-7 pt-7 md:flex-row md:items-end md:justify-between">
            <p className="max-w-xl text-lg font-light leading-relaxed text-primary-foreground/85 md:text-xl">
              We build brands, websites, and digital systems for businesses ready to be seen differently.
            </p>
            <a href="#work" className="group flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em]">
              See our approach <span className="flex size-10 items-center justify-center border border-primary-foreground/35 transition-colors duration-300 group-hover:border-mint group-hover:bg-mint group-hover:text-primary"><ArrowDown className="size-4 animate-bounce" /></span>
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="border-b border-border px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">The studio</p>
          <div>
            <h2 className="max-w-4xl font-display text-5xl font-medium leading-[0.98] md:text-7xl">
              Rooted in West Africa. Built to compete anywhere.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <p className="text-lg font-light leading-relaxed text-muted-foreground">
                Volka closes the gap between the business you built and the way the world sees it. We pair local fluency with an uncompromising global standard.
              </p>
              <p className="text-lg font-light leading-relaxed text-muted-foreground">
                For growing SMEs, diaspora founders, and international companies entering African markets — we bring clarity, speed, and work with a point of view.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="work" className="bg-forest px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between border-b border-primary-foreground/20 pb-6">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-mint">Selected work</p>
              <h2 className="font-display text-5xl font-medium md:text-7xl">Work that earns attention.</h2>
            </div>
            <Link to="/cases" className="hidden text-xs uppercase tracking-[0.16em] text-primary-foreground/60 hover:text-mint md:block">
              All case studies
            </Link>
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            {caseStudies.slice(0, 2).map((study, index) => (
              <article key={study.slug} className={index === 1 ? "md:mt-20" : ""}>
                <Link to="/cases/$slug" params={{ slug: study.slug }} className="group block">
                  <div className="aspect-[4/3] overflow-hidden bg-primary">
                    <img src={study.image} alt={study.imageAlt} width={1600} height={1200} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-3xl">{study.client}</h3>
                      <p className="mt-1 text-sm text-primary-foreground/60">{study.discipline} · {study.sector}</p>
                    </div>
                    <ArrowUpRight className="mt-2 size-5 text-gold transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </Link>
              </article>
            ))}
          </div>
          <Link to="/cases" className="mt-12 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] md:hidden">
            All case studies <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <section id="services" className="px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">What we do</p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">Focused services, one accountable partner, no agency theatre.</p>
            </div>
            <div>
              {[
                ["01", "Brands", "Naming, strategy, identity systems, and clear guidelines that make your business unmistakable."],
                ["02", "Websites", "Conversion-minded digital experiences, designed mobile-first and built to perform."],
                ["03", "Growth systems", "Content, SEO, automation, and practical AI tools tied to real business goals."],
                ["04", "African market entry", "Digital positioning informed by the culture, expectations, and realities of the region."],
              ].map(([number, title, copy]) => (
                <article key={number} className="grid gap-3 border-t border-border py-7 md:grid-cols-[70px_1fr_1.3fr] md:gap-6">
                  <span className="text-xs text-gold">{number}</span>
                  <h3 className="font-display text-3xl md:text-4xl">{title}</h3>
                  <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-mint px-5 py-20 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="mb-10 text-xs font-medium uppercase tracking-[0.2em]">Ways to work together</p>
          <div className="grid border-y border-primary/25 md:grid-cols-3">
            {[
              ["Présence", "$650", "A focused, custom website and the essential digital setup to look credible everywhere.", "10 days"],
              ["Identité", "$1,600", "A complete visual identity, website, and content direction built as one coherent system.", "18 days"],
              ["Transformation", "From $3,000", "An advanced digital ecosystem for businesses ready to scale with confidence.", "Scoped to project"],
            ].map(([name, price, copy, timing], index) => (
              <article key={name} className={`flex min-h-[390px] flex-col py-8 md:px-8 ${index > 0 ? "border-t border-primary/25 md:border-l md:border-t-0" : ""}`}>
                <span className="text-xs uppercase tracking-[0.16em]">0{index + 1}</span>
                <h3 className="mt-8 font-display text-4xl">{name}</h3>
                <p className="mt-2 text-2xl font-light">{price}</p>
                <p className="mt-8 text-sm leading-relaxed text-foreground/70">{copy}</p>
                <p className="mt-auto border-t border-primary/20 pt-5 text-xs font-medium uppercase tracking-[0.14em]">{timing}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs text-foreground/60">Based in Europe or North America? Contact us for international pricing.</p>
        </div>
      </section>

      <section id="contact" className="bg-primary px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-mint">Have something ambitious in mind?</p>
          <div className="mt-8 flex flex-col gap-10 border-b border-primary-foreground/20 pb-16 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-4xl font-display text-6xl font-medium leading-[0.9] md:text-8xl">Let’s make it look inevitable.</h2>
            <Button asChild variant="volka" size="volka" className="shrink-0">
              <Link to="/start">Start a project <ArrowUpRight /></Link>
            </Button>
          </div>
          <footer className="flex flex-col gap-5 pt-8 text-xs uppercase tracking-[0.14em] text-primary-foreground/60 md:flex-row md:items-center md:justify-between">
            <span className="font-semibold text-primary-foreground">VOLKA</span>
            <span>Cotonou, Bénin · Working worldwide</span>
            <span>© {new Date().getFullYear()} Volka Studio</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
