import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <section className="bg-primary px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-mint">Have something ambitious in mind?</p>
        <div className="mt-8 flex flex-col gap-10 border-b border-primary-foreground/20 pb-16 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-4xl font-display text-6xl font-medium leading-[0.9] md:text-8xl">
            Let&rsquo;s make it look inevitable.
          </h2>
          <Button asChild variant="volka" size="volka" className="shrink-0">
            <Link to="/start">Start a project <ArrowUpRight /></Link>
          </Button>
        </div>
        <footer className="flex flex-col gap-5 pt-8 text-xs uppercase tracking-[0.14em] text-primary-foreground/60 md:flex-row md:items-center md:justify-between">
          <span className="font-semibold text-primary-foreground">VOLKA</span>
          <span>Cotonou, Bénin · Working worldwide</span>
          <a href="https://www.instagram.com/volkastudio" target="_blank" rel="noreferrer" className="hover:text-mint">Instagram</a>
          <span>© {new Date().getFullYear()} Volka Studio</span>
        </footer>
      </div>
    </section>
  );
}
