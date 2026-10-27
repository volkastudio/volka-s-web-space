import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  ArrowLeft,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  Library,
  Search,
  Globe,
  Phone,
  Mail,
  Building,
  User,
  Check,
  Copy,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getAdminAudit } from "@/lib/audit/audit.functions";
import {
  createAdminAuditReport,
  getAdminFindingsLibrary,
} from "@/lib/audit/audit-report.functions";
import type {
  AuditScorecardItem,
  AuditFinding,
  AuditRecommendation,
} from "@/lib/audit/audit-report.server";

const searchSchema = z.object({
  id: z.string().uuid(),
});

export const Route = createFileRoute("/admin/audits/workbench")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Workbench d'Audit — Volka Studio Admin" },
    ],
  }),
  loader: async ({ location }) => {
    const search = location.search as { id: string };
    const [audit, library] = await Promise.all([
      getAdminAudit({ data: { id: search.id } }),
      getAdminFindingsLibrary({}),
    ]);
    return { audit, library: library ?? [] };
  },
  component: AuditWorkbenchPage,
});

const DEFAULT_PILLARS = [
  { pillar: "Conversion & Parcours", score: 3.5, label: "Solide, optimisation requise" },
  { pillar: "Perception & Clarté", score: 3.0, label: "Message perfectible" },
  { pillar: "Acquisition & Visibilité", score: 2.5, label: "Fragile, dépendance forte" },
  { pillar: "Performance & Mobile", score: 4.0, label: "Très bon niveau technique" },
  { pillar: "Processus & Suivi", score: 2.0, label: "Critique, fuite de leads" },
];

const OFFERS = [
  {
    id: "offer-1",
    label: "Offre 1 — Diagnostic & Clarification Rapide",
    defaultRationale:
      "Votre socle est sain mais votre proposition de valeur et vos parcours directs (WhatsApp, mobile) créent de la friction. Une clarification ciblée suffit pour débloquer les conversions immédiates.",
  },
  {
    id: "offer-2",
    label: "Offre 2 — Brand Platform & Refonte Digitale",
    defaultRationale:
      "La perception actuelle de votre marque ne reflète pas la qualité réelle de votre service. Une refonte de votre plateforme de marque et de votre vitrine web repositionnera votre autorité.",
  },
  {
    id: "offer-3",
    label: "Offre 3 — Système Complet d'Acquisition & Vente",
    defaultRationale:
      "Votre principal frein est organisationnel et automatisé : aucun suivi systématique n'est opéré après le premier contact. L'architecture d'un système complet d'acquisition et de relance s'impose.",
  },
];

