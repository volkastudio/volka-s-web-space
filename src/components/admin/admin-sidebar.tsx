import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  Inbox,
  LogOut,
  ExternalLink,
  X,
  ShieldCheck,
  BookOpen,
  Share2,
  FileSearch,
  ShoppingBag,
  Image,
  BarChart3,
  Paintbrush,
  Instagram,
  Mail,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";

interface AdminSidebarProps {
  unreadInquiriesCount?: number;
  unreadMailCount?: number;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function AdminSidebar({
  unreadInquiriesCount = 0,
  unreadMailCount = 0,
  mobileOpen = false,
  onMobileOpenChange,
}: AdminSidebarProps) {
  const { user, role, signOut } = useAdminAuth();
  const location = useLocation();

  const navItems = [
    {
      label: "Tableau de bord",
      to: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Statistiques",
      to: "/admin/insights",
      icon: BarChart3,
      exact: false,
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
    ...(role !== "editor"
      ? [
          {
            label: "Messagerie",
            to: "/admin/mail",
            icon: Mail,
            badge: unreadMailCount > 0 ? unreadMailCount : undefined,
            exact: false,
          },
        ]
      : []),
    {
      label: "Audits",
      to: "/admin/audits",
      icon: FileSearch,
      exact: false,
    },
    {
      label: "Outils",
      to: "/admin/sales",
      icon: ShoppingBag,
      exact: false,
    },
    {
      label: "Médiathèque",
      to: "/admin/media",
      icon: Image,
      exact: false,
    },
    {
      label: "Apparence",
      to: "/admin/appearance",
      icon: Paintbrush,
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
            label: "Instagram",
            to: "/admin/instagram",
            icon: Instagram,
            exact: false,
          },
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
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      {/* Brand Header */}
      <div className="shrink-0 border-b border-primary-foreground/10 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <Link
            to="/admin"
            onClick={() => onMobileOpenChange?.(false)}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
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

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
              <span className="size-1.5 rounded-full bg-gold animate-pulse" />
              <span className="hidden min-[400px]:inline">En direct</span>
            </div>
            {/* Close button inside mobile drawer */}
            {onMobileOpenChange && (
              <button
                type="button"
                onClick={() => onMobileOpenChange(false)}
                className="flex size-11 items-center justify-center rounded-sm text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground lg:hidden"
                aria-label="Fermer le tiroir de navigation"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 inline-flex items-center gap-1.5 text-xs text-primary-foreground/60 transition-colors hover:text-gold"
        >
          <span>Voir le site public</span>
          <ExternalLink className="size-3" />
        </a>
      </div>

      {/* Navigation Links — Scrollable middle section so footer is never trapped */}
      <nav className="flex-1 overflow-y-auto overscroll-contain space-y-1 p-3.5">
        {navItems.map((item) => {
          const active = isActive(item.to, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => onMobileOpenChange?.(false)}
              className={`flex min-h-12 items-center justify-between rounded-sm px-3.5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] transition-all duration-200 active:scale-[0.99] ${
                active
                  ? "bg-primary-foreground/15 text-gold shadow-xs border-l-[3px] border-gold pl-3"
                  : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`size-4 shrink-0 ${
                    active ? "text-gold" : "text-primary-foreground/60"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-primary shadow-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer — Fixed at bottom */}
      <div className="shrink-0 border-t border-primary-foreground/10 p-4 bg-primary/95">
        <div className="mb-3 flex items-center gap-2.5 px-2">
          <ShieldCheck className="size-4 shrink-0 text-gold" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-primary-foreground">
              {user?.email ?? "Administrateur"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block rounded bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                {role === "owner"
                  ? "Propriétaire"
                  : role === "sales"
                    ? "Commercial"
                    : role === "editor"
                      ? "Rédacteur"
                      : "Admin"}
              </span>
              <span className="text-[10px] tracking-wide text-primary-foreground/50">
                Accès vérifié
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onMobileOpenChange?.(false);
            signOut();
          }}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-medium uppercase tracking-[0.14em] text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground active:scale-95"
        >
          <LogOut className="size-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Off-canvas Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => onMobileOpenChange?.(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 h-dvh w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden h-dvh w-64 shrink-0 border-r border-border lg:sticky lg:top-0 lg:block">
        {navContent}
      </aside>
    </>
  );
}
