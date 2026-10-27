import * as React from "react";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { z } from "zod";
import {
  ArrowRight,
  Star,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Eye,
  Printer,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicAuditReport } from "@/lib/audit/audit-report.functions";
import type { AuditReportData, AuditFinding, AuditScorecardItem } from "@/lib/audit/audit-report.server";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/audit/rapport")(({
  validateSearch: searchSchema,
  loader: async ({ location }) => {
    const token = (location.search as { token?: string }).token;
    if (!token) {
      throw notFound();
    }
    const result = await getPublicAuditReport({ data: { token } });
    if (!result.success || !result.report) {
      // Return the error state to the component
      return { success: false, error: result.error ?? "Rapport introuvable." };
    }
    return { success: true, report: result.report };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.success && loaderData.report
          ? `Diagnostic de croissance — ${loaderData.report.company_name}`
          : "Rapport d'Audit — Volka Studio",
      },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Rapport d'audit de croissance Volka Studio — accès privé.",
      },
    ],
  }),
  component: AuditReportPage,
} as any));

const TRACK_LABELS: Record<string, string> = {
  website: "Site Web — Conversion & Perception",
  marketing: "Marketing & Visibilité — Acquisition & Perception",
  sales: "Ventes & Suivi — Sales & Automation",
  general: "Diagnostic Transversal",
};

const OFFER_LABELS: Record<string, string> = {
  "offer-1": "Offre 1 — Lancement & Présence",
  "offer-2": "Offre 2 — Croissance & Acquisition",
  "offer-3": "Offre 3 — Systèmes & Automatisation",
};

function scoreLabel(score: number): string {
  if (score >= 4.5) return "Excellent — à maintenir";
  if (score >= 3.5) return "Solide, optimisation recommandée";
  if (score >= 2.5) return "Passable, améliorations prioritaires";
  if (score >= 1.5) return "Insuffisant, action requise";
  return "Critique — blocage identifié";
}

function scoreColor(score: number): string {
  if (score >= 4) return "bg-mint";
  if (score >= 3) return "bg-ochre";
  if (score >= 2) return "bg-terracotta/80";
  return "bg-terracotta";
}