function AuditWorkbenchPage() {
  const { audit, library } = Route.useLoaderData() as {
    audit: any;
    library: any[];
  };

  // Stopwatch state (measuring minutes spent per D15)
  const [stopwatchSeconds, setStopwatchSeconds] = React.useState(
    (audit?.minutes_spent ?? 0) * 60
  );
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const minutesSpent = Math.max(1, Math.round(stopwatchSeconds / 60));

  // Scorecard state
  const [scorecard, setScorecard] = React.useState<AuditScorecardItem[]>(DEFAULT_PILLARS);

  // Top 3 Findings state
  const [findings, setFindings] = React.useState<AuditFinding[]>([
    {
      title: "Bouton WhatsApp sans message pré-rempli",
      why: "Le prospect doit inventer sa question, ce qui crée de la friction et réduit les prises de contact spontanées.",
      fix: "Configurer un lien wa.me avec message d'accroche personnalisé selon l'offre vue.",
      impact: 5,
      effort: 1,
      type: "finding",
    },
    {
      title: "Titre principal trop abstrait au-dessus du pli",
      why: "Dans les 5 premières secondes, le visiteur ne comprend pas à qui s'adresse l'offre ni le problème résolu.",
      fix: "Formuler un titre orienté bénéfice direct et problème client cible.",
      impact: 4,
      effort: 2,
      type: "finding",
    },
  ]);

  // Quick Wins state
  const [quickWins, setQuickWins] = React.useState<AuditFinding[]>([
    {
      title: "Ajout d'un badge de preuve sociale sur le hero",
      why: "Rassure immédiatement les visiteurs indécis avant le premier scroll.",
      fix: "Intégrer un chiffre clé vérifiable ou citation client dans les 300 premiers pixels.",
      impact: 4,
      effort: 1,
      type: "quick_win",
    },
  ]);

  // Recommendation state
  const [recommendation, setRecommendation] = React.useState<AuditRecommendation>({
    offer: "offer-2",
    offer_label: OFFERS[1]?.label ?? "Offre 2",
    rationale: OFFERS[1]?.defaultRationale ?? "",
  });

  // UI state
  const [showLibraryDrawer, setShowLibraryDrawer] = React.useState(false);
  const [libraryFilterTrack, setLibraryFilterTrack] = React.useState<string>("all");
  const [librarySearch, setLibrarySearch] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [sentReportData, setSentReportData] = React.useState<{
    url: string;
    token: string;
    emailSent: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Scorecard update helpers
  const handleScoreChange = (index: number, newScore: number) => {
    setScorecard((prev) =>
      prev.map((p, idx) => {
        if (idx !== index) return p;
        let label = "Solide";
        if (newScore <= 1.5) label = "Critique — intervention requise";
        else if (newScore <= 2.5) label = "Fragile — fuite de performance";
        else if (newScore <= 3.5) label = "Perfectible — potentiel inexploité";
        else if (newScore <= 4.5) label = "Solide — optimisations de détail";
        else label = "Exemplaire — référence du secteur";
        return { ...p, score: newScore, label };
      })
    );
  };

  // Library insertion
  const handleAddFromLibrary = (item: any, asQuickWin = false) => {
    const newFinding: AuditFinding = {
      title: item.title_fr,
      why: item.why_fr,
      fix: item.fix_fr,
      impact: item.impact,
      effort: item.effort,
      type: asQuickWin ? "quick_win" : "finding",
    };

    if (asQuickWin) {
      if (quickWins.length >= 3) {
        alert("Maximum 3 quick wins recommandés.");
        return;
      }
      setQuickWins((prev) => [...prev, newFinding]);
    } else {
      if (findings.length >= 3) {
        alert("Maximum 3 constats prioritaires recommandés.");
        return;
      }
      setFindings((prev) => [...prev, newFinding]);
    }
    setShowLibraryDrawer(false);
  };

  // Submit / Send Report
  const handleSendReport = async () => {
    if (!confirm(`Confirmez-vous la génération et l'envoi du rapport d'audit à ${audit.contact_email} ?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAdminAuditReport({
        data: {
          auditRequestId: audit.id,
          locale: "fr",
          scorecard,
          findings,
          quickWins,
          recommendation,
          minutesSpent,
          sendEmail: true,
        },
      });

      if (res.success && res.token && res.reportUrl) {
        setSentReportData({
          url: res.reportUrl,
          token: res.token,
          emailSent: Boolean(res.emailSent),
        });
      } else {
        alert(res.error || "Une erreur est survenue.");
      }
    } catch (err: any) {
      alert(err.message || "Erreur de transmission.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Average scorecard score
  const avgScore = (
    scorecard.reduce((acc, curr) => acc + curr.score, 0) / (scorecard.length || 1)
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-warm-ivory text-forest-black">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-warm-ivory/90 backdrop-blur-md border-b border-pine/15 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="/admin/audits"
              className="p-2 rounded-lg hover:bg-soft-paper text-forest-black/70 hover:text-forest-black transition-colors"
            >
              <ArrowLeft className="size-4" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-forest-black/50">
                  Workbench d'analyse
                </span>
                <span className="px-2 py-0.5 rounded-full bg-pine/10 text-[10px] font-semibold text-pine">
                  {audit.track.toUpperCase()}
                </span>
              </div>
              <h1 className="font-display text-2xl font-light text-forest-black">
                {audit.company_name}{" "}
                <span className="text-forest-black/50 text-lg font-sans">
                  — {audit.contact_name}
                </span>
              </h1>
            </div>
          </div>

          {/* Stopwatch & Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Stopwatch Timer (feeds D15 time-box) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-soft-paper border border-pine/20 text-xs">
              <Clock className="size-3.5 text-ochre" />
              <span className="font-mono font-semibold text-forest-black">
                {Math.floor(stopwatchSeconds / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(stopwatchSeconds % 60).toString().padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1 border-l border-pine/15 pl-2 ml-1">
                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className="p-1 rounded hover:bg-pine/10 text-forest-black/80"
                  title={isRunning ? "Pause" : "Démarrer"}
                >
                  {isRunning ? <Pause className="size-3" /> : <Play className="size-3 text-pine" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setStopwatchSeconds(0);
                  }}
                  className="p-1 rounded hover:bg-pine/10 text-forest-black/50"
                  title="Réinitialiser"
                >
                  <RotateCcw className="size-3" />
                </button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="text-xs border-pine/20 hover:bg-soft-paper flex items-center gap-1.5"
            >
              <Eye className="size-3.5 text-forest-black/70" />
              Prévisualiser
            </Button>

            <Button
              size="sm"
              onClick={handleSendReport}
              disabled={submitting}
              className="text-xs bg-pine text-paper hover:bg-pine/90 flex items-center gap-1.5 shadow-sm"
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5 text-mint" />
              )}
              Générer & Envoyer le Rapport
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: CLIENT DOSSIER & CONTEXT (4 COLS) */}
        <section className="lg:col-span-4 space-y-6">
          {/* Client Card */}
          <div className="bg-soft-paper/60 p-5 rounded-xl border border-pine/15 space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-wider text-forest-black/50 block">
              Dossier Client
            </span>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-forest-black">
                <Building className="size-3.5 text-pine shrink-0" />
                <span className="font-semibold">{audit.company_name}</span>
                <span className="text-forest-black/60">({audit.country})</span>
              </div>
              <div className="flex items-center gap-2 text-forest-black/80">
                <User className="size-3.5 text-forest-black/50 shrink-0" />
                <span>{audit.contact_name}</span>
              </div>
              <div className="flex items-center gap-2 text-forest-black/80">
                <Mail className="size-3.5 text-forest-black/50 shrink-0" />
                <a href={`mailto:${audit.contact_email}`} className="hover:underline">
                  {audit.contact_email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-forest-black/80">
                <Phone className="size-3.5 text-forest-black/50 shrink-0" />
                <a
                  href={`https://wa.me/${audit.contact_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-pine font-medium hover:underline inline-flex items-center gap-1"
                >
                  {audit.contact_phone}
                  <ExternalLink className="size-2.5" />
                </a>
              </div>
              {audit.website_url && (
                <div className="flex items-center gap-2 text-forest-black/80 pt-1 border-t border-pine/10">
                  <Globe className="size-3.5 text-pine shrink-0" />
                  <a
                    href={
                      audit.website_url.startsWith("http")
                        ? audit.website_url
                        : `https://${audit.website_url}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-pine hover:underline truncate inline-flex items-center gap-1 font-medium"
                  >
                    {audit.website_url}
                    <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Answers Questionnaire */}
          <div className="bg-soft-paper/60 p-5 rounded-xl border border-pine/15 space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-wider text-forest-black/50 block">
              Réponses au questionnaire initial
            </span>
            <div className="space-y-3 text-xs">
              {Object.entries(audit.specific_answers || {}).length === 0 ? (
                <p className="text-forest-black/50 italic">Aucune question spécifique renseignée.</p>
              ) : (
                Object.entries(audit.specific_answers || {}).map(([key, val], idx) => (
                  <div key={key} className="p-3 bg-warm-ivory rounded-lg border border-pine/10 space-y-1">
                    <span className="text-[10px] font-mono text-forest-black/60 block">
                      Q{idx + 1} : {key}
                    </span>
                    <p className="text-forest-black/90 font-sans leading-relaxed">
                      {String(val)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Existing Reports History */}
          <div className="bg-soft-paper/60 p-5 rounded-xl border border-pine/15 space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-forest-black/50 block">
              Historique des rapports émis
            </span>
            {(audit.audit_reports || []).length === 0 ? (
              <p className="text-xs text-forest-black/50 italic">
                Aucun rapport généré pour cet audit pour le moment.
              </p>
            ) : (
              (audit.audit_reports || []).map((rep: any) => (
                <div
                  key={rep.id}
                  className="p-3 bg-warm-ivory rounded-lg border border-pine/10 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-forest-black">
                      Émis le {new Date(rep.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-mint/20 text-pine font-medium">
                      {rep.view_count || 0} vue{(rep.view_count || 0) > 1 ? "s" : ""}
                    </span>
                  </div>
                  {rep.first_viewed_at && (
                    <span className="text-[11px] text-forest-black/60 block">
                      1ère vue : {new Date(rep.first_viewed_at).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: REPORT COMPOSER (8 COLS) */}
        <section className="lg:col-span-8 space-y-8">
          {/* SECTION 1: SCORECARD BUILDER */}
          <div className="bg-soft-paper/40 p-6 rounded-xl border border-pine/15 space-y-5">
            <div className="flex items-center justify-between border-b border-pine/10 pb-3">
              <div>
                <h2 className="font-display text-xl text-forest-black font-semibold">
                  1. Scorecard d'Évaluation (5 Piliers)
                </h2>
                <p className="text-xs text-forest-black/70">
                  Notez chaque dimension de 0 à 5 selon votre diagnostic d'expert.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-forest-black/50 block">
                  Score Global
                </span>
                <span className="text-2xl font-bold font-mono text-pine">{avgScore} / 5</span>
              </div>
            </div>

            <div className="space-y-4">
              {scorecard.map((item, idx) => (
                <div
                  key={item.pillar}
                  className="p-4 bg-warm-ivory rounded-lg border border-pine/10 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-forest-black">
                      {item.pillar}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-pine">
                        {item.score.toFixed(1)} / 5
                      </span>
                      <span className="text-[11px] text-forest-black/60 italic">
                        ({item.label})
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={item.score}
                    onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value))}
                    className="w-full accent-pine cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: TOP 3 FINDINGS */}
          <div className="bg-soft-paper/40 p-6 rounded-xl border border-pine/15 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pine/10 pb-3">
              <div>
                <h2 className="font-display text-xl text-forest-black font-semibold">
                  2. Constats Majeurs (Top 3 Findings)
                </h2>
                <p className="text-xs text-forest-black/70">
                  Les points de friction principaux qui bloquent la croissance du client.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLibraryDrawer(true)}
                  className="text-xs h-7 border-pine/20 hover:bg-soft-paper flex items-center gap-1"
                >
                  <Library className="size-3 text-pine" />
                  Bibliothèque
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFindings((prev) => [
                      ...prev,
                      {
                        title: "Nouveau constat",
                        why: "Explication de l'impact...",
                        fix: "Action corrective recommandée...",
                        impact: 4,
                        effort: 2,
                        type: "finding",
                      },
                    ])
                  }
                  disabled={findings.length >= 3}
                  className="text-xs h-7 border-pine/20 hover:bg-soft-paper flex items-center gap-1"
                >
                  <Plus className="size-3" />
                  Ajouter libre
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {findings.map((f, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-warm-ivory rounded-lg border border-pine/10 space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pine/10 text-pine font-bold">
                      Constat #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFindings((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 rounded text-terracotta hover:bg-terracotta/10 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-forest-black/70">Titre du constat</Label>
                    <Input
                      value={f.title}
                      onChange={(e) =>
                        setFindings((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, title: e.target.value } : item
                          )
                        )
                      }
                      className="bg-soft-paper border-pine/20 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-forest-black/70">
                      Pourquoi c'est important (impact mesurable)
                    </Label>
                    <Textarea
                      rows={2}
                      value={f.why}
                      onChange={(e) =>
                        setFindings((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, why: e.target.value } : item
                          )
                        )
                      }
                      className="bg-soft-paper border-pine/20 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-forest-black/70">
                      Comment corriger (action prescriptive)
                    </Label>
                    <Textarea
                      rows={2}
                      value={f.fix}
                      onChange={(e) =>
                        setFindings((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, fix: e.target.value } : item
                          )
                        )
                      }
                      className="bg-soft-paper border-pine/20 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <Label className="text-[10px] text-forest-black/60">
                        Impact : {f.impact} / 5
                      </Label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={f.impact}
                        onChange={(e) =>
                          setFindings((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, impact: parseInt(e.target.value) } : item
                            )
                          )
                        }
                        className="w-full accent-pine"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-forest-black/60">
                        Effort : {f.effort} / 5
                      </Label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={f.effort}
                        onChange={(e) =>
                          setFindings((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, effort: parseInt(e.target.value) } : item
                            )
                          )
                        }
                        className="w-full accent-ochre"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: TOP 3 QUICK WINS */}
          <div className="bg-soft-paper/40 p-6 rounded-xl border border-pine/15 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pine/10 pb-3">
              <div>
                <h2 className="font-display text-xl text-forest-black font-semibold">
                  3. Gains Rapides (Top 3 Quick Wins)
                </h2>
                <p className="text-xs text-forest-black/70">
                  Actions immédiates à fort impact réalisables en moins de 48 heures.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setQuickWins((prev) => [
                    ...prev,
                    {
                      title: "Nouveau gain rapide",
                      why: "Gain immédiat...",
                      fix: "Mise en place...",
                      impact: 4,
                      effort: 1,
                      type: "quick_win",
                    },
                  ])
                }
                disabled={quickWins.length >= 3}
                className="text-xs h-7 border-pine/20 hover:bg-soft-paper flex items-center gap-1"
              >
                <Plus className="size-3" />
                Ajouter quick win
              </Button>
            </div>

            <div className="space-y-4">
              {quickWins.map((qw, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-warm-ivory rounded-lg border border-pine/10 space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mint/20 text-pine font-bold">
                      Quick Win #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuickWins((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 rounded text-terracotta hover:bg-terracotta/10 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-forest-black/70">Titre</Label>
                    <Input
                      value={qw.title}
                      onChange={(e) =>
                        setQuickWins((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, title: e.target.value } : item
                          )
                        )
                      }
                      className="bg-soft-paper border-pine/20 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-forest-black/70">Action à déployer</Label>
                    <Textarea
                      rows={2}
                      value={qw.fix}
                      onChange={(e) =>
                        setQuickWins((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, fix: e.target.value } : item
                          )
                        )
                      }
                      className="bg-soft-paper border-pine/20 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: VOLKA RECOMMENDATION */}
          <div className="bg-soft-paper/40 p-6 rounded-xl border border-pine/15 space-y-5">
            <div className="border-b border-pine/10 pb-3">
              <h2 className="font-display text-xl text-forest-black font-semibold">
                4. Recommandation Stratégique Volka
              </h2>
              <p className="text-xs text-forest-black/70">
                Orientation prescriptive vers l'offre de service la plus adaptée à leur stade.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="font-medium text-forest-black">Offre recommandée</Label>
                <select
                  value={recommendation.offer}
                  onChange={(e) => {
                    const sel = OFFERS.find((o) => o.id === e.target.value);
                    if (sel) {
                      setRecommendation({
                        offer: sel.id,
                        offer_label: sel.label,
                        rationale: sel.defaultRationale,
                      });
                    }
                  }}
                  className="w-full h-9 px-3 rounded-md bg-warm-ivory border border-pine/20 text-xs text-forest-black focus:outline-none"
                >
                  {OFFERS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-medium text-forest-black">
                  Argumentaire & Justification personnalisée
                </Label>
                <Textarea
                  rows={4}
                  value={recommendation.rationale}
                  onChange={(e) =>
                    setRecommendation({ ...recommendation, rationale: e.target.value })
                  }
                  className="bg-warm-ivory border-pine/20 text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FINDINGS LIBRARY DRAWER */}
      {showLibraryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-forest-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowLibraryDrawer(false)}
          />
          <div className="relative w-full max-w-lg bg-warm-ivory border-l border-pine/20 h-full overflow-y-auto p-6 space-y-6 shadow-2xl z-10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-pine/10 pb-4">
                <div>
                  <h3 className="font-display text-xl text-forest-black font-semibold">
                    Bibliothèque de Constats
                  </h3>
                  <p className="text-xs text-forest-black/70">
                    Insérez des analyses éprouvées en 1 clic
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLibraryDrawer(false)}
                  className="p-1.5 rounded-full hover:bg-soft-paper text-forest-black/60 hover:text-forest-black"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Search & Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="size-3.5 text-forest-black/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Filtrer par mot-clé (ex: WhatsApp, PageSpeed)..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="pl-8 bg-soft-paper border-pine/20 text-xs h-8"
                  />
                </div>
                <div className="flex gap-1.5">
                  {["all", "website", "marketing", "sales", "general"].map((trk) => (
                    <button
                      key={trk}
                      type="button"
                      onClick={() => setLibraryFilterTrack(trk)}
                      className={`px-2 py-0.5 rounded text-[11px] capitalize ${
                        libraryFilterTrack === trk
                          ? "bg-pine text-paper font-semibold"
                          : "bg-soft-paper text-forest-black/70 hover:bg-soft-paper/80"
                      }`}
                    >
                      {trk === "all" ? "Tous" : trk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 pt-2">
                {library
                  .filter((item) => {
                    if (libraryFilterTrack !== "all" && item.track !== libraryFilterTrack)
                      return false;
                    if (
                      librarySearch &&
                      !item.title_fr?.toLowerCase().includes(librarySearch.toLowerCase()) &&
                      !item.why_fr?.toLowerCase().includes(librarySearch.toLowerCase())
                    ) {
                      return false;
                    }
                    return true;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-soft-paper/70 rounded-lg border border-pine/15 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-forest-black">{item.title_fr}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-pine/10 text-pine shrink-0 uppercase font-mono">
                          {item.track}
                        </span>
                      </div>
                      <p className="text-[11px] text-forest-black/70 leading-relaxed">
                        {item.why_fr}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-pine/10">
                        <div className="flex items-center gap-2 text-[10px] text-forest-black/60">
                          <span>Impact : {item.impact}/5</span>
                          <span>·</span>
                          <span>Effort : {item.effort}/5</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddFromLibrary(item, true)}
                            className="text-[10px] h-6 px-2 hover:bg-mint/20 hover:text-pine"
                          >
                            + Quick Win
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddFromLibrary(item, false)}
                            className="text-[10px] h-6 px-2 bg-pine text-paper hover:bg-pine/90"
                          >
                            + Constat
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-4 border-t border-pine/10 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLibraryDrawer(false)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT SENT CONFIRMATION MODAL */}
      {sentReportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-forest-black/60 backdrop-blur-xs" />
          <div className="relative bg-warm-ivory border border-pine/20 rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-mint/20 text-pine">
                <CheckCircle2 className="size-6 text-pine" />
              </div>
              <div>
                <h3 className="font-display text-2xl text-forest-black font-semibold">
                  Rapport envoyé avec succès !
                </h3>
                <p className="text-xs text-forest-black/70">
                  Le client a été notifié et le jeton sécurisé est actif pour 90 jours.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-soft-paper border border-pine/15 space-y-1.5">
                <span className="font-semibold text-forest-black block">Lien privé du rapport :</span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={sentReportData.url}
                    className="bg-warm-ivory border-pine/20 text-xs font-mono select-all"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(sentReportData.url)}
                    className="bg-pine text-paper hover:bg-pine/90 text-xs shrink-0"
                  >
                    {copiedLink ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-forest-black/70 text-xs">
                <ShieldCheck className="size-4 text-mint shrink-0" />
                <span>
                  {sentReportData.emailSent
                    ? `Email délivré à ${audit.contact_email}`
                    : `Lien généré (mode test ou SMTP non configuré)`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-pine/10">
              <a
                href={sentReportData.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-pine/20 text-xs font-medium text-forest-black hover:bg-soft-paper"
              >
                <Eye className="size-3.5" />
                Voir la page du rapport
              </a>
              <Button
                onClick={() => setSentReportData(null)}
                className="bg-pine text-paper hover:bg-pine/90 text-xs"
              >
                Terminer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-black/60 backdrop-blur-xs"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="relative bg-warm-ivory border border-pine/20 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-pine/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-forest-black/50">
                  Aperçu éditorial du rapport
                </span>
                <h3 className="font-display text-2xl text-forest-black">
                  Diagnostic de croissance — {audit.company_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1.5 rounded-full hover:bg-soft-paper text-forest-black/60"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scorecard visual */}
            <div className="space-y-3">
              <span className="text-xs uppercase font-mono tracking-wider text-forest-black/60 block">
                Scorecard ({avgScore} / 5.0)
              </span>
              <div className="space-y-2">
                {scorecard.map((item) => (
                  <div key={item.pillar} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-forest-black">{item.pillar}</span>
                      <span className="font-mono font-bold text-pine">{item.score} / 5</span>
                    </div>
                    <div className="h-2 rounded-full bg-forest-black/10 overflow-hidden">
                      <div
                        className="h-full bg-pine transition-all"
                        style={{ width: `${(item.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 3 Findings */}
            <div className="space-y-3 pt-3 border-t border-pine/10">
              <span className="text-xs uppercase font-mono tracking-wider text-forest-black/60 block">
                Top 3 Constats prioritaires
              </span>
              <div className="space-y-3">
                {findings.map((f, i) => (
                  <div key={i} className="p-3 bg-soft-paper/60 rounded-lg border border-pine/10 text-xs space-y-1">
                    <span className="font-semibold text-forest-black block">{f.title}</span>
                    <p className="text-forest-black/70"><strong>Pourquoi :</strong> {f.why}</p>
                    <p className="text-forest-black/80"><strong>Solution :</strong> {f.fix}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="p-4 rounded-lg bg-pine text-paper space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-mint block">
                Recommandation Volka Studio
              </span>
              <h4 className="font-display text-lg font-semibold">{recommendation.offer_label}</h4>
              <p className="text-xs text-paper/85 leading-relaxed">{recommendation.rationale}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(false)}
                className="text-xs"
              >
                Fermer l'aperçu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
