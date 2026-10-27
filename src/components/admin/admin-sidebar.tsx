import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Inbox,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  BookOpen,
  Share2,
  FileSearch,
  ShoppingBag,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";

interface AdminSidebarProps {
  unreadInquiriesCount?: number;
}

export function AdminSidebar({ unreadInquiriesCount = 0 }: AdminSidebarProps) {
  const { user, role, signOut } = useAdminAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    {
      label: "Tableau de bord",
      to: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Études de cas",
      to: "/admin/cases",
      icon: Briefcase,
      exact: false,
    },
    {
      label: "Journal",
      to: "/admin/posts",
      icon: BookOpen,
      exact: false,
    },
    {
      label: "Prospects",
      to: "/admin/inquiries",
      icon: Inbox,
      badge: unreadInquiriesCount > 0 ? unreadInquiriesCount : undefined,
      exact: false,
    },
    {
      label: "Audits",
      to: "/admin/audits",
      icon: FileSearch,
      exact: false,
    },
    {
      label: "Ventes",
      to: "/admin/sales",
      icon: ShoppingBag,
      exact: false,
    },
    {
      label: "Réseaux & Contact",
      to: "/admin/socials",
      icon: Share2,
      exact: false,
    },
    ...(role === "owner"
      ? [
          {
            label: "Santé & Sécurité",
            to: "/admin/health",
            icon: ShieldCheck,
            exact: false,
          },
        ]
      : []),
  ];

  const isActive = (to: string, exact: boolean) => {
    if (exact) {
      return location.pathname === to;
    }
    return location.pathname.startsWith(to);
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-primary text-primary-foreground">
      <div>
        {/* Brand Header */}
        <div className="border-b border-primary-foreground/10 p-6">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img
                src="/volka-icon-light.png"
                alt=""
                className="size-7 object-contain"
              />
              <div>
                <span className="font-display text-2xl font-light tracking-[0.12em] text-primary-foreground">
                  VOLKA
                </span>
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.25em] text-gold">
                  Studio Admin
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
              <span className="size-1.5 rounded-full bg-gold animate-pulse" />
              En direct
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary-foreground/60 transition-colors hover:text-gold"
          >
            <span>Voir le site public</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 p-4">
          {navItems.map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-sm px-3.5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] transition-all duration-200 ${
                  active
                    ? "bg-primary-foreground/15 text-gold shadow-sm border-l-[3px] border-gold pl-3"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`size-4 ${active ? "text-gold" : "text-primary-foreground/60"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-primary-foreground/10 p-4">
        <div className="mb-3 flex items-center gap-2.5 px-2">
          <ShieldCheck className="size-4 shrink-0 text-gold" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-primary-foreground">
              {user?.email ?? "Administrateur"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block rounded bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                {role === "owner" ? "Propriétaire" : role === "sales" ? "Commercial" : role === "editor" ? "Rédacteur" : "Admin"}
              </span>
              <span className="text-[10px] tracking-wide text-primary-foreground/50">
                Accès vérifié
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-2.5 rounded-sm px-3.5 py-2 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground/60 transition-colors hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="size-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded p-1 text-primary-foreground hover:bg-primary-foreground/10"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
          <span className="font-display text-xl tracking-[0.1em]">VOLKA ADMIN</span>
        </div>
        {unreadInquiriesCount > 0 && (
          <Link
            to="/admin/inquiries"
            className="flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-primary"
          >
            <Inbox className="size-3" />
            <span>{unreadInquiriesCount}</span>
          </Link>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[80vw] shadow-2xl">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 border-r border-border lg:block">
        {navContent}
      </aside>
    </>
  );
}
