import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Instagram,
  Sparkles,
  Play,
  Pause,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Edit3,
  Search,
  Download,
  Shield,
  Layers,
  Send,
  MessageSquare,
  HelpCircle,
  Eye,
  Check,
  X,
  FileCode,
  Users,
  Settings,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";
import {
  getIgConnectionStatus,
  saveIgConnection,
  toggleIgPause,
  testIgConnection,
  listIgAutomations,
  saveIgAutomation,
  deleteIgAutomation,
  reorderIgAutomations,
  listIgEvents,
  retryIgEvent,
  exportIgEventsCsv,
  listIgContacts,
  toggleIgContactBlock,
  simulateIgComment,
  fetchIgMediaForPicker,
} from "@/lib/instagram/instagram.functions";
import { getAdminProducts } from "@/lib/sales/sales.functions";
import type {
  IgConnectionPublic,
  IgAutomationWithTargets,
  IgEventRow,
  IgContactRow,
  SimulationResult,
  MetaMediaItem,
  TriggerType,
  TargetMode,
  MatchMode,
} from "@/lib/instagram/types";

export const Route = createFileRoute("/admin/instagram")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Automatisation Instagram — Volka Studio Admin" },
    ],
  }),
  loader: async () => {
    const [connection, automations, productsRes] = await Promise.all([
      getIgConnectionStatus(),
      listIgAutomations(),
      getAdminProducts().catch(() => []),
    ]);

    return {
      connection,
      automations,
      products: Array.isArray(productsRes) ? productsRes : [],
    };
  },
  component: AdminInstagramPage,
});

type TabType = "automations" | "simulator" | "events" | "contacts" | "settings";

