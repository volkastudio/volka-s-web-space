import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import type { Transition } from "motion/react";
import {
  Paintbrush,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAdminSiteSettings,
  updateAdminSiteSettings,
} from "@/lib/admin/settings.functions";
import {
  PRESET_LABELS,
  type TransitionPreset,
} from "@/components/page-transition";

export const Route = createFileRoute("/admin/appearance")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Apparence — Volka Studio Admin" },
    ],
  }),
  loader: async () => {
    try {
      const data = await getAdminSiteSettings({ data: { key: "appearance" } });
      return { settings: data };
    } catch {
      return { settings: null };
    }
  },
  component: AdminAppearancePage,
});

const ALL_PRESETS: TransitionPreset[] = [
  "rise",
  "slide",
  "fade",
  "clip",
  "scale",
  "blur",
];

// Preview cards: small animated divs that demonstrate each preset
function PresetPreview({ preset }: { preset: TransitionPreset }) {
  const [playing, setPlaying] = React.useState(false);
  const [key, setKey] = React.useState(0);

  const play = () => {
    setPlaying(true);
    setKey((k) => k + 1);
    setTimeout(() => setPlaying(false), 700);
  };

  const getMotionProps = (p: TransitionPreset) => {
    type BezierTuple = [number, number, number, number];
    const smooth: BezierTuple = [0.22, 1, 0.36, 1];
    const snappy: BezierTuple = [0.76, 0, 0.24, 1];

    switch (p) {
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.4 } as Transition,
        };
      case "slide":
        return {
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.4, ease: smooth } as Transition,
        };
      case "rise":
        return {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: smooth } as Transition,
        };
      case "clip":
        return {
          initial: { clipPath: "inset(0 100% 0 0)" as string },
          animate: { clipPath: "inset(0 0% 0 0)" as string },
          transition: { duration: 0.5, ease: snappy } as Transition,
        };
      case "scale":
        return {
          initial: { opacity: 0, scale: 0.88 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.35, ease: smooth } as Transition,
        };
      case "blur":
        return {
          initial: { opacity: 0, filter: "blur(8px)" },
          animate: { opacity: 1, filter: "blur(0px)" },
          transition: { duration: 0.4, ease: smooth } as Transition,
        };
    }
  };

  return (
    <div className="relative h-14 w-full overflow-hidden rounded border border-border/60 bg-background/50 cursor-pointer" onClick={play}>
      <AnimatePresence mode="wait">
        {playing && (
          <motion.div
            key={key}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-gold/20 to-primary/10"
            {...getMotionProps(preset)}
          >
            <div className="h-1 w-8 rounded-full bg-gold" />
          </motion.div>
        )}
        {!playing && (
          <div className="flex h-full items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <Zap className="size-3 text-gold/60" />
            <span>Cliquer pour aperçu</span>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminAppearancePage() {
  const loaderData = Route.useLoaderData();

  const raw = loaderData.settings as Record<string, unknown> | null;

  const [enabled, setEnabled] = React.useState<boolean>(
    raw?.["transitionEnabled"] !== false,
  );
  const [preset, setPreset] = React.useState<TransitionPreset>(
    (raw?.["transitionPreset"] as TransitionPreset | undefined) ?? "rise",
  );
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [dirty, setDirty] = React.useState(false);

  // Track changes
  const initialEnabled = raw?.["transitionEnabled"] !== false;
  const initialPreset =
    (raw?.["transitionPreset"] as TransitionPreset | undefined) ?? "rise";

  React.useEffect(() => {
    setDirty(enabled !== initialEnabled || preset !== initialPreset);
  }, [enabled, preset, initialEnabled, initialPreset]);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdminSiteSettings({
        data: {
          key: "appearance",
          value: {
            transitionEnabled: enabled,
            transitionPreset: preset,
          },
        },
      });
      setToast({
        type: "success",
        message: "Réglages d'apparence sauvegardés. La transition est active sur tout le site.",
      });
      setDirty(false);
    } catch (err: unknown) {
      setToast({
        type: "error",
        message:
          err instanceof Error
            ? `Erreur : ${err.message}`
            : "Impossible de sauvegarder les réglages.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`fixed inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 rounded border px-4 py-3 text-xs shadow-xl ${
              toast.type === "success"
                ? "border-forest/30 bg-primary text-primary-foreground"
                : "border-terracotta/30 bg-terracotta/10 text-terracotta"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="size-4 text-gold shrink-0" />
            ) : (
              <Sparkles className="size-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <Paintbrush className="size-4" />
            <span>Expérience Visiteur</span>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-light text-forest-black sm:text-4xl">
            Apparence du Site
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-xl">
            Configurez l'animation de transition entre les pages. Les modifications
            s'appliquent immédiatement à tous les visiteurs.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !dirty}
          variant="volka"
          className="w-full sm:w-auto min-h-[38px] active:scale-95 shrink-0 flex items-center justify-center gap-2 min-w-[140px]"
        >
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Sauvegarde…</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" />
              <span>{dirty ? "Sauvegarder" : "À jour"}</span>
            </>
          )}
        </Button>
      </div>

      {/* Section 1: Master toggle */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              {enabled ? (
                <Eye className="size-4 text-gold" />
              ) : (
                <EyeOff className="size-4 text-muted-foreground" />
              )}
              <h2 className="text-sm font-semibold text-foreground">
                Animation de transition de page
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-lg">
              Lorsqu'activée, chaque changement de page s'accompagne d'une
              animation fluide. L'animation respecte automatiquement la
              préférence système{" "}
              <code className="font-mono text-[10px] bg-secondary rounded px-1 py-0.5">
                prefers-reduced-motion
              </code>{" "}
              des utilisateurs qui souhaitent moins de mouvements.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEnabled((v) => !v);
            }}
            className="shrink-0 flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-pressed={enabled}
          >
            {enabled ? (
              <>
                <ToggleRight className="size-5 text-gold" />
                <span className="text-gold font-semibold">Activée</span>
              </>
            ) : (
              <>
                <ToggleLeft className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">Désactivée</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Section 2: Preset picker */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            key="presets"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Style d'animation
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Sélectionnez le style de transition. Cliquez sur la carte d'aperçu pour visualiser l'effet.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALL_PRESETS.map((p) => {
                  const isSelected = preset === p;
                  const labels = PRESET_LABELS[p];

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreset(p)}
                      className={`group relative rounded-lg border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                        isSelected
                          ? "border-gold bg-gold/5 shadow-sm"
                          : "border-border hover:border-border/80 hover:bg-secondary/40"
                      }`}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <span className="absolute top-2.5 right-2.5 flex size-4 items-center justify-center rounded-full bg-gold text-primary">
                          <CheckCircle2 className="size-3" />
                        </span>
                      )}

                      <div className="mb-3">
                        <span className="text-sm font-semibold text-foreground">
                          {labels.fr}
                        </span>
                        <span className="ml-2 text-[11px] text-muted-foreground font-mono">
                          {p}
                        </span>
                        {p === "rise" && (
                          <span className="ml-1.5 rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                            défaut
                          </span>
                        )}
                      </div>

                      <p className="mb-3 text-[11px] text-muted-foreground leading-relaxed">
                        {labels.description}
                      </p>

                      <PresetPreview preset={p} />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 3: Context & notes */}
      <div className="rounded border border-border/60 bg-secondary/30 p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-semibold text-foreground">Notes techniques</p>
        <ul className="list-disc list-inside space-y-1 leading-relaxed">
          <li>
            La transition est gérée côté client par <strong>Framer Motion</strong>{" "}
            via <code className="font-mono bg-secondary rounded px-1">AnimatePresence</code>. Elle n'affecte pas le SEO ni le temps de chargement initial.
          </li>
          <li>
            Si un visiteur a activé <em>Reduce Motion</em> dans ses préférences
            système, il ne verra qu'un fondu simple, quel que soit le style choisi.
          </li>
          <li>
            Les réglages sont chargés côté serveur au premier rendu (SSR), donc
            aucun flash ne se produit au chargement de la page.
          </li>
        </ul>
      </div>
    </div>
  );
}

