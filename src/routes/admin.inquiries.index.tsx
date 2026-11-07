import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Inbox,
  Search,
  Download,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { listAdminInquiries, updateInquiry } from "@/lib/admin/inquiries.functions";
import type { Database } from "@/integrations/supabase/types";

type InquiryRow = Database["public"]["Tables"]["project_inquiries"]["Row"];

export const Route = createFileRoute("/admin/inquiries/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Boîte de Prospects — Volka Admin" },
    ],
  }),
  component: AdminInquiriesIndexPage,
});

function AdminInquiriesIndexPage() {
  const [inquiries, setInquiries] = React.useState<InquiryRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Debounce search term — only fire fetch 300ms after user stops typing
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInquiries = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await listAdminInquiries({
        data: {
          status: statusFilter,
          search: debouncedSearch,
          limit: 100,
        },
      });
      setInquiries(res.items);
      setTotalCount(res.totalCount);
      setUnreadCount(res.unreadCount);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  React.useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleExportCsv = () => {
    if (inquiries.length === 0) return;

    const headers = [
      "ID",
      "Date",
      "Status",
      "Name",
      "Email",
      "Company",
      "Phone",
      "Channel",
      "Offer",
      "Timeline",
      "Budget",
      "Vision",
      "Challenge",
      "Referral",
      "Locale",
      "Notified At",
      "Notes",
    ];

    const escapeCsv = (val: string | null | undefined) => {
      if (!val) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = inquiries.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.created_at),
      escapeCsv(r.status),
      escapeCsv(r.name),
      escapeCsv(r.email),
      escapeCsv(r.company),
      escapeCsv(r.phone),
      escapeCsv(r.preferred_channel),
      escapeCsv(r.offer),
      escapeCsv(r.timeline),
      escapeCsv(r.budget_range),
      escapeCsv(r.vision),
      escapeCsv(r.challenge),
      escapeCsv(r.referral_source),
      escapeCsv(r.locale),
      escapeCsv(r.notified_at),
      escapeCsv(r.internal_notes),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `volka-inquiries-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return "bg-gold/20 text-gold border-gold/40";
      case "replied":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "won":
        return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30";
      case "lost":
        return "bg-muted text-muted-foreground border-border";
      case "spam":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 lg:p-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:pb-8 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              Pipeline de Prospects
            </p>
            {unreadCount > 0 && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-primary">
                {unreadCount} nouveau{unreadCount > 1 ? "x" : ""}
              </span>
            )}
          </div>
          <h1 className="mt-1.5 font-display text-3xl sm:text-4xl md:text-5xl font-light">
            Boîte de Prospects
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Consultez les briefs clients soumis via le formulaire /démarrer.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={inquiries.length === 0}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-foreground shadow-xs transition-colors hover:border-gold hover:text-gold disabled:opacity-40 active:scale-95"
        >
          <Download className="size-4" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher nom, entreprise, email..."
            className="h-11 w-full rounded-sm border border-border bg-card pl-9 pr-4 text-xs focus:border-gold focus:outline-none"
          />
        </div>

        {/* Status Filters with smooth mobile horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar sm:flex-wrap">
          {["all", "new", "read", "replied", "won", "lost", "spam"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-sm px-3.5 py-1.5 min-h-11 text-xs font-medium uppercase tracking-[0.14em] transition-colors shrink-0 ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {({ all: "Tous", new: "Nouveaux", read: "Lus", replied: "Répondus", won: "Gagnés", lost: "Perdus", spam: "Spam" } as Record<string, string>)[st]}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card View (< md) */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="rounded-sm border border-border bg-card p-8 text-center text-xs text-muted-foreground">
            Chargement des prospects...
          </div>
        ) : inquiries.length === 0 ? (
          <div className="rounded-sm border border-border bg-card p-8 text-center text-xs text-muted-foreground">
            Aucun prospect trouvé.
          </div>
        ) : (
          inquiries.map((inquiry) => {
            const dateStr = new Date(inquiry.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={inquiry.id}
                className="rounded-lg border border-border bg-card p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-sm text-foreground block truncate">
                      {inquiry.name}
                    </span>
                    {inquiry.company && (
                      <span className="text-xs text-muted-foreground block truncate">
                        {inquiry.company}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0 ${getStatusBadge(
                      inquiry.status,
                    )}`}
                  >
                    {inquiry.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-y border-border/50 py-2.5">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                      Offre
                    </span>
                    <span className="font-medium text-foreground truncate block">
                      {inquiry.offer}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                      Budget
                    </span>
                    <span className="font-medium text-foreground">{inquiry.budget_range}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                      Calendrier
                    </span>
                    <span className="text-muted-foreground">{inquiry.timeline}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                      Reçu le
                    </span>
                    <span className="text-muted-foreground">{dateStr}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5 gap-2">
                  <span className="text-xs text-muted-foreground truncate max-w-[170px]">
                    {inquiry.email}
                  </span>
                  <Link
                    to="/admin/inquiries/$id"
                    params={{ id: inquiry.id }}
                    className="inline-flex min-h-11 items-center gap-1 rounded-sm bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground active:scale-95 shadow-xs shrink-0"
                  >
                    <span>Consulter</span>
                    <ChevronRight className="size-3.5 text-gold" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Inquiries Table (>= md) */}
      <div className="hidden md:block overflow-hidden rounded-sm border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Client &amp; Entreprise</th>
                <th className="px-5 py-3.5">Offre &amp; Calendrier</th>
                <th className="px-5 py-3.5">Budget</th>
                <th className="px-5 py-3.5">Reçu le</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Chargement des prospects...
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Aucun prospect trouvé.
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => {
                  const dateStr = new Date(inquiry.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={inquiry.id}
                      className="transition-colors hover:bg-muted/20"
                    >
                      {/* Client Name & Contact */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{inquiry.name}</span>
                          {inquiry.company && (
                            <span className="text-muted-foreground">({inquiry.company})</span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="truncate">{inquiry.email}</span>
                          {inquiry.phone && <span>· {inquiry.phone}</span>}
                        </div>
                      </td>

                      {/* Offer & Timeline */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-foreground">{inquiry.offer}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {inquiry.timeline}
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="px-5 py-4 text-foreground">
                        {inquiry.budget_range}
                      </td>

                      {/* Received Date */}
                      <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(
                            inquiry.status,
                          )}`}
                        >
                          {inquiry.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <Link
                          to="/admin/inquiries/$id"
                          params={{ id: inquiry.id }}
                          className="inline-flex items-center gap-1 font-medium text-gold hover:underline"
                        >
                          <span>Consulter</span>
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