function AdminInstagramPage() {
  const loaderData = Route.useLoaderData();
  const { role } = useAdminAuth();

  // Tabs
  const [activeTab, setActiveTab] = React.useState<TabType>("automations");

  // State
  const [connection, setConnection] = React.useState<IgConnectionPublic | null>(loaderData.connection);
  const [automations, setAutomations] = React.useState<IgAutomationWithTargets[]>(loaderData.automations);
  const products = loaderData.products;

  // Events state
  const [events, setEvents] = React.useState<IgEventRow[]>([]);
  const [eventsTotal, setEventsTotal] = React.useState(0);
  const [eventsLoading, setEventsLoading] = React.useState(false);
  const [eventFilterStatus, setEventFilterStatus] = React.useState<string>("all");
  const [eventSearch, setEventSearch] = React.useState("");

  // Contacts state
  const [contacts, setContacts] = React.useState<IgContactRow[]>([]);
  const [contactsTotal, setContactsTotal] = React.useState(0);

  // Toast
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Simulator state
  const [simComment, setSimComment] = React.useState("Salut ! Je veux bien le GUIDE svp 🔥");
  const [simUsername, setSimUsername] = React.useState("alexandre_b2b");
  const [simMediaId, setSimMediaId] = React.useState("");
  const [simResult, setSimResult] = React.useState<SimulationResult | null>(null);
  const [simRunning, setSimRunning] = React.useState(false);

  // Rule Editor Dialog
  const [editingRule, setEditingRule] = React.useState<IgAutomationWithTargets | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [pickerMedia, setPickerMedia] = React.useState<MetaMediaItem[]>([]);
  const [pickerLoading, setPickerLoading] = React.useState(false);

  // Connection settings form
  const [connIgUserId, setConnIgUserId] = React.useState(connection?.igUserId || "");
  const [connPageId, setConnPageId] = React.useState(connection?.pageId || "");
  const [connUsername, setConnUsername] = React.useState(connection?.username || "");
  const [connAccessToken, setConnAccessToken] = React.useState("");
  const [connDailyCap, setConnDailyCap] = React.useState(connection?.dailyCap || 200);
  const [connSaving, setConnSaving] = React.useState(false);
  const [connTesting, setConnTesting] = React.useState(false);

  // Auto dismiss toast
  React.useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
  };

  // Restrict to owner role per D12 and plan specification
  if (role && role !== "owner") {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex size-12 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <Shield className="size-6" />
        </div>
        <h1 className="font-display text-2xl font-light text-forest-black">
          Accès Réservé au Propriétaire
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Le module d'automatisation Instagram et la gestion des jetons Meta sont
          exclusivement réservés au compte Propriétaire du studio.
        </p>
      </div>
    );
  }

  // Load events when switching to events tab
  const refreshEvents = React.useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await listIgEvents({
        data: {
          limit: 50,
          offset: 0,
          status: eventFilterStatus as "all" | "received" | "matched" | "sent" | "skipped" | "failed",
          search: eventSearch || undefined,
        },
      });
      setEvents(res.items);
      setEventsTotal(res.total);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur de chargement du journal", "error");
    } finally {
      setEventsLoading(false);
    }
  }, [eventFilterStatus, eventSearch]);

  React.useEffect(() => {
    if (activeTab === "events") {
      refreshEvents();
    }
  }, [activeTab, refreshEvents]);

  // Load contacts when switching to contacts tab
  const refreshContacts = React.useCallback(async () => {
    try {
      const res = await listIgContacts({ data: { limit: 50, offset: 0, blockedOnly: false } });
      setContacts(res.items);
      setContactsTotal(res.total);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "contacts") {
      refreshContacts();
    }
  }, [activeTab, refreshContacts]);

  // Handle Master Pause Toggle
  const handleTogglePause = async () => {
    if (!connection) return;
    const nextState = !connection.isPaused;
    try {
      await toggleIgPause({ data: { paused: nextState } });
      setConnection({ ...connection, isPaused: nextState });
      showToast(
        nextState
          ? "Automatisation Instagram mise en PAUSE générale ⏸️"
          : "Automatisation Instagram RÉACTIVÉE ▶️",
        "info",
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur lors du basculement", "error");
    }
  };

  // Test live Meta connection
  const handleTestConnection = async () => {
    setConnTesting(true);
    try {
      const res = await testIgConnection();
      if (res.ok) {
        showToast(`Connexion Meta valide ! Compte : @${res.username || "volkastudio"}`, "success");
      } else {
        showToast(`Échec du test : ${res.error}`, "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur de test", "error");
    } finally {
      setConnTesting(false);
    }
  };

  // Save connection credentials
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnSaving(true);
    try {
      await saveIgConnection({
        data: {
          igUserId: connIgUserId,
          pageId: connPageId,
          username: connUsername,
          accessToken: connAccessToken || undefined,
          dailyCap: connDailyCap,
          isPaused: connection?.isPaused ?? false,
        },
      });

      const updated = await getIgConnectionStatus();
      setConnection(updated);
      setConnAccessToken("");
      showToast("Paramètres Instagram et jeton Meta sauvegardés avec succès.", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur lors de la sauvegarde", "error");
    } finally {
      setConnSaving(false);
    }
  };

  // Simulate comment matching
  const handleRunSimulation = async () => {
    setSimRunning(true);
    try {
      const res = await simulateIgComment({
        data: {
          commentText: simComment,
          username: simUsername,
          mediaId: simMediaId || undefined,
        },
      });
      setSimResult(res);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur de simulation", "error");
    } finally {
      setSimRunning(false);
    }
  };

  // Reorder rules
  const handleMoveRule = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= automations.length) return;

    const newRules = [...automations];
    const current = newRules[index];
    const target = newRules[targetIndex];
    if (!current || !target) return;

    newRules[index] = target;
    newRules[targetIndex] = current;

    // Recalculate positions
    const items = newRules.map((rule, idx) => ({ id: rule.id, position: idx + 1 }));
    setAutomations(newRules);

    try {
      await reorderIgAutomations({ data: { items } });
      showToast("Ordre de priorité des règles mis à jour", "info");
    } catch {
      // rollback
      const fresh = await listIgAutomations();
      setAutomations(fresh);
    }
  };

  // Delete rule
  const handleDeleteRule = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement l'automatisation "${name}" ?`)) return;
    try {
      await deleteIgAutomation({ data: { id } });
      setAutomations((prev) => prev.filter((r) => r.id !== id));
      showToast(`Règle "${name}" supprimée`, "info");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur de suppression", "error");
    }
  };

  // Toggle rule active status
  const handleToggleRuleActive = async (rule: IgAutomationWithTargets) => {
    const nextState = !rule.is_active;
    try {
      await saveIgAutomation({
        data: {
          id: rule.id,
          name: rule.name,
          isActive: nextState,
          trigger: rule.trigger,
          targetMode: rule.target_mode,
          matchMode: rule.match_mode,
          keywords: rule.keywords,
          excludeKeywords: rule.exclude_keywords,
          dmText: rule.dm_text,
          publicReplyVariants: rule.public_reply_variants,
          productId: rule.product_id,
          linkSrcTag: rule.link_src_tag,
          onePerUser: rule.one_per_user,
          cooldownHours: rule.cooldown_hours,
          startsAt: rule.starts_at,
          endsAt: rule.ends_at,
        },
      });

      setAutomations((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: nextState } : r)),
      );
      showToast(
        nextState ? `"${rule.name}" activée` : `"${rule.name}" désactivée`,
        "info",
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur de mise à jour", "error");
    }
  };

  // Retry an event
  const handleRetryEvent = async (eventId: string) => {
    try {
      await retryIgEvent({ data: { id: eventId } });
      showToast("Événement relancé pour traitement", "success");
      await refreshEvents();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur de relance", "error");
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const res = await exportIgEventsCsv();
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Export CSV généré avec succès", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur d'export CSV", "error");
    }
  };

  // Toggle Contact Block
  const handleToggleBlock = async (igUserId: string, currentBlocked: boolean) => {
    try {
      await toggleIgContactBlock({ data: { igUserId, blocked: !currentBlocked } });
      setContacts((prev) =>
        prev.map((c) => (c.ig_user_id === igUserId ? { ...c, blocked: !currentBlocked } : c)),
      );
      showToast(!currentBlocked ? "Contact bloqué (STOP)" : "Contact débloqué", "info");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur de blocage", "error");
    }
  };

  // Open editor for new or existing rule
  const openRuleEditor = (rule?: IgAutomationWithTargets) => {
    setEditingRule(
      rule || {
        id: "",
        name: "",
        is_active: true,
        trigger: "comment",
        target_mode: "any",
        match_mode: "word",
        keywords: ["guide"],
        exclude_keywords: [],
        dm_text: "Salut {username} 👋\n\nVoici le lien que tu as demandé : {lien}\n\nSi tu as une question, réponds directement à ce message.\n\nRéponds STOP pour ne plus recevoir de messages.",
        public_reply_variants: ["C'est envoyé en message privé ! 📩"],
        product_id: products[0]?.id || null,
        link_src_tag: "",
        one_per_user: true,
        cooldown_hours: 0,
        starts_at: null,
        ends_at: null,
        position: automations.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        targets: [],
      },
    );
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded border px-4 py-3 text-xs shadow-xl animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === "error"
              ? "border-terracotta/40 bg-terracotta text-paper"
              : toastMessage.type === "info"
                ? "border-gold/40 bg-primary text-primary-foreground"
                : "border-mint/40 bg-primary text-primary-foreground"
          }`}
        >
          <Sparkles className="size-4 text-gold shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <Instagram className="size-4" />
            <span>Comment-to-DM & Story Replies — Propriétaire</span>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-light text-forest-black sm:text-4xl">
            Automatisation Instagram
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
            Système d'envoi automatique de messages privés suite aux commentaires mots-clés
            sur vos publications et réponses aux stories Volka.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Global Pause Switch */}
          <Button
            type="button"
            variant="outline"
            onClick={handleTogglePause}
            className={`flex items-center gap-2 text-xs font-medium min-h-[38px] active:scale-95 ${
              connection?.isPaused
                ? "border-terracotta text-terracotta bg-terracotta/10"
                : "border-mint text-forest-black bg-mint/20"
            }`}
          >
            {connection?.isPaused ? (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Système en Pause</span>
              </>
            ) : (
              <>
                <Pause className="size-3.5" />
                <span>En direct (Actif)</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => openRuleEditor()}
            variant="volka"
            className="flex items-center gap-2 min-h-[38px] active:scale-95"
          >
            <Plus className="size-3.5 text-gold" />
            <span>Nouvelle règle</span>
          </Button>
        </div>
      </div>

      {/* Top Pulse Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Compte & Jeton Meta
          </span>
          <div className="flex items-center gap-2">
            {connection?.hasToken ? (
              connection.isExpired ? (
                <>
                  <AlertOctagon className="size-4 text-terracotta" />
                  <span className="text-sm font-semibold text-terracotta">Jeton expiré</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-mint" />
                  <span className="text-sm font-semibold text-foreground">
                    @{connection.username || "volkastudio"}
                  </span>
                </>
              )
            ) : (
              <>
                <AlertTriangle className="size-4 text-gold" />
                <span className="text-sm font-semibold text-gold">Non connecté</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {connection?.daysUntilExpiry !== null && connection?.daysUntilExpiry !== undefined
              ? connection.daysUntilExpiry > 0
                ? `Expire dans ${connection.daysUntilExpiry} jours`
                : "Jeton expiré — à renouveler"
              : "Jeton sans expiration définie"}
          </p>
        </div>

        {/* Automations count */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Règles configurées
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-foreground">
              {automations.filter((a) => a.is_active).length}
            </span>
            <span className="text-xs text-muted-foreground">actives / {automations.length} total</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Évaluées par ordre de priorité</p>
        </div>

        {/* Daily Cap */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Plafond quotidien
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold text-foreground">
              {connection?.dailyCap || 200}
            </span>
            <span className="text-xs text-muted-foreground">DMs max / 24h</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Anti-blocage & sécurité de reach</p>
        </div>

        {/* Webhook Activity */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dernier Webhook reçu
          </span>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-gold" />
            <span className="text-xs font-mono font-medium text-foreground">
              {connection?.webhookLastReceivedAt
                ? new Date(connection.webhookLastReceivedAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "En attente"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {connection?.webhookLastReceivedAt
              ? new Date(connection.webhookLastReceivedAt).toLocaleDateString("fr-FR")
              : "Aucun événement reçu"}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border text-xs overflow-x-auto no-scrollbar -mx-1 px-1">
        <button
          type="button"
          onClick={() => setActiveTab("automations")}
          className={`flex shrink-0 min-h-[44px] items-center gap-2 px-4 sm:px-5 py-3 font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "automations"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="size-4" />
          <span>Automatisations ({automations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("simulator")}
          className={`flex shrink-0 min-h-[44px] items-center gap-2 px-4 sm:px-5 py-3 font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "simulator"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="size-4" />
          <span>Simulateur</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`flex shrink-0 min-h-[44px] items-center gap-2 px-4 sm:px-5 py-3 font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "events"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCode className="size-4" />
          <span>Journal ({eventsTotal || "…"})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`flex shrink-0 min-h-[44px] items-center gap-2 px-4 sm:px-5 py-3 font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "contacts"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="size-4" />
          <span>Contacts & STOP ({contactsTotal || "…"})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex shrink-0 min-h-[44px] items-center gap-2 px-4 sm:px-5 py-3 font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
            activeTab === "settings"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="size-4" />
          <span>Connexion & API</span>
        </button>
      </div>

      {/* ──────────────── TAB 1: AUTOMATIONS LIST ──────────────── */}
      {activeTab === "automations" && (
        <div className="space-y-4">
          {automations.length === 0 ? (
            <div className="rounded-lg border border-border border-dashed p-12 text-center space-y-3">
              <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-gold">
                <Instagram className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Aucune automatisation active
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Créez votre première règle pour envoyer automatiquement un message privé dès
                qu'un abonné commente un mot-clé précis sous vos posts.
              </p>
              <Button onClick={() => openRuleEditor()} variant="volka" className="mt-2">
                <Plus className="size-3.5 text-gold mr-1" />
                Créer une règle
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map((rule, idx) => (
                <div
                  key={rule.id}
                  className={`rounded-lg border p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    rule.is_active
                      ? "border-border bg-card"
                      : "border-border/60 bg-secondary/30 opacity-75"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Priority Order Control */}
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveRule(idx, "up")}
                        className="p-1 rounded hover:bg-secondary disabled:opacity-30 text-muted-foreground"
                        title="Monter en priorité"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <span className="font-mono text-xs font-bold text-gold">#{idx + 1}</span>
                      <button
                        type="button"
                        disabled={idx === automations.length - 1}
                        onClick={() => handleMoveRule(idx, "down")}
                        className="p-1 rounded hover:bg-secondary disabled:opacity-30 text-muted-foreground"
                        title="Descendre en priorité"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{rule.name}</span>

                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            rule.trigger === "story_reply"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {rule.trigger === "story_reply" ? "Story Reply" : "Commentaire"}
                        </span>

                        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {rule.match_mode === "word"
                            ? "Mot entier"
                            : rule.match_mode === "exact"
                              ? "Texte exact"
                              : rule.match_mode === "starts_with"
                                ? "Commence par"
                                : "Contient"}
                        </span>

                        {rule.target_mode === "any" ? (
                          <span className="rounded bg-secondary/80 px-2 py-0.5 text-[10px] text-muted-foreground">
                            Tous les posts
                          </span>
                        ) : (
                          <span className="rounded bg-gold/15 text-gold px-2 py-0.5 text-[10px] font-medium">
                            {rule.targets?.length || 0} post(s) ciblé(s)
                          </span>
                        )}
                      </div>

                      {/* Keywords list */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground">Mots-clés :</span>
                        {rule.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="rounded bg-primary px-2 py-0.5 text-[11px] font-mono text-primary-foreground border border-border"
                          >
                            "{kw}"
                          </span>
                        ))}
                        {rule.exclude_keywords && rule.exclude_keywords.length > 0 && (
                          <>
                            <span className="text-[11px] text-terracotta ml-1.5">Exclus :</span>
                            {rule.exclude_keywords.map((ex) => (
                              <span
                                key={ex}
                                className="rounded bg-terracotta/15 text-terracotta px-1.5 py-0.5 text-[10px] font-mono"
                              >
                                -{ex}
                              </span>
                            ))}
                          </>
                        )}
                      </div>

                      {/* Linked Product & DM preview */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {rule.product && (
                          <div className="flex items-center gap-1 text-gold">
                            <Flame className="size-3" />
                            <span>Produit : {rule.product.title}</span>
                          </div>
                        )}
                        <span>·</span>
                        <div className="truncate max-w-md italic">
                          "{rule.dm_text.slice(0, 75)}..."
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Stats */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                    {/* Stats */}
                    {rule.stats && (
                      <div className="text-right text-[11px] font-mono text-muted-foreground mr-2">
                        <span className="text-mint font-semibold">{rule.stats.sentCount} envoyés</span>
                        {rule.stats.failedCount > 0 && (
                          <span className="text-terracotta ml-2">({rule.stats.failedCount} échecs)</span>
                        )}
                      </div>
                    )}

                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleRuleActive(rule)}
                      className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                        rule.is_active
                          ? "bg-mint/20 text-forest-black hover:bg-mint/30"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {rule.is_active ? "Active" : "Inactive"}
                    </button>

                    {/* Edit */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRuleEditor(rule)}
                      className="size-8 p-0"
                      title="Modifier"
                    >
                      <Edit3 className="size-3.5" />
                    </Button>

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteRule(rule.id, rule.name)}
                      className="size-8 p-0 text-terracotta hover:bg-terracotta/10"
                      title="Supprimer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 2: SIMULATOR ──────────────── */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input Form */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                <Sparkles className="size-4" />
                <span>Bac à Sable & Test de Déclenchement</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-light text-forest-black">
                Simulateur de Commentaires
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Testez vos règles instantanément sans aucun appel à Instagram ni envoi de message.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Commentaire fictif
                </label>
                <textarea
                  rows={3}
                  value={simComment}
                  onChange={(e) => setSimComment(e.target.value)}
                  placeholder="Tapez un commentaire..."
                  className="w-full rounded border border-border bg-background p-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Nom d'utilisateur fictif
                  </label>
                  <input
                    type="text"
                    value={simUsername}
                    onChange={(e) => setSimUsername(e.target.value)}
                    placeholder="alexandre_dev"
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    ID du Post cible (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={simMediaId}
                    onChange={(e) => setSimMediaId(e.target.value)}
                    placeholder="Laissez vide pour tester 'Tous les posts'"
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <Button
                onClick={handleRunSimulation}
                disabled={simRunning || !simComment.trim()}
                variant="volka"
                className="w-full flex items-center justify-center gap-2"
              >
                <Play className="size-3.5 fill-current text-gold" />
                <span>{simRunning ? "Simulation en cours..." : "Lancer la simulation"}</span>
              </Button>
            </div>
          </div>

          {/* Right: Simulation Output */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Résultat de l'analyse
              </span>
              <h3 className="mt-1 font-display text-xl font-normal text-forest-black">
                {simResult ? (
                  simResult.matched ? (
                    <span className="text-mint flex items-center gap-2">
                      <CheckCircle2 className="size-5" />
                      Règle déclenchée avec succès !
                    </span>
                  ) : (
                    <span className="text-gold flex items-center gap-2">
                      <AlertTriangle className="size-5" />
                      Aucune règle déclenchée
                    </span>
                  )
                ) : (
                  "En attente de test..."
                )}
              </h3>
            </div>

            {simResult && (
              <div className="space-y-4 text-xs">
                {/* Details card */}
                <div className="rounded border border-border bg-background/60 p-4 space-y-2.5">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Texte normalisé :</span>
                    <span className="font-mono font-medium text-foreground">
                      "{simResult.normalizedComment}"
                    </span>
                  </div>

                  {simResult.matched ? (
                    <>
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground">Règle appliquée :</span>
                        <span className="font-semibold text-gold">
                          {simResult.ruleName}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground">Mot-clé détecté :</span>
                        <span className="font-mono bg-primary px-2 py-0.5 rounded text-primary-foreground">
                          "{simResult.matchedKeyword}"
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">Motif du refus :</span>
                      <span className="font-mono text-terracotta font-semibold">
                        {simResult.skipReason}
                      </span>
                    </div>
                  )}
                </div>

                {/* DM Message Preview */}
                {simResult.matched && simResult.interpolatedDm && (
                  <div className="space-y-2">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 text-gold" />
                      Aperçu exact du message privé (DM) qui serait envoyé :
                    </span>
                    <div className="rounded border border-primary/40 bg-primary/5 p-4 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                      {simResult.interpolatedDm}
                    </div>
                  </div>
                )}

                {/* Public Reply Preview */}
                {simResult.matched && simResult.publicReply && (
                  <div className="space-y-2">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Send className="size-3.5 text-gold" />
                      Aperçu de la réponse publique sous le commentaire :
                    </span>
                    <div className="rounded border border-border bg-secondary/40 p-3 text-xs italic text-foreground">
                      "{simResult.publicReply}"
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 3: EVENTS LOG ──────────────── */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Rechercher par @utilisateur ou texte..."
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && refreshEvents()}
                className="rounded border border-border bg-background px-3 py-1.5 text-xs w-64 focus:border-gold focus:outline-none"
              />

              <select
                value={eventFilterStatus}
                onChange={(e) => setEventFilterStatus(e.target.value)}
                className="rounded border border-border bg-background px-2.5 py-1.5 text-xs focus:border-gold focus:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="sent">Envoyés (sent)</option>
                <option value="skipped">Ignorés (skipped)</option>
                <option value="failed">Échecs (failed)</option>
                <option value="received">Reçus (received)</option>
              </select>

              <Button size="sm" variant="outline" onClick={refreshEvents} disabled={eventsLoading}>
                <RefreshCw className={`size-3.5 ${eventsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 text-xs"
            >
              <Download className="size-3.5" />
              <span>Exporter en CSV</span>
            </Button>
          </div>

          {/* Events Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">Commentaire / Message</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Détails / Erreur</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Aucun événement Instagram enregistré dans cette vue.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(ev.received_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono">
                          {ev.kind}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-foreground">
                        {ev.username ? `@${ev.username}` : ev.ig_user_id || "Anonyme"}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                        "{ev.text || "—"}"
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            ev.status === "sent"
                              ? "bg-mint/30 text-forest-black"
                              : ev.status === "skipped"
                                ? "bg-secondary text-muted-foreground"
                                : ev.status === "failed"
                                  ? "bg-terracotta text-paper"
                                  : "bg-gold/20 text-gold"
                          }`}
                        >
                          {ev.status === "sent" && "✓ Envoyé"}
                          {ev.status === "skipped" && "Ignoré"}
                          {ev.status === "failed" && "✕ Échec"}
                          {ev.status === "received" && "Reçu"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px] font-mono text-muted-foreground max-w-xs truncate">
                        {ev.skip_reason ? (
                          <span className="text-gold">Raison: {ev.skip_reason}</span>
                        ) : ev.error ? (
                          <span className="text-terracotta">{ev.error}</span>
                        ) : (
                          "Traité"
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {ev.status === "failed" && (
                          <button
                            type="button"
                            onClick={() => handleRetryEvent(ev.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold hover:underline"
                          >
                            <RefreshCw className="size-3" />
                            <span>Réessayer</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 4: CONTACTS & STOP ──────────────── */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-display text-2xl font-light text-forest-black">
                Abonnés & Registre des Désinscriptions (STOP)
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Conformément aux règles Meta et à la politique de confidentialité Volka,
                tout utilisateur ayant répondu "STOP" est automatiquement bloqué de tout futur envoi de DM.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Utilisateur Instagram</th>
                    <th className="py-3 px-4">ID Instagram Scoped (IGSID)</th>
                    <th className="py-3 px-4">Premier contact</th>
                    <th className="py-3 px-4">Dernier échange</th>
                    <th className="py-3 px-4">Interactions</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        Aucun contact enregistré pour le moment.
                      </td>
                    </tr>
                  ) : (
                    contacts.map((c) => (
                      <tr key={c.ig_user_id} className="hover:bg-primary/5">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {c.username ? `@${c.username}` : "—"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          {c.ig_user_id}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(c.first_seen_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(c.last_event_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">
                          {c.events_count}
                        </td>
                        <td className="py-3 px-4">
                          {c.blocked ? (
                            <span className="rounded bg-terracotta/20 text-terracotta px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              Bloqué (STOP)
                            </span>
                          ) : (
                            <span className="rounded bg-mint/20 text-forest-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              Actif
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(c.ig_user_id, c.blocked)}
                            className="text-xs font-semibold hover:underline text-gold"
                          >
                            {c.blocked ? "Débloquer" : "Bloquer"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 5: CONNECTION & API SETTINGS ──────────────── */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                <Settings className="size-4" />
                <span>Paramètres Graph API</span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-light text-forest-black">
                Identifiants & Connexion Meta
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Jeton Page Access Token de votre compte professionnel Instagram et Page Facebook liée.
              </p>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Nom d'utilisateur Instagram (@)
                </label>
                <input
                  type="text"
                  value={connUsername}
                  onChange={(e) => setConnUsername(e.target.value)}
                  placeholder="volkastudio"
                  className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Instagram User ID
                  </label>
                  <input
                    type="text"
                    value={connIgUserId}
                    onChange={(e) => setConnIgUserId(e.target.value)}
                    placeholder="17841400000000"
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    value={connPageId}
                    onChange={(e) => setConnPageId(e.target.value)}
                    placeholder="100000000000"
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Page Access Token (Jeton Meta Graph API)
                </label>
                <input
                  type="password"
                  value={connAccessToken}
                  onChange={(e) => setConnAccessToken(e.target.value)}
                  placeholder={
                    connection?.hasToken
                      ? "•••••••••••••••••••••••••••••••• (Laissez vide pour conserver le jeton actuel)"
                      : "EAA..."
                  }
                  className="w-full rounded border border-border bg-background p-2.5 text-xs font-mono focus:border-gold focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Stocké de manière sécurisée côté serveur et jamais renvoyé au navigateur.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Plafond d'envois journalier (DMs / 24h)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={connDailyCap}
                  onChange={(e) => setConnDailyCap(parseInt(e.target.value, 10) || 200)}
                  className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={connTesting}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className={`size-3.5 ${connTesting ? "animate-spin" : ""}`} />
                  <span>Tester la connexion API</span>
                </Button>

                <Button type="submit" variant="volka" disabled={connSaving}>
                  {connSaving ? "Enregistrement..." : "Sauvegarder les identifiants"}
                </Button>
              </div>
            </form>
          </div>

          {/* Webhook Configuration Guide */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                Configuration Meta for Developers
              </span>
              <h3 className="mt-1 font-display text-xl font-light text-forest-black">
                Paramètres du Webhook Meta
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Renseignez ces informations dans l'App Dashboard de Meta pour recevoir les commentaires.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="rounded bg-background p-3 border border-border space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                  URL de rappel (Callback URL)
                </span>
                <div className="font-mono text-xs text-foreground select-all break-all">
                  https://volkastudio.com/api/ig/webhook
                </div>
              </div>

              <div className="rounded bg-background p-3 border border-border space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Jeton de vérification (Verify Token)
                </span>
                <div className="font-mono text-xs text-foreground select-all">
                  Valeur de IG_WEBHOOK_VERIFY_TOKEN configurée dans votre .env
                </div>
              </div>

              <div className="rounded bg-background p-3 border border-border space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Champs d'abonnement requis (Subscription Fields)
                </span>
                <div className="font-mono text-xs text-foreground flex flex-wrap gap-2 mt-1">
                  <span className="bg-primary px-2 py-0.5 rounded text-primary-foreground">
                    comments
                  </span>
                  <span className="bg-primary px-2 py-0.5 rounded text-primary-foreground">
                    messages
                  </span>
                </div>
              </div>

              <div className="rounded border border-primary/20 bg-primary/5 p-4 text-[11px] text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground mb-1">Rappel de conformité Meta :</p>
                Un commentaire constitue un consentement exprès pour un message privé unique
                contenant le lien sollicité. Toute relance commerciale ultérieure sans réponse
                est strictement proscrite.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── RULE EDITOR MODAL ──────────────── */}
      {isEditorOpen && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-xl font-light text-forest-black">
                  {editingRule.id ? "Modifier l'automatisation" : "Nouvelle automatisation"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Configurez le déclencheur, les mots-clés et le message privé personnalisé.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Nom de la règle
                </label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="Ex: Guide Acquisition B2B"
                  className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                />
              </div>

              {/* Trigger & Target Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Événement déclencheur
                  </label>
                  <select
                    value={editingRule.trigger}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, trigger: e.target.value as TriggerType })
                    }
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  >
                    <option value="comment">Commentaire sous une publication</option>
                    <option value="story_reply">Réponse à une story</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Périmètre de ciblage
                  </label>
                  <select
                    value={editingRule.target_mode}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, target_mode: e.target.value as TargetMode })
                    }
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  >
                    <option value="any">Toutes les publications</option>
                    <option value="selected">Publications choisies</option>
                  </select>
                </div>
              </div>

              {/* Match Mode & Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Correspondance
                  </label>
                  <select
                    value={editingRule.match_mode}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, match_mode: e.target.value as MatchMode })
                    }
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  >
                    <option value="word">Mot entier (recommandé)</option>
                    <option value="exact">Texte exact</option>
                    <option value="starts_with">Commence par</option>
                    <option value="contains">Contient</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-foreground mb-1">
                    Mots-clés déclencheurs (séparés par virgules)
                  </label>
                  <input
                    type="text"
                    value={editingRule.keywords.join(", ")}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="guide, acquisition, livre blanc"
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Exclude Keywords */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Mots-clés exclus (Optionnel, séparez par virgules)
                </label>
                <input
                  type="text"
                  value={editingRule.exclude_keywords?.join(", ") || ""}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      exclude_keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="non, pas de lien, arnaque"
                  className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                />
              </div>

              {/* Product link & tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Produit digital lié
                  </label>
                  <select
                    value={editingRule.product_id || ""}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        product_id: e.target.value || null,
                      })
                    }
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  >
                    <option value="">Aucun produit (Lien d'accueil)</option>
                    {((products || []) as any[]).map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (/tools/{p.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Tag de suivi source (ex: ?src=ig-...)
                  </label>
                  <input
                    type="text"
                    value={editingRule.link_src_tag || ""}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, link_src_tag: e.target.value })
                    }
                    placeholder="post-acquisition"
                    className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* DM Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-foreground">
                    Texte du Message Privé (DM)
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {editingRule.dm_text.length} caractères
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={editingRule.dm_text}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, dm_text: e.target.value })
                  }
                  className="w-full rounded border border-border bg-background p-3 text-xs font-mono focus:border-gold focus:outline-none leading-relaxed"
                />
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>Variables disponibles :</span>
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-gold">
                    {"{username}"}
                  </code>
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-gold">
                    {"{lien}"}
                  </code>
                </div>
              </div>

              {/* Public reply variant */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Réponse publique sous le commentaire (Optionnelle)
                </label>
                <input
                  type="text"
                  value={editingRule.public_reply_variants?.[0] || ""}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      public_reply_variants: e.target.value ? [e.target.value] : [],
                    })
                  }
                  placeholder="C'est envoyé en message privé ! 📩"
                  className="w-full rounded border border-border bg-background p-2.5 text-xs focus:border-gold focus:outline-none"
                />
              </div>

              {/* Anti-spam checkboxes */}
              <div className="pt-2 flex flex-wrap gap-6 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRule.one_per_user}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, one_per_user: e.target.checked })
                    }
                    className="rounded border-border text-gold focus:ring-gold"
                  />
                  <span>1 seul message par personne (Recommandé)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRule.is_active}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, is_active: e.target.checked })
                    }
                    className="rounded border-border text-gold focus:ring-gold"
                  />
                  <span>Règle activée immédiatement</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="volka"
                onClick={async () => {
                  try {
                    await saveIgAutomation({
                      data: {
                        id: editingRule.id || undefined,
                        name: editingRule.name,
                        isActive: editingRule.is_active,
                        trigger: editingRule.trigger,
                        targetMode: editingRule.target_mode,
                        matchMode: editingRule.match_mode,
                        keywords: editingRule.keywords,
                        excludeKeywords: editingRule.exclude_keywords || [],
                        dmText: editingRule.dm_text,
                        publicReplyVariants: editingRule.public_reply_variants || [],
                        productId: editingRule.product_id,
                        linkSrcTag: editingRule.link_src_tag,
                        onePerUser: editingRule.one_per_user,
                        cooldownHours: editingRule.cooldown_hours,
                        startsAt: editingRule.starts_at,
                        endsAt: editingRule.ends_at,
                      },
                    });

                    const fresh = await listIgAutomations();
                    setAutomations(fresh);
                    setIsEditorOpen(false);
                    showToast("Automatisation enregistrée avec succès !", "success");
                  } catch (err: unknown) {
                    showToast(err instanceof Error ? err.message : "Erreur de sauvegarde", "error");
                  }
                }}
              >
                Enregistrer l'automatisation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