function ImpactBadge({ impact, effort }: { impact: number; effort: number }) {
  const impactLabel = impact >= 4 ? "Impact fort" : impact >= 3 ? "Impact moyen" : "Impact faible";
  const effortLabel = effort <= 2 ? "Effort faible" : effort <= 3 ? "Effort modéré" : "Effort élevé";
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        impact >= 4 ? "bg-terracotta/20 text-terracotta border border-terracotta/40" :
        impact >= 3 ? "bg-ochre/20 text-ochre border border-ochre/40" :
        "bg-pine/20 text-forest-black/60 border border-pine/30"
      }`}>
        {impactLabel}
      </span>
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-pine/10 text-forest-black/60 border border-pine/20">
        {effortLabel}
      </span>
    </div>
  );
}

function ScoreBar({ item }: { item: AuditScorecardItem }) {
  const pct = Math.min(100, (item.score / 5) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-forest-black capitalize">{item.pillar}</span>
        <span className="font-mono font-semibold text-forest-black/80">
          {item.score.toFixed(1)}/5
        </span>
      </div>
      <div className="h-2.5 bg-pine/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreColor(item.score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-forest-black/60">{item.label || scoreLabel(item.score)}</p>
    </div>
  );
}

function FindingCard({ finding, index, type }: { finding: AuditFinding; index: number; type: "finding" | "quick_win" }) {
  const isQW = type === "quick_win";
  return (
    <div className={`p-5 sm:p-6 rounded-lg border ${
      isQW
        ? "bg-mint/5 border-mint/30 border-l-4 border-l-mint"
        : "bg-warm-ivory border-pine/15 border-l-4 border-l-terracotta"
    } space-y-3 print:break-inside-avoid`}>
      <div className="flex items-start gap-3">
        <span className={`shrink-0 size-7 rounded-full flex items-center justify-center text-xs font-bold ${
          isQW ? "bg-mint text-forest-black" : "bg-terracotta text-paper"
        }`}>
          {index + 1}
        </span>
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-forest-black text-sm sm:text-base leading-snug">
            {finding.title}
          </h4>
          <ImpactBadge impact={finding.impact} effort={finding.effort} />
        </div>
      </div>

      {finding.why && (
        <div className="ml-10 space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-forest-black/50">
            Pourquoi c'est important
          </p>
          <p className="text-sm text-forest-black/80 leading-relaxed">{finding.why}</p>
        </div>
      )}

      {finding.fix && (
        <div className="ml-10 p-3 rounded bg-forest-black/5 border border-pine/10 space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-forest-black/50">
            Comment corriger
          </p>
          <p className="text-sm text-forest-black leading-relaxed">{finding.fix}</p>
        </div>
      )}
    </div>
  );
}

function AuditReportPage() {
  const loaderData = Route.useLoaderData() as
    | { success: false; error: string }
    | { success: true; report: AuditReportData };

  // Error state
  if (!loaderData.success) {
    return (
      <div className="min-h-screen bg-soft-paper flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-warm-ivory border border-terracotta/30 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <AlertTriangle className="size-12 text-terracotta mx-auto" />
          <h1 className="font-display text-2xl text-forest-black font-medium">
            Rapport inaccessible
          </h1>
          <p className="text-sm text-forest-black/70 leading-relaxed">
            {loaderData.error}
          </p>
          <Button asChild className="bg-pine hover:bg-pine/90 text-paper">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { report } = loaderData;
  const diagDate = new Date(report.diagnosis_date).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  const globalScore =
    report.scorecard.length > 0
      ? report.scorecard.reduce((s, i) => s + i.score, 0) / report.scorecard.length
      : null;

  const offerLabel = report.recommendation?.offer
    ? OFFER_LABELS[report.recommendation.offer] ?? report.recommendation.offer
    : null;

  return (
    <div className="min-h-screen bg-soft-paper font-sans text-forest-black">
      {/* Print-optimized report header */}
      <header className="bg-forest-black text-paper py-8 px-6 sm:px-12 print:py-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-display text-2xl tracking-tight font-medium">VOLKA</span>
            <span className="block text-xs uppercase tracking-widest text-mint mt-1">
              Studio de croissance
            </span>
          </div>
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="border-paper/20 hover:bg-paper/10 text-paper text-xs print:hidden"
          >
            <Printer className="mr-1.5 size-3.5" />
            Imprimer / Télécharger PDF
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-12 space-y-12 print:py-8">

        {/* REPORT HEADER */}
        <section className="space-y-4 pb-8 border-b border-pine/15 print:break-after-avoid">
          <span className="text-xs uppercase tracking-widest text-ochre font-semibold">
            Diagnostic de croissance — {TRACK_LABELS[report.track] ?? report.track}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-forest-black font-medium leading-tight">
            {report.company_name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-forest-black/60">
            <span>Rapport établi le {diagDate}</span>
            {globalScore !== null && (
              <span className="font-mono font-semibold px-2.5 py-1 rounded-full bg-mint/20 text-forest-black border border-mint/40">
                Score global : {globalScore.toFixed(1)}/5
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {report.view_count} consultation{report.view_count > 1 ? "s" : ""}
            </span>
          </div>
          <div className="p-3 rounded-md bg-ochre/10 border border-ochre/30 text-xs text-forest-black/70 font-medium">
            ⚠️ Exemple indicatif — basé sur des informations publiques et vos déclarations à un instant T. Aucun résultat commercial n'est garanti.
          </div>
        </section>

        {/* SCORECARD */}
        {report.scorecard.length > 0 && (
          <section className="space-y-6 print:break-inside-avoid">
            <div>
              <h2 className="font-display text-2xl text-forest-black font-medium">Scorecard de maturité</h2>
              <p className="text-sm text-forest-black/60 mt-1">Évaluation sur 5 par pilier analysé.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.scorecard.map((item, idx) => (
                <div key={idx} className="p-4 bg-warm-ivory border border-pine/10 rounded-lg">
                  <ScoreBar item={item} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TOP 3 FINDINGS */}
        {report.findings.length > 0 && (
          <section className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-terracotta font-semibold">
                Constats majeurs
              </span>
              <h2 className="font-display text-2xl text-forest-black font-medium mt-1">
                Les {Math.min(report.findings.length, 3)} points de friction prioritaires
              </h2>
            </div>
            <div className="space-y-4">
              {report.findings.slice(0, 3).map((f, idx) => (
                <FindingCard key={idx} finding={f} index={idx} type="finding" />
              ))}
            </div>
          </section>
        )}

        {/* TOP 3 QUICK WINS */}
        {report.quick_wins.length > 0 && (
          <section className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-mint font-semibold">
                Victoires rapides
              </span>
              <h2 className="font-display text-2xl text-forest-black font-medium mt-1">
                {Math.min(report.quick_wins.length, 3)} actions à faible effort, fort impact
              </h2>
              <p className="text-sm text-forest-black/60 mt-1">
                Ces victoires rapides peuvent être appliquées sans nous — en autonomie totale.
              </p>
            </div>
            <div className="space-y-4">
              {report.quick_wins.slice(0, 3).map((qw, idx) => (
                <FindingCard key={idx} finding={qw} index={idx} type="quick_win" />
              ))}
            </div>
          </section>
        )}

        {/* RECOMMENDATION */}
        {report.recommendation?.offer && (
          <section className="bg-forest-black text-paper rounded-xl p-7 sm:p-8 space-y-5 shadow-lg print:break-inside-avoid">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-ochre/20 text-ochre">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-ochre font-semibold block">
                  Recommandation Volka
                </span>
                <h3 className="font-display text-xl text-paper mt-0.5">
                  Ce que nous ferions en premier
                </h3>
              </div>
            </div>

            {offerLabel && (
              <div className="px-3 py-1.5 rounded bg-ochre/20 text-ochre text-xs font-semibold inline-block">
                {offerLabel}
              </div>
            )}

            {report.recommendation.rationale && (
              <p className="text-sm text-mint/90 leading-relaxed">
                {report.recommendation.rationale}
              </p>
            )}

            <div className="pt-2 print:hidden">
              <Button
                asChild
                className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold"
              >
                <Link
                  to="/start"
                  search={{
                    offer: report.recommendation.offer,
                    source: "audit-rapport",
                  }}
                >
                  Parler de ce rapport avec Volka
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <p className="text-xs text-mint/60 mt-2">
                Apportez ce rapport à notre entretien — il servira de point de départ à notre accompagnement.
              </p>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="pt-6 border-t border-pine/15 text-xs text-forest-black/50 space-y-2 print:pt-4">
          <div className="flex items-start gap-2">
            <ShieldCheck className="size-4 shrink-0 mt-0.5 text-forest-black/30" />
            <p>
              Ce rapport est strictement confidentiel et destiné uniquement à {report.contact_name} pour {report.company_name}.
              Il est basé sur des informations publiques et des déclarations fournies à la date du diagnostic.
              Aucun compte privé, analytics ou outil interne n'a été consulté.
              Lien expirant le {new Date(report.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
            </p>
          </div>
          <p className="text-center pt-2">
            © {new Date().getFullYear()} Volka Studio · <a href="https://volkastudio.com" className="underline">volkastudio.com</a>
          </p>
        </footer>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          header { background: #0E1C12 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          .print\\:break-after-avoid { break-after: avoid; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
