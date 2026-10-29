import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Lock,
  Server,
  Database,
  Globe,
  FileCode2,
  ChevronDown,
  ChevronRight,
  Info,
  KeyRound,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  getHealthDashboardData,
  triggerHealthChecks,
  getSecurityEvents,
} from "@/lib/admin/health.functions";
import type { HealthCheckResult, HealthSummary } from "@/lib/admin/health.server";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/admin/admin-auth-context";

export const Route = createFileRoute("/admin/health")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Santé & Sécurité — Volka Studio Admin" },
    ],
  }),
  loader: async () => {
    return await getHealthDashboardData();
  },
  component: AdminHealthPage,
});

interface SecurityEventItem {
  id: number;
  ts: string;
  type: string;
  severity: "info" | "warning" | "critical";
  actor_id: string | null;
  ip_hash: string | null;
  path: string | null;
  details: Record<string, unknown> | null;
}

const CATEGORY_METADATA = {
  config: {
    label: "Configuration & Environnement",
    icon: Server,
    description: "Variables système, serveurs SMTP, salage cryptographique et clés d'API",
  },
  permissions: {
    label: "Permissions & Self-Test Anon (F2)",
    icon: Lock,
    description: "Contrôles d'isolation RLS exécutés en direct avec la clé publique anon",
  },
  auth: {
    label: "Authentification & Rôles (F7)",
    icon: KeyRound,
    description: "Comptes habilités, répartition des rôles et contrôle des privilèges",
  },
  data: {
    label: "Pipeline & Intégrité des Données",
    icon: Database,
    description: "Suivi des délais de notification et détection des anomalies de transmission",
  },
  site: {
    label: "Endpoints Publics & Assets",
    icon: Globe,
    description: "Disponibilité des routes canoniques et présence des métadonnées de partage",
  },
} as const;

const FLAGGED_PROBLEMS = [
  {
    id: "F1",
    title: "Liens sociaux & WhatsApp en base de données",
    phase: "Phase 5b",
    status: "resolved",
    note: "Migré depuis le localStorage vers site_settings. Le numéro placeholder a été éliminé.",
  },
  {
    id: "F2",
    title: "Insertion anonyme directe révoquée",
    phase: "Phase 5b / 5c",
    status: "resolved",
    note: "Politique anon supprimée sur project_inquiries. Auto-testé à chaque vérification.",
  },
  {
    id: "F3",
    title: "Séparation alerte interne et auto-réponse",
    phase: "Phase 5b",
    status: "resolved",
    note: "Mailer scindé : le renvoi d'alerte ne duplique plus le message au visiteur.",
  },
  {
    id: "F7",
    title: "Rôles administrateurs & journal d'audit",
    phase: "Phase 5b",
    status: "resolved",
    note: "Rôles 'owner', 'sales', 'editor' vérifiés côté serveur avec journalisation admin_audit_log.",
  },
  {
    id: "F8",
    title: "Unification de l'interface studio en français",
    phase: "Phase 5b",
    status: "resolved",
    note: "Vocabulaire harmonisé, dates fr-FR et sélecteur de langue d'interface.",
  },
  {
    id: "F9",
    title: "Sécurisation de la recherche et comptages SQL",
    phase: "Phase 5b",
    status: "resolved",
    note: "Filtres PostgREST sécurisés et pagination serveur sans télécharger toutes les lignes.",
  },
  {
    id: "F10",
    title: "Locale par défaut alignée sur la page",
    phase: "Phase 5b",
    status: "resolved",
    note: "La soumission conserve la langue courante avec repli strict vers le français.",
  },
  {
    id: "F11",
    title: "Mesure d'audience et lecture sans cookies",
    phase: "Phase 12a",
    status: "resolved",
    note: "Analytics première partie (/api/m), hachage anonyme quotidien sha256 (D18), qualification de lecture D17, purge brute à 30 jours.",
  },
  {
    id: "F12",
    title: "Journal de sécurité et monitoring santé",
    phase: "Phase 5c",
    status: "resolved",
    note: "Table security_events, verrouillage anti-brute force, alertes email dédoublées.",
  },
] as const;

