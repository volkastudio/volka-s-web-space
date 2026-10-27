import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Inbox,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getAdminCasesStats } from "@/lib/admin/cases.functions";
import { listAdminInquiries } from "@/lib/admin/inquiries.functions";
import type { Database } from "@/integrations/supabase/types";

type InquiryRow = Database["public"]["Tables"]["project_inquiries"]["Row"];

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Dashboard — Volka Admin" },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const [casesStats, setCasesStats] = React.useState<{ total: number; published: number; draft: number }>(
    { total: 0, published: 0, draft: 0 },
  );
  const [inquiries, setInquiries] = React.useState<InquiryRow[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [totalInquiries, setTotalInquiries] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [statsRes, inquiriesRes] = await Promise.allSettled([
          getAdminCasesStats(),
          listAdminInquiries({ data: { limit: 5 } }),
        ]);

        if (mounted) {
          if (statsRes.status === "fulfilled") {
            setCasesStats(statsRes.value);
          }
          if (inquiriesRes.status === "fulfilled") {
            setInquiries(inquiriesRes.value.items);
            setUnreadCount(inquiriesRes.value.unreadCount);
            setTotalInquiries(inquiriesRes.value.totalCount);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Erreur lors du chargement du tableau de bord");
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6 md:p-10 lg:p-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Vue d'ensemble
          </p>
          <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">
            Tableau de bord
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gérez vos études de cas, suivez les demandes client et publiez vos articles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/cases/$id"
            params={{ id: "new" }}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4 text-gold" />
            <span>Nouvelle étude de cas</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Nouveaux Prospects
            </span>
            <Inbox className="size-4 text-gold" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl font-medium">{unreadCount}</span>
            <span className="text-xs text-muted-foreground">en attente</span>
          </div>
          <Link
            to="/admin/inquiries"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:underline"
          >
            <span>Ouvrir la boîte de réception</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Metric 2 */}
        <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Études Publiées
            </span>
            <CheckCircle2 className="size-4 text-primary" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl font-medium">{casesStats.published}</span>
            <span className="text-xs text-muted-foreground">en ligne</span>
          </div>
          <Link
            to="/admin/cases"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:underline"
          >
            <span>Voir toutes les études</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Metric 3 */}
        <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Projets en Brouillon
            </span>
            <Clock className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl font-medium">{casesStats.draft}</span>
            <span className="text-xs text-muted-foreground">en cours</span>
          </div>
          <span className="mt-4 block text-xs text-muted-foreground">
            {casesStats.draft > 0 ? "Prêts à modifier et publier" : "Aucun brouillon en attente"}
          </span>
        </div>

        {/* Metric 4 */}
        <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Total Inbound
            </span>
            <Sparkles className="size-4 text-gold" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl font-medium">
              {totalInquiries > 0 ? totalInquiries : "—"}
            </span>
            <span className="text-xs text-muted-foreground">briefs reçus au total</span>
          </div>
          <Link
            to="/admin/inquiries"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:underline"
          >
            <span>Filtrer par statut</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Grid: Recent Inquiries + Quick Actions */}
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Recent Inquiries (2 cols) */}
        <div className="rounded-sm border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-display text-xl font-medium">Derniers Prospects</h2>
              <p className="text-xs text-muted-foreground">Derniers briefs clients reçus</p>
            </div>
            <Link
              to="/admin/inquiries"
              className="text-xs font-medium uppercase tracking-[0.14em] text-gold hover:underline"
            >
              Voir tout
            </Link>
          </div>

          <div className="mt-4 divide-y divide-border">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Chargement des prospects...
              </div>
            ) : inquiries.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Aucun prospect pour l'instant. Les briefs envoyés via /start s'afficheront ici.
              </div>
            ) : (
              inquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex items-center justify-between py-3.5">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{inquiry.name}</p>
                      {inquiry.company && (
                        <span className="truncate text-xs text-muted-foreground">
                          · {inquiry.company}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {inquiry.offer} · {inquiry.budget_range}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        inquiry.status === "new"
                          ? "bg-gold/20 text-gold border border-gold/40"
                          : inquiry.status === "won"
                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {inquiry.status}
                    </span>
                    <Link
                      to="/admin/inquiries/$id"
                      params={{ id: inquiry.id }}
                      className="text-xs text-gold hover:underline"
                    >
                      Consulter
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links / Studio Actions (1 col) */}
        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-xl font-medium">Actions Rapides</h2>
            <div className="mt-4 space-y-2.5">
              <Link
                to="/admin/cases/$id"
                params={{ id: "new" }}
                className="flex items-center justify-between rounded-sm border border-border p-3 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:border-gold hover:text-gold"
              >
                <span>Créer une étude de cas</span>
                <Plus className="size-4" />
              </Link>
              <Link
                to="/admin/cases"
                className="flex items-center justify-between rounded-sm border border-border p-3 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:border-gold hover:text-gold"
              >
                <span>Gérer les études de cas</span>
                <Briefcase className="size-4" />
              </Link>
              <Link
                to="/admin/inquiries"
                className="flex items-center justify-between rounded-sm border border-border p-3 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:border-gold hover:text-gold"
              >
                <span>Gérer les prospects</span>
                <Inbox className="size-4" />
              </Link>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-sm border border-border p-3 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:border-gold hover:text-gold"
              >
                <span>Voir le site en direct</span>
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
