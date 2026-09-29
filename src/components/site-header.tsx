import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SiteHeader({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const base = tone === "dark" ? "text-primary-foreground" : "text-foreground";

  return (
    <header className={`relative z-30 border-b ${tone === "dark" ? "border-primary-foreground/15 bg-primary" : "border-border bg-background"} ${base}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-10 lg:px-14">
        <Link to="/" className="text-xl font-semibold tracking-[0.12em]" aria-label="Volka home">
          VOLKA
        </Link>
        <nav className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[0.14em] md:flex" aria-label="Main navigation">
          <Link className="transition-colors hover:text-gold" to="/cases">Case studies</Link>
          <Link className="transition-colors hover:text-gold" to="/" hash="services">Services</Link>
          <Link className="transition-colors hover:text-gold" to="/" hash="about">Studio</Link>
          <Button asChild variant="volka" size="volka">
            <Link to="/start">Start a project <ArrowUpRight /></Link>
          </Button>
        </nav>
        <Button
          variant={tone === "dark" ? "volkaOutline" : "outline"}
          size="icon"
          className="md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {menuOpen && (
        <nav className={`absolute inset-x-0 top-full z-30 mx-5 border p-6 md:hidden ${tone === "dark" ? "border-primary-foreground/20 bg-primary" : "border-border bg-background"}`} aria-label="Mobile navigation">
          <div className="flex flex-col gap-5 font-display text-3xl">
            <Link onClick={close} to="/cases">Case studies</Link>
            <Link onClick={close} to="/" hash="services">Services</Link>
            <Link onClick={close} to="/" hash="about">Studio</Link>
            <Link onClick={close} to="/start">Start a project</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
