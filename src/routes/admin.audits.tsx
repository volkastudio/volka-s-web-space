import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileSearch,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Search,
  Filter,
  X,
  ChevronRight,
  Send,
  Loader2,
  Calendar,
  Building,
  User,
  Mail,
  Phone,
  Globe,
  SlidersHorizontal,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminAudits,
  updateAdminAudit,
  getPublicAuditCapacity,
  saveAdminAuditSettings,
} from "@/lib/audit/audit.functions";
import type { AuditStatus, AuditTrack, AuditCapacityStatus } from "@/lib/audit/audit.server";

export const Route = createFileRoute("/admin/audits")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Gestion des Audits — Volka Studio Admin" },
    ],
  }),
  loader: async () => {
    const [auditsData, capacityData] = await Promise.all([
      getAdminAudits({ data: { limit: 50 } }),
      getPublicAuditCapacity(),
    ]);
    return {
      audits: auditsData.audits,
      totalCount: auditsData.totalCount,
      capacity: capacityData,
    };
  },
  component: AdminAuditsPage,
});

interface AuditItem {
  id: string;
  created_at: string;
  updated_at: string;
  status: AuditStatus;
  track: AuditTrack;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_name: string;
  activity_sector: string;
  country: string;
  team_size: string;
  website_url: string | null;
  specific_answers: Record<string, string>;
  verification_token: string;
  verified_at: string | null;
  admin_notes: string | null;
  sent_at: string | null;
  due_at: string | null;
}

const STATUS_CONFIG: Record<
  AuditStatus,
  { label: string; badgeClass: string }
> = {
  pending_verification: {
    label: "Attente confirmation",
    badgeClass: "bg-pine/50 border-pine/80 text-mint/70",
  },
  queued: {
    label: "En file de traitement",
    badgeClass: "bg-mint/15 border-mint/40 text-mint",
  },
  waitlist: {
    label: "Liste d'attente",
    badgeClass: "bg-ochre/15 border-ochre/40 text-ochre",
  },
  reviewing: {
    label: "En cours d'analyse",
    badgeClass: "bg-mint/25 border-mint text-paper font-semibold",
  },
  completed: {
    label: "Livre / Terminé",
    badgeClass: "bg-mint/20 border-mint/50 text-mint font-semibold",
  },
  rejected: {
    label: "Non retenu",
    badgeClass: "bg-terracotta/20 border-terracotta/50 text-terracotta",
  },
};

const TRACK_LABELS: Record<AuditTrack, string> = {
  website: "Site Web",
  marketing: "Marketing",
  sales: "Ventes & Suivi",
  general: "Transversal",
};

