import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Globe, Menu, X, Inbox, Mail } from "lucide-react";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  sales: "Commercial",
  editor: "Rédacteur",
};

export interface AdminTopBarProps {
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
  unreadInquiriesCount?: number;
  unreadMailCount?: number;
}

export function AdminTopBar({
  onToggleMobileNav,
  isMobileNavOpen = false,
  unreadInquiriesCount = 0,
  unreadMailCount = 0,
}: AdminTopBarProps) {
  const { user, role } = useAdminAuth();
  const location = useLocation();

  // Derive semantic breadcrumb from route
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === "/admin") return [{ label: "Tableau de bord", to: "/admin" }];

    if (path.startsWith("/admin/insights")) {
      return [{ label: "Statistiques & Audience", to: "/admin/insights" }];
    }

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

    if (path.startsWith("/admin/mail")) {
      return [{ label: "Messagerie", to: "/admin/mail" }];
    }

    if (path.startsWith("/admin/audits")) {
      const parts = [{ label: "Audits", to: "/admin/audits" }];
      if (path.includes("/workbench")) parts.push({ label: "Atelier d'analyse", to: path });
      return parts;
    }

    if (path.startsWith("/admin/sales")) {
      const parts = [{ label: "Outils", to: "/admin/sales" }];
      if (path.includes("/editor")) parts.push({ label: "Éditeur", to: path });
      else if (path.includes("/buyers")) parts.push({ label: "Acheteurs", to: path });
      else if (path.includes("/sequences")) parts.push({ label: "Séquences email", to: path });
      return parts;
    }

    if (path.startsWith("/admin/media")) {
      return [{ label: "Médiathèque", to: "/admin/media" }];
    }

    if (path.startsWith("/admin/appearance")) {
      return [{ label: "Apparence & Transitions", to: "/admin/appearance" }];
    }

    if (path.startsWith("/admin/instagram")) {
      return [{ label: "Automatisation Instagram", to: "/admin/instagram" }];
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
  const currentCrumb = breadcrumbs[breadcrumbs.length - 1];
  const roleDisplay = ROLE_LABELS[role ?? "owner"] ?? "Administrateur";
  const userInitials = (user?.email?.[0] ?? "A").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-3 sm:px-6 backdrop-blur-md">
      {/* Left Cluster: Mobile toggle + Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="flex size-11 items-center justify-center rounded-sm border border-border/70 bg-background text-foreground transition-colors hover:border-gold hover:text-gold lg:hidden shrink-0 active:scale-95"
          aria-label={isMobileNavOpen ? "Fermer le menu" : "Ouvrir le menu de navigation"}
        >
          {isMobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        {/* Mobile Volka Icon Branding */}
        <Link
          to="/admin"
          className="flex items-center gap-1.5 lg:hidden shrink-0 text-foreground"
          aria-label="Accueil Admin"
        >
          <img
            src="/volka-icon-light.png"
            alt=""
            className="size-6 object-contain invert dark:invert-0"
          />
          <span className="hidden min-[400px]:inline font-display text-base font-light tracking-[0.14em]">
            VOLKA
          </span>
        </Link>

        <span className="hidden min-[400px]:inline-block text-border lg:hidden">|</span>

        {/* Semantic Breadcrumbs (Full on desktop, compact on mobile) */}
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 sm:gap-1.5 text-xs truncate">
          {/* Desktop full trail */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <Link
              to="/admin"
              className="text-muted-foreground transition-colors hover:text-foreground shrink-0"
            >
              Studio
            </Link>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.to + idx}>
                  <ChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
                  {isLast ? (
                    <span className="font-semibold text-foreground tracking-tight truncate max-w-[200px]">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.to}
                      className="text-muted-foreground transition-colors hover:text-foreground shrink-0"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile compact title */}
          <div className="flex sm:hidden items-center text-xs font-semibold text-foreground tracking-tight truncate max-w-[140px] min-[400px]:max-w-[200px]">
            {currentCrumb?.label}
          </div>
        </nav>
      </div>

      {/* Right status & profile cluster */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        {/* Unread mail + unread inquiries: each badge is a full-size tap target */}
        {unreadMailCount > 0 && (
          <Link
            to="/admin/mail"
            className="flex min-h-11 items-center gap-1 rounded-sm px-2 text-[11px] font-bold text-foreground transition-colors hover:text-gold"
            title={`${unreadMailCount} message(s) non lu(s)`}
          >
            <Mail className="size-4 text-gold" />
            <span>{unreadMailCount}</span>
          </Link>
        )}
        {unreadInquiriesCount > 0 && (
          <Link
            to="/admin/inquiries"
            className="flex min-h-11 items-center gap-1 rounded-sm px-2 text-[11px] font-bold text-foreground transition-colors hover:text-gold"
            title={`${unreadInquiriesCount} prospect(s) non lu(s)`}
          >
            <Inbox className="size-4 text-gold" />
            <span>{unreadInquiriesCount}</span>
          </Link>
        )}

        {/* Studio Status Badge (desktop/tablet) */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-forest/20 bg-mint/10 px-2.5 py-1 text-[11px] font-medium text-forest-black">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Opérationnel</span>
        </div>

        {/* Immediate Language Indicator Toggle (D11) */}
        <div className="hidden sm:flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-mono">
          <Globe className="size-3 text-muted-foreground" />
          <span className="font-bold text-foreground">FR</span>
          <span className="text-muted-foreground/40">|</span>
          <span
            className="text-muted-foreground/50 hover:text-foreground cursor-pointer transition-colors"
            title="Langue d'interface : Français"
          >
            EN
          </span>
        </div>

        {/* User Profile Avatar with Role Badge */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l sm:border-border/60">
          <div
            className="flex size-7 sm:size-7.5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm ring-1 ring-gold/30"
            title={`${user?.email ?? "Admin"} (${roleDisplay})`}
          >
            {userInitials}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-medium text-foreground leading-tight truncate max-w-[130px]">
              {user?.email?.split("@")[0] ?? "Admin"}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-gold font-bold">
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
