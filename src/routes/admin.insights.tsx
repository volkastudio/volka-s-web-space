import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  ArrowRight,
  Download,
  Shield,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  getAnalyticsOverview,
  getAnalyticsContent,
  getAnalyticsFunnel,
  runAnalyticsMaintenanceAction,
} from "@/lib/analytics/analytics.functions";
import type {
  AnalyticsFunnelData,
  AnalyticsOverviewData,
  ContentPerformanceRow,
} from "@/lib/analytics/types";
import {
  isTrackingOptedOut,
  setTrackingOptOut,
} from "@/lib/analytics/tracker";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/insights")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Statistiques & Mesure d'audience — Volka Admin" },
    ],
  }),
  component: AdminInsightsPage,
});

type TabType = "traffic" | "content" | "funnel";

function AdminInsightsPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>("traffic");
  const [periodDays, setPeriodDays] = React.useState<number>(30);
  const [optedOut, setOptedOut] = React.useState<boolean>(false);

  // Data states
  const [loading, setLoading] = React.useState<boolean>(true);
  const [maintenanceRunning, setMaintenanceRunning] = React.useState<boolean>(false);
  const [maintenanceResult, setMaintenanceResult] = React.useState<string | null>(null);

  const [overview, setOverview] = React.useState<AnalyticsOverviewData | null>(null);
  const [contentRows, setContentRows] = React.useState<ContentPerformanceRow[]>([]);
  const [funnelData, setFunnelData] = React.useState<AnalyticsFunnelData | null>(null);
  const [contentFilter, setContentFilter] = React.useState<"all" | "post" | "case">("all");

  React.useEffect(() => {
    setOptedOut(isTrackingOptedOut());
  }, []);

  const handleToggleOptOut = () => {
    const next = !optedOut;
    setTrackingOptOut(next);
    setOptedOut(next);
  };

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [over, cont, fun] = await Promise.all([
        getAnalyticsOverview({ data: { days: periodDays } }),
        getAnalyticsContent({ data: { days: periodDays, entityType: contentFilter } }),
        getAnalyticsFunnel({ data: { days: periodDays } }),
      ]);
      setOverview(over);
      setContentRows(cont);
      setFunnelData(fun);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [periodDays, contentFilter]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunMaintenance = async () => {
    setMaintenanceRunning(true);
    setMaintenanceResult(null);
    try {
      const res = await runAnalyticsMaintenanceAction();
      if (res.ok) {
        setMaintenanceResult(
          `Consolidation réussie (${res.rollupTargetDate}). ${res.deletedRawEvents} anciens événements nettoyés.`,
        );
        loadData();
      } else {
        setMaintenanceResult(`Erreur: ${res.error || "Échec de consolidation"}`);
      }
    } catch (err: unknown) {
      setMaintenanceResult(`Erreur: ${err instanceof Error ? err.message : "Échec"}`);
    } finally {
      setMaintenanceRunning(false);
    }
  };

  // CSV Exporters
  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTrafficCsv = () => {
    if (!overview) return;
    const lines = ["Date,Visites (Pageviews),Visiteurs quotidiens,Lectures complètes"];
    overview.trend.forEach((t) => {
      lines.push(`${t.date},${t.views},${t.visitors},${t.reads}`);
    });
    downloadCsv(`volka-trafic-${periodDays}j.csv`, lines.join("\n"));
  };

  const handleExportContentCsv = () => {
    const lines = [
      "Type,Slug,Titre,Vues,Visiteurs,Lectures complètes,Taux de lecture (%),Temps moyen (s),Clics CTA,Source principale",
    ];
    contentRows.forEach((r) => {
      const cleanTitle = `"${r.title.replace(/"/g, '""')}"`;
      lines.push(
        `${r.entityType},${r.entityId},${cleanTitle},${r.views},${r.visitors},${r.reads},${r.readRate},${r.avgReadingTimeSeconds},${r.ctaClicks},${r.topSource}`,
      );
    });
    downloadCsv(`volka-contenu-${periodDays}j.csv`, lines.join("\n"));
  };

  const handleExportFunnelCsv = () => {
    if (!funnelData) return;
    const lines = ["Étape,Volume,Conversion globale (%),Conversion étape (%)"];
    funnelData.projectBriefFunnel.forEach((s) => {
      lines.push(
        `"${s.stepLabel}",${s.count},${s.conversionFromFirstPercent}%,${s.conversionFromPreviousPercent}%`,
      );
    });
    downloadCsv(`volka-entonnoir-${periodDays}j.csv`, lines.join("\n"));
  };

  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Mesure Première Partie · Sans Cookies (D16, D18)
            </span>
            <span className="rounded-full bg-forest px-2.5 py-0.5 text-[10px] font-medium text-mint border border-mint/20">
              RGPD & Vie Privée Conforme
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-light md:text-5xl">
            Statistiques & Insights
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Visites réelles, lectures qualifiées d'articles et conversion de prospects sans traceur tiers ni bandeau intrusif.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="inline-flex rounded-sm border border-border bg-card p-1 text-xs">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPeriodDays(d)}
                className={`rounded-[2px] px-3 py-1.5 font-medium transition-colors ${
                  periodDays === d
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d} jours
              </button>
            ))}
          </div>

          {/* Maintenance button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunMaintenance}
            disabled={maintenanceRunning}
            className="text-xs gap-1.5"
            title="Consolide les agrégats d'hier et purge les événements bruts > 30 jours"
          >
            <RefreshCw className={`size-3.5 ${maintenanceRunning ? "animate-spin text-gold" : ""}`} />
            <span>Consolider</span>
          </Button>

          {/* Opt-out toggle */}
          <button
            type="button"
            onClick={handleToggleOptOut}
            className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-medium transition-all ${
              optedOut
                ? "border-gold/50 bg-gold/10 text-forest-black"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30"
            }`}
          >
            <Shield className={`size-3.5 ${optedOut ? "text-gold" : "text-muted-foreground"}`} />
            <span>{optedOut ? "Visites exclues" : "Exclure mes visites"}</span>
          </button>
        </div>
      </div>

      {/* Maintenance Notification */}
      {maintenanceResult && (
        <div className="flex items-center gap-3 rounded-sm border border-mint/40 bg-mint/10 p-4 text-xs text-forest">
          <CheckCircle2 className="size-4 shrink-0 text-pine" />
          <span>{maintenanceResult}</span>
        </div>
      )}

      {/* Accuracy Warning / Disclaimer */}
      <div className="flex items-start gap-3 rounded-sm border border-border/70 bg-card/60 p-4 text-xs text-muted-foreground">
        <HelpCircle className="size-4 shrink-0 text-gold mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-medium">Borne inférieure et approximation :</strong> Les bloqueurs de scripts et navigateurs économiseurs de données masquent une partie des requêtes, le trafic WhatsApp arrive souvent sans référent direct, et l'empreinte anonyme quotidienne (D18) ne relie pas une même personne entre deux jours distincts. Ces indicateurs mesurent des tendances réelles et fiables plutôt que des unités individuelles.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: "traffic", label: "Trafic & Audience", icon: BarChart3 },
            { id: "content", label: "Contenu & Lectures (D17)", icon: BookOpen },
            { id: "funnel", label: "Entonnoir & Prospects", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs uppercase tracking-[0.14em] font-medium transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <Icon className={`size-4 ${active ? "text-gold" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─── TAB 1: TRAFIC ─── */}
      {activeTab === "traffic" && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Pageviews */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <span>Visites (Pages Vues)</span>
                <Eye className="size-4 text-forest" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl font-medium tabular-nums text-forest-black">
                  {loading ? "…" : overview?.current.views ?? 0}
                </span>
                {overview && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      overview.growth.viewsPercent >= 0 ? "text-pine" : "text-terracotta"
                    }`}
                  >
                    {overview.growth.viewsPercent >= 0 ? (
                      <TrendingUp className="mr-0.5 size-3" />
                    ) : (
                      <TrendingDown className="mr-0.5 size-3" />
                    )}
                    {overview.growth.viewsPercent > 0 ? "+" : ""}
                    {overview.growth.viewsPercent}%
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                vs {overview?.previous.views ?? 0} sur la période précédente
              </p>
            </div>

            {/* KPI 2: Daily Visitors */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <span>Visiteurs Quotidiens</span>
                <Users className="size-4 text-gold" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl font-medium tabular-nums text-forest-black">
                  {loading ? "…" : overview?.current.visitors ?? 0}
                </span>
                {overview && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      overview.growth.visitorsPercent >= 0 ? "text-pine" : "text-terracotta"
                    }`}
                  >
                    {overview.growth.visitorsPercent >= 0 ? (
                      <TrendingUp className="mr-0.5 size-3" />
                    ) : (
                      <TrendingDown className="mr-0.5 size-3" />
                    )}
                    {overview.growth.visitorsPercent > 0 ? "+" : ""}
                    {overview.growth.visitorsPercent}%
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Empreinte anonyme quotidienne sha256 (D18)
              </p>
            </div>

            {/* KPI 3: Reads & Read Rate */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <span>Lectures Complètes</span>
                <BookOpen className="size-4 text-ochre" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl font-medium tabular-nums text-forest-black">
                  {loading ? "…" : overview?.current.reads ?? 0}
                </span>
                <span className="text-xs font-semibold text-ochre">
                  ({overview?.current.readRate ?? 0}% taux)
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Article scrollé &gt;70% + temps qualifié (D17)
              </p>
            </div>

            {/* KPI 4: Pages / Visit */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <span>Pages / Visite</span>
                <Sparkles className="size-4 text-forest" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl font-medium tabular-nums text-forest-black">
                  {loading ? "…" : overview?.current.pagesPerVisit ?? 1}
                </span>
                <span className="text-xs text-muted-foreground">pages</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Profondeur de navigation moyenne
              </p>
            </div>
          </div>

          {/* Daily Trend Chart (Colorblind-Safe) */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-xl font-medium">Évolution Quotidienne</h3>
                <p className="text-xs text-muted-foreground">
                  Visites totales et lectures qualifiées jour par jour
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-[2px] bg-pine" />
                  <span>Visites</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-[2px] bg-ochre" />
                  <span>Lectures complètes</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTrafficCsv}
                  className="gap-1.5 text-xs ml-4"
                >
                  <Download className="size-3.5" />
                  <span>Export CSV</span>
                </Button>
              </div>
            </div>

            {/* Trend Chart Bars */}
            <div className="mt-8">
              {overview && overview.trend.length > 0 ? (
                <div className="flex h-52 items-end gap-1.5 sm:gap-2 pt-6">
                  {(() => {
                    const maxVal = Math.max(
                      10,
                      ...overview.trend.map((t) => Math.max(t.views, t.reads)),
                    );
                    return overview.trend.map((point) => {
                      const viewHeight = Math.max(4, Math.round((point.views / maxVal) * 100));
                      const readHeight = Math.max(2, Math.round((point.reads / maxVal) * 100));
                      const shortDate = point.date.slice(5);

                      return (
                        <div
                          key={point.date}
                          className="group relative flex flex-1 flex-col items-center justify-end h-full"
                        >
                          {/* Tooltip on hover */}
                          <div className="pointer-events-none absolute bottom-full mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-forest-black px-2 py-1 text-[11px] text-paper shadow-md group-hover:block z-10 left-1/2">
                            <p className="font-semibold">{point.date}</p>
                            <p className="text-mint">{point.views} vues</p>
                            <p className="text-gold">{point.reads} lectures</p>
                          </div>

                          <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                            {/* View bar: Deep Pine */}
                            <div
                              style={{ height: `${viewHeight}%` }}
                              className="w-full max-w-[14px] rounded-t-[2px] bg-pine transition-all group-hover:opacity-80"
                            />
                            {/* Read bar: Warm Ochre */}
                            <div
                              style={{ height: `${readHeight}%` }}
                              className="w-full max-w-[14px] rounded-t-[2px] bg-ochre transition-all group-hover:opacity-80"
                            />
                          </div>

                          <span className="mt-2 text-[10px] text-muted-foreground tabular-nums truncate max-w-full">
                            {shortDate}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                  Aucune donnée disponible pour cette période.
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Grid: Top Pages & Top Sources */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Top Pages */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
              <h3 className="font-display text-xl font-medium border-b border-border pb-3">
                Pages les plus consultées
              </h3>
              <div className="mt-4 divide-y divide-border/60">
                {overview && overview.topPages.length > 0 ? (
                  overview.topPages.map((page) => (
                    <div
                      key={page.path}
                      className="flex items-center justify-between py-3 hover:bg-ivory/50 px-2 rounded-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate pr-4">
                        <span className="text-xs font-mono text-forest-black truncate">
                          {page.path}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold tabular-nums text-forest-black">
                          {page.views}
                        </span>
                        <span className="text-[11px] text-muted-foreground w-10 text-right tabular-nums">
                          {page.percent}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Aucune page consultée enregistrée.
                  </p>
                )}
              </div>
            </div>

            {/* Top Sources & Referrers */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
              <h3 className="font-display text-xl font-medium border-b border-border pb-3">
                Canaux d'acquisition & Référents
              </h3>
              <div className="mt-4 divide-y divide-border/60">
                {overview && overview.topSources.length > 0 ? (
                  overview.topSources.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-3 hover:bg-ivory/50 px-2 rounded-xs transition-colors"
                    >
                      <div>
                        <p className="text-xs font-medium text-forest-black capitalize">
                          {s.source}
                        </p>
                        {s.referrerHost && (
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {s.referrerHost}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-semibold tabular-nums text-forest-black">
                            {s.views} vues
                          </p>
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            {s.visitors} visiteurs
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground w-10 text-right tabular-nums">
                          {s.percent}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Aucune source identifiée.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tertiary Breakdown: Countries, Devices, Languages */}
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Countries */}
            <div className="rounded-sm border border-border bg-card p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Pays Détectés
              </span>
              <div className="mt-4 space-y-2">
                {overview?.countries.map((c) => (
                  <div key={c.country} className="flex justify-between text-xs">
                    <span className="font-medium text-forest-black">{c.country}</span>
                    <span className="tabular-nums text-muted-foreground">{c.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Devices */}
            <div className="rounded-sm border border-border bg-card p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Appareils
              </span>
              <div className="mt-4 space-y-2">
                {overview?.devices.map((d) => (
                  <div key={d.deviceClass} className="flex justify-between text-xs">
                    <span className="font-medium text-forest-black capitalize">
                      {d.deviceClass === "mobile" ? "Mobile" : d.deviceClass === "tablet" ? "Tablette" : "Ordinateur"}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="rounded-sm border border-border bg-card p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Langues (FR / EN)
              </span>
              <div className="mt-4 space-y-2">
                {overview?.languages.map((l) => (
                  <div key={l.locale} className="flex justify-between text-xs">
                    <span className="font-medium text-forest-black">{l.locale}</span>
                    <span className="tabular-nums text-muted-foreground">{l.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CONTENU & LECTURES (D17) ─── */}
      {activeTab === "content" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Filtrer :
              </span>
              {(["all", "post", "case"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setContentFilter(filter)}
                  className={`rounded-xs px-2.5 py-1 text-xs font-medium transition-colors ${
                    contentFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter === "all" ? "Tous" : filter === "post" ? "Journal" : "Études de cas"}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportContentCsv}
              className="gap-1.5 text-xs"
            >
              <Download className="size-3.5" />
              <span>Exporter CSV Contenu</span>
            </Button>
          </div>

          {/* Reading Rate Visualizer Table */}
          <div className="rounded-sm border border-border bg-card shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-ivory/60 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-semibold">Titre / Sujet</th>
                  <th className="py-3 px-4 text-right font-semibold">Vues</th>
                  <th className="py-3 px-4 text-right font-semibold">Lecteurs</th>
                  <th className="py-3 px-4 font-semibold min-w-[200px]">
                    Taux de Lecture Complète (D17)
                  </th>
                  <th className="py-3 px-4 text-right font-semibold">Temps Moyen</th>
                  <th className="py-3 px-4 text-right font-semibold">Clics CTA</th>
                  <th className="py-3 px-4 text-right font-semibold">Source Top</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {contentRows.length > 0 ? (
                  contentRows.map((row) => (
                    <tr
                      key={`${row.entityType}-${row.entityId}`}
                      className="hover:bg-ivory/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-forest-black max-w-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-xs px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              row.entityType === "post"
                                ? "bg-mint/40 text-pine"
                                : "bg-gold/20 text-ochre"
                            }`}
                          >
                            {row.entityType === "post" ? "Journal" : "Cas"}
                          </span>
                          <span className="truncate">{row.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-forest-black font-semibold">
                        {row.views}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-muted-foreground">
                        {row.visitors}
                      </td>

                      {/* Reading Rate Visualizer: Horizontal Stacked Bar */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-ochre tabular-nums">
                              {row.reads} lectures
                            </span>
                            <span className="font-semibold tabular-nums text-forest-black">
                              {row.readRate}%
                            </span>
                          </div>
                          {/* Stacked bar: Mint background with Ochre fill */}
                          <div className="h-2 w-full rounded-full bg-mint/30 overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, row.readRate)}%` }}
                              className="h-full rounded-full bg-ochre transition-all duration-500"
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right tabular-nums text-forest-black">
                        {Math.floor(row.avgReadingTimeSeconds / 60)}m{" "}
                        {row.avgReadingTimeSeconds % 60}s
                      </td>

                      <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-pine">
                        {row.ctaClicks}
                      </td>

                      <td className="py-3.5 px-4 text-right text-muted-foreground capitalize">
                        {row.topSource}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Aucune donnée de lecture enregistrée pour la période sélectionnée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: ENTONNOIR & PROSPECTS (Phase 12b) ─── */}
      {activeTab === "funnel" && (
        <div className="space-y-10">
          {/* Funnel 1: Project Brief (/start) */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-xl font-medium">
                  Entonnoir de Conversion — Brief Projet (/start)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Parcours visiteur de la découverte jusqu'à l'envoi du brief qualifié
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFunnelCsv}
                className="gap-1.5 text-xs"
              >
                <Download className="size-3.5" />
                <span>Export Funnel</span>
              </Button>
            </div>

            {/* Visual Funnel Steps */}
            <div className="mt-8 space-y-4">
              {funnelData?.projectBriefFunnel.map((step, idx) => (
                <div key={step.stepKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-mint">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-forest-black">{step.stepLabel}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums text-forest-black">
                        {step.count}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-right">
                        {step.conversionFromFirstPercent}%
                      </span>

                      {/* Drop-off Callout in Terracotta pill */}
                      {step.dropOffPercent > 0 && (
                        <span className="rounded-full bg-terracotta/15 px-2 py-0.5 text-[10px] font-semibold text-terracotta border border-terracotta/30">
                          -{step.dropOffPercent}% abandon
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Funnel Bar */}
                  <div className="h-3 w-full rounded-sm bg-muted/40 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(2, step.conversionFromFirstPercent)}%` }}
                      className={`h-full rounded-sm transition-all duration-500 ${
                        idx === 0
                          ? "bg-pine"
                          : idx === funnelData.projectBriefFunnel.length - 1
                          ? "bg-gold"
                          : "bg-pine/80"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Funnel 2: Free Audit (/audit) */}
          <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
            <h3 className="font-display text-xl font-medium border-b border-border pb-3">
              Entonnoir de Conversion — Audit Gratuit (/audit)
            </h3>
            <div className="mt-6 space-y-4">
              {funnelData?.auditFunnel.map((step, idx) => (
                <div key={step.stepKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-mint text-[10px] font-bold text-forest-black">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-forest-black">{step.stepLabel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums text-forest-black">
                        {step.count}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-right">
                        {step.conversionFromFirstPercent}%
                      </span>
                      {step.dropOffPercent > 0 && (
                        <span className="rounded-full bg-terracotta/15 px-2 py-0.5 text-[10px] font-semibold text-terracotta border border-terracotta/30">
                          -{step.dropOffPercent}% abandon
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-sm bg-muted/40 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(2, step.conversionFromFirstPercent)}%` }}
                      className="h-full rounded-sm bg-mint transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline & Inquiry Distribution */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Prospects par Offre */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
              <h4 className="font-display text-lg font-medium border-b border-border pb-3">
                Prospects Reçus par Offre
              </h4>
              <div className="mt-4 space-y-3">
                {funnelData?.leadsByOffer.map((item) => (
                  <div key={item.offer} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-forest-black">{item.offer}</span>
                      <span className="tabular-nums font-semibold text-forest-black">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="h-full rounded-full bg-pine"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prospects par Canal */}
            <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
              <h4 className="font-display text-lg font-medium border-b border-border pb-3">
                Prospects Reçus par Canal Réseau
              </h4>
              <div className="mt-4 space-y-3">
                {funnelData?.leadsBySource.map((item) => (
                  <div key={item.source} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-forest-black">{item.source}</span>
                      <span className="tabular-nums font-semibold text-forest-black">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="h-full rounded-full bg-ochre"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

