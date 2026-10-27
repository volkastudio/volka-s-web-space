import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck, Globe } from "lucide-react";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  sales: "Commercial",
  editor: "Rédacteur",
};

export function AdminTopBar() {
  const { user, role } = useAdminAuth();
  const location = useLocation();

  // Derive semantic breadcrumb from route
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === "/admin") return [{ label: "Tableau de bord", to: "/admin" }];
    if (path.startsWith("/admin/cases")) {
      const parts = [{ label: "Études de cas", to: "/admin/cases" }];
      if (path.includes("/new")) parts.push({ label: "Nouvelle étude", to: path });
      else if (path !== "/admin/cases") parts.push({ label: "Édition", to: path });
      return parts;
    }
    if (path.startsWith("/admin/posts")) {
      const parts = [{ label: "Journal & Articles", to: "/admin/posts" }];
      if (path.includes("/new")) parts.push({ label: "Nouvel article", to: path });
      else if (path !== "/admin/posts") parts.push({ label: "Édition", to: path });
      return parts;
    }
    if (path.startsWith("/admin/inquiries")) {
      const parts = [{ label: "Prospects", to: "/admin/inquiries" }];
      if (path !== "/admin/inquiries") parts.push({ label: "Détail du brief", to: path });
      return parts;
    }
    if (path.startsWith("/admin/socials")) {
      return [{ label: "Réseaux & Contact", to: "/admin/socials" }];
    }
    if (path.startsWith("/admin/health")) {
      return [{ label: "Santé & Sécurité", to: "/admin/health" }];
    }
    return [{ label: "Administration", to: "/admin" }];
  };

  const breadcrumbs = getBreadcrumb();
  const roleDisplay = ROLE_LABELS[role ?? "owner"] ?? "Administrateur";
  const userInitials = (user?.email?.[0] ?? "A").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-md">
      {/* Breadcrumbs */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs">
        <Link
          to="/admin"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Studio
        </Link>
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.to + idx}>
              <ChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-foreground tracking-tight">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Right status & profile cluster */}
      <div className="flex items-center gap-4">
        {/* Studio Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-forest/20 bg-mint/10 px-2.5 py-1 text-[11px] font-medium text-forest-black">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Studio opérationnel</span>
        </div>

        {/* Immediate Language Indicator Toggle (D11) */}
        <div className="flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-mono">
          <Globe className="size-3 text-muted-foreground" />
          <span className="font-bold text-foreground">FR</span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-muted-foreground/50 hover:text-foreground cursor-pointer" title="Switch language / Changement de langue">EN</span>
        </div>

        {/* User Profile Avatar with Role Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border/60">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
            {userInitials}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-medium text-foreground leading-tight truncate max-w-[140px]">
              {user?.email?.split("@")[0] ?? "Admin"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-gold font-bold">
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