function AdminHealthPage() {
  const loaderData = Route.useLoaderData();
  const { role } = useAdminAuth();

  const [health, setHealth] = React.useState<HealthSummary>(loaderData.health);
  const [events, setEvents] = React.useState<SecurityEventItem[]>(
    loaderData.events as unknown as SecurityEventItem[]
  );
  const [running, setRunning] = React.useState(false);
  const [filterSeverity, setFilterSeverity] = React.useState<
    "all" | "critical" | "warning" | "info"
  >("all");
  const [expandedEventId, setExpandedEventId] = React.useState<number | null>(null);
  const [expandedCheckKey, setExpandedCheckKey] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Restrict view if not owner (D19)
  if (role && role !== "owner") {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex size-12 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <Lock className="size-6" />
        </div>
        <h1 className="font-display text-2xl font-light text-forest-black">
          Accès Réservé au Propriétaire
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Le tableau de bord Santé & Sécurité expose l'état d'intégrité de l'infrastructure
          et le flux d'événements sensibles. Conformément à la règle D19, cet écran est
          strictement réservé aux comptes détenteurs du rôle Propriétaire (owner).
        </p>
      </div>
    );
  }

  const handleRunChecks = async () => {
    setRunning(true);
    try {
      const updatedSummary = await triggerHealthChecks();
      setHealth(updatedSummary);

      // Refresh events stream
      const freshEvents = await getSecurityEvents({ data: { severity: "all", limit: 50 } });
      setEvents(freshEvents as unknown as SecurityEventItem[]);

      setToastMessage("Vérifications système exécutées avec succès.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setToastMessage(`Erreur lors des vérifications : ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (filterSeverity === "all") return true;
    return ev.severity === filterSeverity;
  });

  const resolvedProblemsCount = FLAGGED_PROBLEMS.filter((p) => p.status === "resolved").length;

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded border border-forest/30 bg-primary px-4 py-3 text-xs text-primary-foreground shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="size-4 text-gold shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <ShieldCheck className="size-4" />
            <span>Surveillance Studio — Propriétaire</span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-light text-forest-black sm:text-4xl">
            Santé & Sécurité Système
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
            Audit en temps réel des permissions, intégrité des secrets, résilience SMTP et flux
            des événements de sécurité.
          </p>
        </div>

        <Button
          onClick={handleRunChecks}
          disabled={running}
          variant="volka"
          className="shrink-0 flex items-center gap-2"
        >
          <RefreshCw className={`size-3.5 ${running ? "animate-spin text-primary" : ""}`} />
          <span>{running ? "Vérification en cours..." : "Lancer les vérifications"}</span>
        </Button>
      </div>

      {/* 1. Studio Pulse Hero (5c.4) */}
      <div
        className={`rounded-lg border p-6 transition-all shadow-sm ${
          health.overallStatus === "ok"
            ? "border-mint/50 bg-mint/15 text-forest-black"
            : health.overallStatus === "warning"
              ? "border-gold/40 bg-gold/15 text-forest-black"
              : "border-terracotta/40 bg-terracotta/15 text-forest-black"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 shrink-0">
              {health.overallStatus === "ok" ? (
                <div className="flex size-10 items-center justify-center rounded-full bg-mint text-forest-black shadow-sm">
                  <CheckCircle2 className="size-6" />
                </div>
              ) : health.overallStatus === "warning" ? (
                <div className="flex size-10 items-center justify-center rounded-full bg-gold text-forest-black shadow-sm">
                  <AlertTriangle className="size-6" />
                </div>
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-terracotta text-paper shadow-sm">
                  <AlertOctagon className="size-6" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {health.overallStatus === "ok"
                    ? "Système intègre et protégé"
                    : health.overallStatus === "warning"
                      ? "Points d'attention détectés"
                      : "Action requise immédiatement"}
                </span>
                <span className="text-[11px] opacity-60">·</span>
                <span className="text-xs opacity-75">
                  Vérifié le{" "}
                  {new Date(health.lastCheckedAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>

              <h2 className="mt-1 font-display text-2xl font-normal text-forest-black">
                {health.overallStatus === "ok"
                  ? "Tous les contrôles critiques et opérationnels sont au vert"
                  : health.overallStatus === "warning"
                    ? `${health.warningCount} point(s) nécessitent votre attention`
                    : `${health.errorCount} défaillance(s) critique(s) active(s)`}
              </h2>

              <p className="mt-1 text-xs opacity-80 max-w-xl">
                Protection anti-brute force active, sel cryptographique vérifié, auto-test F2
                verrouillé et alertes propriétaires prêtes à être expédiées.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-forest-black/15 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="text-center px-2">
              <span className="block text-2xl font-semibold font-mono text-forest-black">
                {health.okCount}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-forest-black/70">
                Conformes
              </span>
            </div>
            <div className="text-center px-2">
              <span className="block text-2xl font-semibold font-mono text-gold">
                {health.warningCount}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-forest-black/70">
                Attention
              </span>
            </div>
            <div className="text-center px-2">
              <span className="block text-2xl font-semibold font-mono text-terracotta">
                {health.errorCount}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-forest-black/70">
                Critiques
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Flagged Problem Tracker (F1-F12) */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="size-4 text-gold" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Registre des Vulnérabilités & Problèmes Signalés
              </h3>
              <p className="text-xs text-muted-foreground">
                Suivi systématique des constats F1 à F12 documentés dans le plan v2.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest-black border border-forest/20">
            <span>
              {resolvedProblemsCount} / {FLAGGED_PROBLEMS.length} corrigés
            </span>
            <span className="text-gold">
              ({Math.round((resolvedProblemsCount / FLAGGED_PROBLEMS.length) * 100)}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${(resolvedProblemsCount / FLAGGED_PROBLEMS.length) * 100}%`,
            }}
          />
        </div>

        {/* Problems Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FLAGGED_PROBLEMS.map((problem) => (
            <div
              key={problem.id}
              className="rounded border border-border/80 bg-background/60 p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-gold">{problem.id}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      problem.status === "resolved"
                        ? "bg-mint/30 text-forest-black"
                        : "bg-gold/20 text-gold"
                    }`}
                  >
                    {problem.status === "resolved" ? "✓ Corrigé" : "⚙ En cours"}
                  </span>
                </div>
                <h4 className="mt-1.5 text-xs font-semibold text-foreground leading-snug">
                  {problem.title}
                </h4>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  {problem.note}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                {problem.phase}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Categorized Health Checks Grid (5c.2) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-light text-forest-black">
            Contrôles Système Catégorisés
          </h3>
          <span className="text-xs text-muted-foreground">
            {health.checks.length} vérifications actives
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(
            Object.keys(CATEGORY_METADATA) as Array<keyof typeof CATEGORY_METADATA>
          ).map((groupKey) => {
            const groupMeta = CATEGORY_METADATA[groupKey];
            const groupChecks = health.checks.filter((c) => c.groupName === groupKey);
            const Icon = groupMeta.icon;

            return (
              <div
                key={groupKey}
                className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start gap-3 border-b border-border/60 pb-3">
                  <div className="p-2 rounded bg-primary text-primary-foreground shrink-0">
                    <Icon className="size-4 text-gold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {groupMeta.label}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {groupMeta.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {groupChecks.map((check) => {
                    const isExpanded = expandedCheckKey === check.key;
                    return (
                      <div
                        key={check.key}
                        className={`rounded border p-3 transition-colors ${
                          check.status === "ok"
                            ? "border-border/60 bg-background/50 hover:border-border"
                            : check.status === "warning"
                              ? "border-gold/50 bg-gold/5"
                              : "border-terracotta/50 bg-terracotta/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {/* Accessible status badge with shape, icon and text */}
                              <span
                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  check.status === "ok"
                                    ? "bg-mint/30 text-forest-black"
                                    : check.status === "warning"
                                      ? "bg-gold/25 text-forest-black"
                                      : "bg-terracotta text-paper"
                                }`}
                              >
                                {check.status === "ok" ? (
                                  <>
                                    <span>[✓]</span>
                                    <span>Conforme</span>
                                  </>
                                ) : check.status === "warning" ? (
                                  <>
                                    <span>[▲]</span>
                                    <span>Attention</span>
                                  </>
                                ) : (
                                  <>
                                    <span>[✕]</span>
                                    <span>Critique</span>
                                  </>
                                )}
                              </span>
                              <span className="font-mono text-xs font-medium text-foreground">
                                {check.key}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {check.detail}
                            </p>
                          </div>

                          {check.hint && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedCheckKey(isExpanded ? null : check.key)
                              }
                              className="text-xs text-gold hover:text-foreground shrink-0 p-1"
                              title="Afficher la recommandation technique"
                            >
                              <Info className="size-4" />
                            </button>
                          )}
                        </div>

                        {/* Collapsible Actionable Remediation Hint */}
                        {check.hint && isExpanded && (
                          <div className="mt-2.5 pt-2 border-t border-border/40 text-xs text-muted-foreground bg-primary/5 p-2 rounded">
                            <span className="font-semibold text-foreground">
                              Recommandation :{" "}
                            </span>
                            <span>{check.hint}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Security Events Stream (5c.1) */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
              <FileCode2 className="size-4" />
              <span>Journalisation Côté Serveur</span>
            </div>
            <h3 className="mt-1 text-base font-semibold text-foreground">
              Flux des Événements de Sécurité (security_events)
            </h3>
            <p className="text-xs text-muted-foreground">
              Enregistre les échecs de connexion, contournements honeypot, blocages rate-limit et alertes. Rétention : 90 jours.
            </p>
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-1 rounded border border-border bg-background p-1 text-xs">
            {(["all", "critical", "warning", "info"] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterSeverity === sev
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sev === "all"
                  ? "Tous"
                  : sev === "critical"
                    ? "Critique"
                    : sev === "warning"
                      ? "Avertissement"
                      : "Info"}
              </button>
            ))}
          </div>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-3">Date & Heure</th>
                <th className="py-2.5 px-3">Gravité</th>
                <th className="py-2.5 px-3">Type d'événement</th>
                <th className="py-2.5 px-3">Empreinte IP / Acteur</th>
                <th className="py-2.5 px-3">Chemin</th>
                <th className="py-2.5 px-3 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Aucun événement de sécurité correspondant à ce filtre.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const isExpanded = expandedEventId === ev.id;
                  return (
                    <React.Fragment key={ev.id}>
                      <tr className="hover:bg-primary/5 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(ev.ts).toLocaleString("fr-FR", {
                            timeZone: "Africa/Porto-Novo",
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              ev.severity === "critical"
                                ? "bg-terracotta text-paper"
                                : ev.severity === "warning"
                                  ? "bg-gold/25 text-forest-black"
                                  : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {ev.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                          {ev.type}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground truncate max-w-[140px]">
                          {ev.actor_id ? `User: ${ev.actor_id.slice(0, 8)}...` : ev.ip_hash ? `IP: ${ev.ip_hash.slice(0, 10)}...` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                          {ev.path || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedEventId(isExpanded ? null : ev.id)
                            }
                            className="inline-flex items-center gap-1 text-gold hover:text-foreground font-mono text-[11px]"
                          >
                            <span>JSON</span>
                            {isExpanded ? (
                              <ChevronDown className="size-3" />
                            ) : (
                              <ChevronRight className="size-3" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON details drawer */}
                      {isExpanded && (
                        <tr className="bg-primary/5">
                          <td colSpan={6} className="p-3">
                            <pre className="rounded bg-primary p-3 text-[11px] font-mono text-primary-foreground overflow-x-auto max-h-48 border border-border">
                              {JSON.stringify(
                                {
                                  id: ev.id,
                                  type: ev.type,
                                  severity: ev.severity,
                                  actorId: ev.actor_id,
                                  ipHash: ev.ip_hash,
                                  path: ev.path,
                                  details: ev.details,
                                },
                                null,
                                2
                              )}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
