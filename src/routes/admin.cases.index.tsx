import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  ArrowUpDown,
  ExternalLink,
  Edit2,
  Trash2,
  Star,
  CheckCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  listAdminCases,
  reorderCases,
  setCaseStatus,
  deleteCase,
} from "@/lib/admin/cases.functions";
import type { CaseStudyRecord } from "@/lib/case-study-schema";

export const Route = createFileRoute("/admin/cases/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Case Studies — Volka Admin" },
    ],
  }),
  component: AdminCasesIndexPage,
});

function AdminCasesIndexPage() {
  const [cases, setCases] = React.useState<CaseStudyRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all");
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const isFiltered = statusFilter !== "all" || searchTerm.trim().length > 0;

  const fetchCases = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await listAdminCases();
      setCases(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load case studies");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleToggleStatus = async (item: CaseStudyRecord) => {
    const nextStatus = item.status === "published" ? "draft" : "published";
    try {
      setActionLoading(item.id);
      setError(null);
      await setCaseStatus({ data: { id: item.id, status: nextStatus } });
      setCases((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, status: nextStatus } : c)),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (item: CaseStudyRecord) => {
    if (!confirm(`Are you sure you want to delete "${item.client}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(item.id);
      setError(null);
      await deleteCase({ data: { id: item.id } });
      setCases((prev) => prev.filter((c) => c.id !== item.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete case study");
    } finally {
      setActionLoading(null);
    }
  };

  // Reorder operates on the FULL unfiltered cases array only.
  // When a filter is active, reordering is disabled to prevent index corruption.
  const handleMoveOrder = async (caseId: string, direction: "up" | "down") => {
    const index = cases.findIndex((c) => c.id === caseId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cases.length) return;

    const reordered = [...cases];
    const temp = reordered[index]!;
    reordered[index] = reordered[targetIndex]!;
    reordered[targetIndex] = temp;

    // Update sort_order numbers
    const updated = reordered.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setCases(updated);

    try {
      await reorderCases({
        data: {
          items: updated.map((c) => ({ id: c.id, sort_order: c.sort_order })),
        },
      });
    } catch (err) {
      console.error("Reorder failed:", err);
      setError("Reorder failed. Refreshing...");
      fetchCases();
    }
  };

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.client.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term) ||
      c.translations.fr?.sector?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 md:p-10 lg:p-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Portfolio
          </p>
          <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">
            Case Studies
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your project portfolio, order on the homepage, and edit translations.
          </p>
        </div>

        <Link
          to="/admin/cases/$id"
          params={{ id: "new" }}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4 text-gold" />
          <span>New case study</span>
        </Link>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls: Search & Filter */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client or sector..."
            className="w-full rounded-sm border border-border bg-card pl-9 pr-4 py-2 text-xs focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["all", "published", "draft"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`rounded-sm px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                statusFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-sm border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5 w-16 text-center">Order</th>
                <th className="px-4 py-3.5">Client & Title</th>
                <th className="px-4 py-3.5">Sector</th>
                <th className="px-4 py-3.5">Languages</th>
                <th className="px-4 py-3.5">Featured</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    Loading case studies...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    {cases.length === 0
                      ? "No case studies in database yet. Create your first case study above!"
                      : "No case studies matched your filter."}
                  </td>
                </tr>
              ) : (
                filteredCases.map((study, idx) => {
                  const hasFr = Boolean(study.translations.fr?.tagline);
                  const hasEn = Boolean(study.translations.en?.tagline);
                  const isActioning = actionLoading === study.id;

                  return (
                    <tr
                      key={study.id}
                      className="transition-colors hover:bg-muted/20"
                    >
                      {/* Reorder Buttons — disabled when a filter is active */}
                      <td className="px-4 py-4 text-center">
                        {isFiltered ? (
                          <span
                            className="text-[10px] text-muted-foreground/40"
                            title="Clear filters to reorder"
                          >
                            —
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0 || isActioning !== null}
                              onClick={() => handleMoveOrder(study.id, "up")}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                              title="Move up"
                            >
                              <ChevronUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === filteredCases.length - 1 || isActioning !== null}
                              onClick={() => handleMoveOrder(study.id, "down")}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                              title="Move down"
                            >
                              <ChevronDown className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Client & Slug */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">
                          {study.client}
                          {study.kind === "concept" && (
                            <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold uppercase">
                              Concept
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          /{study.slug} · {study.year}
                        </div>
                      </td>

                      {/* Sector / Discipline */}
                      <td className="px-4 py-4 text-muted-foreground">
                        {study.translations.fr?.sector || "—"}
                      </td>

                      {/* Languages indicator */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              hasFr ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            FR
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              hasEn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"
                            }`}
                          >
                            EN
                          </span>
                        </div>
                      </td>

                      {/* Featured */}
                      <td className="px-4 py-4">
                        {study.featured ? (
                          <span className="inline-flex items-center gap-1 text-gold">
                            <Star className="size-3.5 fill-gold" />
                            <span>Featured</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={() => handleToggleStatus(study)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-opacity ${
                            study.status === "published"
                              ? "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30"
                              : "bg-muted text-muted-foreground border border-border"
                          } hover:opacity-80`}
                        >
                          {study.status === "published" ? (
                            <CheckCircle className="size-3" />
                          ) : (
                            <Clock className="size-3" />
                          )}
                          <span>{study.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {study.status === "published" && (
                            <a
                              href={`/cases/${study.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="View on site"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          )}
                          <Link
                            to="/admin/cases/$id"
                            params={{ id: study.id }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Edit"
                          >
                            <Edit2 className="size-3.5" />
                          </Link>
                          <button
                            type="button"
                            disabled={isActioning}
                            onClick={() => handleDelete(study)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
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