function AdminAuditsPage() {
  const loaderData = Route.useLoaderData();
  const [audits, setAudits] = React.useState<AuditItem[]>(
    loaderData.audits as unknown as AuditItem[]
  );

  const [selectedAudit, setSelectedAudit] = React.useState<AuditItem | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [trackFilter, setTrackFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [notesDraft, setNotesDraft] = React.useState<string>("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const [capacity, setCapacity] = React.useState<AuditCapacityStatus>(
    (loaderData as any).capacity
  );
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [settingsForm, setSettingsForm] = React.useState({
    capacity_per_month: (loaderData as any).capacity?.capacity ?? 30,
    delivery_working_days: (loaderData as any).capacity?.deliveryDays ?? 5,
    is_open: (loaderData as any).capacity?.isOpen ?? true,
  });
  const [savingSettings, setSavingSettings] = React.useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await saveAdminAuditSettings({
        data: {
          capacity_per_month: Number(settingsForm.capacity_per_month),
          delivery_working_days: Number(settingsForm.delivery_working_days),
          is_open: Boolean(settingsForm.is_open),
        },
      });
      setCapacity(updated);
      setShowSettingsModal(false);
      setToastMessage("Paramètres de l'audit enregistrés avec succès.");
    } catch (err) {
      console.error(err);
      setToastMessage("Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Auto-dismiss toast
  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Synchronize drawer draft note
  React.useEffect(() => {
    if (selectedAudit) {
      setNotesDraft(selectedAudit.admin_notes || "");
    }
  }, [selectedAudit]);

  const handleSaveNotes = async () => {
    if (!selectedAudit) return;
    setSavingNote(true);
    try {
      await updateAdminAudit({
        data: {
          id: selectedAudit.id,
          adminNotes: notesDraft,
        },
      });

      // Update local state
      setAudits((prev) =>
        prev.map((a) => (a.id === selectedAudit.id ? { ...a, admin_notes: notesDraft } : a))
      );
      setSelectedAudit((prev) => (prev ? { ...prev, admin_notes: notesDraft } : null));
      setToastMessage("Notes enregistrées avec succès.");
    } catch (err) {
      console.error(err);
      setToastMessage("Erreur lors de la sauvegarde des notes.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleUpdateStatus = async (newStatus: AuditStatus, markSent = false) => {
    if (!selectedAudit) return;
    setActionLoading(true);
    try {
      const updated = await updateAdminAudit({
        data: {
          id: selectedAudit.id,
          status: newStatus,
          markSent,
        },
      });

      const updatedItem: AuditItem = {
        ...selectedAudit,
        status: newStatus,
        sent_at: markSent ? new Date().toISOString() : selectedAudit.sent_at,
      };

      setAudits((prev) => prev.map((a) => (a.id === selectedAudit.id ? updatedItem : a)));
      setSelectedAudit(updatedItem);
      setToastMessage(markSent ? "Audit marqué comme envoyé." : `Statut mis à jour : ${newStatus}`);
    } catch (err) {
      console.error(err);
      setToastMessage("Erreur lors de la mise à jour du statut.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered list
  const filteredAudits = audits.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (trackFilter !== "all" && a.track !== trackFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        a.company_name.toLowerCase().includes(q) ||
        a.contact_name.toLowerCase().includes(q) ||
        a.contact_email.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const queuedCount = audits.filter((a) => a.status === "queued" || a.status === "reviewing").length;
  const waitlistCount = audits.filter((a) => a.status === "waitlist").length;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-md bg-forest-black border border-mint text-paper text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="size-4 text-mint" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-forest-black">
            File des Audits Croissance
          </h1>
          <p className="text-sm text-forest-black/70">
            Suivi des demandes d'audit gratuit, délais de livraison et actions requises.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-mint/15 border border-mint/40 text-xs font-medium text-forest-black">
            <strong>{queuedCount}</strong> en file active
          </div>
          {waitlistCount > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-ochre/15 border border-ochre/40 text-xs font-medium text-forest-black">
              <strong>{waitlistCount}</strong> en liste d'attente
            </div>
          )}
          {capacity && (
            <div className="px-3 py-1.5 rounded-full bg-pine/10 border border-pine/20 text-xs font-medium text-forest-black">
              Capacité : <strong>{capacity.used}/{capacity.capacity}</strong> ({capacity.remaining} rest.)
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            className="text-xs h-8 border-pine/20 hover:bg-soft-paper flex items-center gap-1.5"
          >
            <SlidersHorizontal className="size-3.5 text-forest-black/70" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-soft-paper/50 p-4 rounded-lg border border-pine/10">
        <div className="relative w-full md:w-80">
          <Search className="size-4 text-forest-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Rechercher par marque, contact, pays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-warm-ivory border-pine/20 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-warm-ivory border border-pine/20 text-xs text-forest-black focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="queued">En file (Queued)</option>
            <option value="waitlist">Liste d'attente</option>
            <option value="reviewing">En cours d'analyse</option>
            <option value="completed">Terminé / Livré</option>
            <option value="pending_verification">Attente confirmation</option>
            <option value="rejected">Non retenu</option>
          </select>

          {/* Track Filter */}
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-warm-ivory border border-pine/20 text-xs text-forest-black focus:outline-none"
          >
            <option value="all">Tous les parcours</option>
            <option value="website">Site Web</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Ventes & Suivi</option>
            <option value="general">Transversal</option>
          </select>
        </div>
      </div>

      {/* Audits Table */}
      <div className="bg-warm-ivory rounded-lg border border-pine/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-soft-paper/80 border-b border-pine/10 text-forest-black/70 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Entreprise & Contact</th>
                <th className="py-3 px-4">Parcours</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Date de demande</th>
                <th className="py-3 px-4">Échéance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine/5">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-forest-black/50 text-sm">
                    Aucun audit ne correspond aux filtres appliqués.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((a) => {
                  const statusConf = STATUS_CONFIG[a.status] || {
                    label: a.status,
                    badgeClass: "bg-pine/10 text-forest-black",
                  };

                  const isOverdue =
                    a.due_at &&
                    new Date(a.due_at).getTime() < Date.now() &&
                    a.status !== "completed" &&
                    a.status !== "rejected";

                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedAudit(a)}
                      className="hover:bg-soft-paper/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-forest-black text-sm group-hover:text-terracotta transition-colors">
                          {a.company_name}
                        </div>
                        <div className="text-forest-black/60 text-[11px]">
                          {a.contact_name} ({a.country}) · {a.contact_email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-pine/10 font-medium text-forest-black text-[11px]">
                          {TRACK_LABELS[a.track]}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-medium ${statusConf.badgeClass}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-forest-black/70">
                        {new Date(a.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        {a.due_at ? (
                          <div className="flex items-center gap-1.5">
                            {isOverdue && (
                              <AlertTriangle className="size-3.5 text-terracotta shrink-0" />
                            )}
                            <span
                              className={
                                isOverdue
                                  ? "text-terracotta font-semibold"
                                  : "text-forest-black/70"
                              }
                            >
                              {new Date(a.due_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-forest-black/40">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/admin/audits/workbench?id=${a.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-pine/10 hover:bg-pine/20 text-pine text-xs font-medium transition-colors"
                            title="Ouvrir le Workbench d'analyse"
                          >
                            <Sparkles className="size-3 text-pine" />
                            Workbench
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAudit(a);
                            }}
                            className="text-xs h-7 hover:text-terracotta"
                          >
                            Détails
                            <ChevronRight className="ml-1 size-3.5" />
                          </Button>
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

      {/* DETAIL SLIDE-OVER DRAWER */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-forest-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedAudit(null)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-xl bg-warm-ivory border-l border-pine/20 h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between z-10">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-pine/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono tracking-wider text-forest-black/50">
                      Audit ID : {selectedAudit.id.slice(0, 8)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                        STATUS_CONFIG[selectedAudit.status]?.badgeClass
                      }`}
                    >
                      {STATUS_CONFIG[selectedAudit.status]?.label}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl text-forest-black font-semibold">
                    {selectedAudit.company_name}
                  </h2>
                  <p className="text-xs text-forest-black/70">
                    Parcours : <strong>{TRACK_LABELS[selectedAudit.track]}</strong> · Secteur : {selectedAudit.activity_sector}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/admin/audits/workbench?id=${selectedAudit.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-pine text-paper hover:bg-pine/90 text-xs font-medium transition-all shadow-sm"
                  >
                    <Sparkles className="size-3.5 text-mint" />
                    Ouvrir le Workbench
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedAudit(null)}
                    className="p-1.5 rounded-md hover:bg-pine/10 text-forest-black/60 hover:text-forest-black transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* Contact Information & WhatsApp quick link */}
              <div className="p-4 rounded-lg bg-soft-paper/60 border border-pine/10 space-y-2.5 text-xs">
                <span className="font-semibold text-forest-black uppercase tracking-wider text-[10px] block">
                  Coordonnées du demandeur
                </span>
                <div className="grid grid-cols-2 gap-2 text-forest-black/80">
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5 text-forest-black/50" />
                    <span>{selectedAudit.contact_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-forest-black/50" />
                    <a
                      href={`mailto:${selectedAudit.contact_email}`}
                      className="hover:underline text-terracotta"
                    >
                      {selectedAudit.contact_email}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-forest-black/50" />
                    <a
                      href={`https://wa.me/${selectedAudit.contact_phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-forest-black font-medium inline-flex items-center gap-1"
                    >
                      {selectedAudit.contact_phone}
                      <ExternalLink className="size-2.5 text-mint" />
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="size-3.5 text-forest-black/50" />
                    <span>{selectedAudit.country} · Équipe : {selectedAudit.team_size}</span>
                  </div>
                </div>

                {selectedAudit.website_url && (
                  <div className="pt-2 border-t border-pine/10 flex items-center gap-1.5">
                    <Globe className="size-3.5 text-forest-black/50" />
                    <a
                      href={selectedAudit.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terracotta hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      {selectedAudit.website_url}
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Specific Answers Provided in Wizard */}
              <div className="space-y-3">
                <span className="font-semibold text-forest-black uppercase tracking-wider text-[10px] block">
                  Réponses au questionnaire diagnostic
                </span>
                <div className="space-y-2.5 text-xs">
                  {Object.entries(selectedAudit.specific_answers || {}).map(([k, val], i) => (
                    <div key={k} className="p-3 bg-soft-paper/40 rounded border border-pine/10 space-y-1">
                      <span className="text-[11px] font-medium text-forest-black/60 block">
                        Question {i + 1} ({k}) :
                      </span>
                      <p className="text-forest-black/90 font-sans leading-relaxed">
                        {String(val)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status and Actions Bar */}
              <div className="p-4 rounded-lg bg-soft-paper/60 border border-pine/10 space-y-3 text-xs">
                <span className="font-semibold text-forest-black uppercase tracking-wider text-[10px] block">
                  Progression du traitement
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedAudit.status === "reviewing" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus("reviewing")}
                    disabled={actionLoading}
                    className="text-xs h-8"
                  >
                    Passer en cours d'analyse
                  </Button>

                  <Button
                    size="sm"
                    variant={selectedAudit.status === "completed" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus("completed", true)}
                    disabled={actionLoading}
                    className="text-xs h-8 bg-mint hover:bg-mint/90 text-forest-black font-semibold border-none"
                  >
                    <Send className="mr-1.5 size-3.5" />
                    Marquer comme envoyé / terminé
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={actionLoading}
                    className="text-xs h-8 text-terracotta hover:bg-terracotta/10 border-terracotta/40"
                  >
                    Classer sans suite
                  </Button>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-forest-black uppercase tracking-wider text-[10px]">
                    Notes internes du studio
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingNote}
                    className="text-xs h-7 bg-ochre hover:bg-ochre/90 text-forest-black font-semibold"
                  >
                    {savingNote ? <Loader2 className="size-3 animate-spin" /> : "Enregistrer"}
                  </Button>
                </div>
                <Textarea
                  rows={4}
                  placeholder="Points saillants, liens du rapport Figma ou Notion, remarques confidentielles..."
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="bg-warm-ivory border-pine/20 text-xs"
                />
              </div>
            </div>

            {/* Close footer */}
            <div className="pt-4 border-t border-pine/10 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAudit(null)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setShowSettingsModal(false)}
          />
          <div className="relative bg-warm-ivory border border-pine/20 rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-pine/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-pine/10 text-pine">
                  <SlidersHorizontal className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-forest-black font-semibold">
                    Paramètres de l'Offre /audit
                  </h3>
                  <p className="text-xs text-forest-black/70">
                    Contrôle des quotas mensuels, délais et visibilité de l'offre
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-full hover:bg-soft-paper text-forest-black/60 hover:text-forest-black"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              {/* Capacity per month */}
              <div className="space-y-1.5">
                <label className="font-medium text-forest-black block">
                  Capacité mensuelle d'audits gratuits
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settingsForm.capacity_per_month}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, capacity_per_month: Number(e.target.value) })
                  }
                  className="bg-soft-paper border-pine/20 text-xs"
                />
                <span className="text-[11px] text-forest-black/60">
                  Nombre maximum de diagnostics pris en charge par mois avant bascule en liste d'attente.
                </span>
              </div>

              {/* Delivery days */}
              <div className="space-y-1.5">
                <label className="font-medium text-forest-black block">
                  Délai indicatif de livraison (jours ouvrés)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={settingsForm.delivery_working_days}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, delivery_working_days: Number(e.target.value) })
                  }
                  className="bg-soft-paper border-pine/20 text-xs"
                />
                <span className="text-[11px] text-forest-black/60">
                  Affiché aux visiteurs dans l'email de confirmation et sur la page de remerciement.
                </span>
              </div>

              {/* Is Open toggle */}
              <div className="p-3 rounded-lg bg-soft-paper/60 border border-pine/15 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-forest-black block text-xs">
                    Statut de réception des demandes
                  </span>
                  <span className="text-[11px] text-forest-black/60">
                    Désactivez pour forcer la liste d'attente immédiatement.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.is_open}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, is_open: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-forest-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pine"></div>
                </label>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-lg bg-forest-black text-paper space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-mint/70 block">
                  Aperçu du badge en direct sur /audit
                </span>
                <div className="pt-1">
                  {settingsForm.is_open ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-mint bg-mint/20 text-mint text-xs font-medium">
                      <span className="size-2 rounded-full bg-mint animate-pulse" />
                      {capacity?.remaining ?? 8} places restantes pour le mois d'{capacity?.monthName ?? "octobre"}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-terracotta bg-terracotta/15 text-terracotta text-xs font-medium">
                      <span>▲</span> Capacité atteinte ce mois-ci — Inscription sur liste d'attente prioritaire
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-mint/60 pt-1">
                  Actuel : {capacity?.used ?? 0} places réservées ce mois-ci ({capacity?.remaining ?? 0} restantes).
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-pine/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettingsModal(false)}
                  disabled={savingSettings}
                  className="text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={savingSettings}
                  className="text-xs bg-pine text-paper hover:bg-pine/90 flex items-center gap-1.5"
                >
                  {savingSettings ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Enregistrer les paramètres
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

