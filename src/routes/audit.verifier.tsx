import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Home,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { verifyAuditTokenAction } from "@/lib/audit/audit.functions";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/audit/verifier")({
  validateSearch: searchSchema,
  loader: async ({ location }) => {
    const token = (location.search as { token?: string }).token;
    if (!token) {
      return {
        success: false,
        error: "Aucun jeton de vérification fourni.",
      };
    }

    try {
      return await verifyAuditTokenAction({ data: { token } });
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erreur de validation du jeton.",
      };
    }
  },
  head: () => ({
    meta: [
      { title: "Validation de votre audit — Volka Studio" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: AuditVerifierPage,
});

function AuditVerifierPage() {
  const result = Route.useLoaderData();

  const isQueued = result.success && result.status === "queued";
  const isWaitlist = result.success && result.status === "waitlist";

  return (
    <div className="min-h-screen bg-forest-black text-paper flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center pt-32 pb-24 px-6 sm:px-12">
        <div className="max-w-xl w-full bg-pine/30 border border-pine/70 rounded-xl p-8 sm:p-10 space-y-8 text-center shadow-2xl relative">
          {/* SUCCESS: QUEUED */}
          {isQueued && (
            <>
              <div className="size-16 rounded-full bg-mint/15 border border-mint/40 text-mint flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="size-8" />
              </div>

              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest text-mint font-semibold">
                  Adresse email confirmée
                </span>
                <h1 className="font-display text-3xl sm:text-4xl text-paper font-light">
                  Votre audit est validé et planifié
                </h1>
                <p className="text-sm sm:text-base text-mint/90 leading-relaxed">
                  L'audit pour{" "}
                  <strong className="text-paper">{result.company}</strong> est officiellement inscrit dans notre calendrier de diagnostic.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-forest-black/80 border border-mint/30 text-left space-y-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-mint font-semibold">
                  <Clock className="size-4" />
                  <span>Délai de réalisation : 5 jours ouvrés</span>
                </div>
                <p className="text-paper/80 leading-relaxed">
                  Notre équipe va analyser vos supports, exécuter les contrôles techniques et rédiger vos 3 constats stratégiques. Vous recevrez un lien d'accès privé par email.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  asChild
                  className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-8"
                >
                  <Link to="/">
                    Retourner sur le site
                    <Home className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* SUCCESS: WAITLIST */}
          {isWaitlist && (
            <>
              <div className="size-16 rounded-full bg-ochre/15 border border-ochre/40 text-ochre flex items-center justify-center mx-auto shadow-inner">
                <Clock className="size-8" />
              </div>

              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest text-ochre font-semibold">
                  Capacité atteinte pour ce mois
                </span>
                <h1 className="font-display text-3xl sm:text-4xl text-paper font-light">
                  Inscrit sur liste d'attente prioritaire
                </h1>
                <p className="text-sm sm:text-base text-mint/90 leading-relaxed">
                  La limite mensuelle de 10 audits a été atteinte. Votre demande pour{" "}
                  <strong className="text-paper">{result.company}</strong> a été enregistrée en tête de file pour le cycle suivant.
                </p>
              </div>

              <div className="p-5 rounded-lg bg-forest-black/80 border border-ochre/30 text-left space-y-2 text-xs sm:text-sm">
                <span className="text-ochre font-semibold block">
                  Traitement prioritaire garanti
                </span>
                <p className="text-paper/80 leading-relaxed">
                  Vous n'avez aucune action supplémentaire à effectuer. Dès l'ouverture des nouveaux créneaux, votre dossier sera traité en priorité absolue.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  asChild
                  className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-8"
                >
                  <Link to="/">
                    Retourner sur le site
                    <Home className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* ERROR: INVALID TOKEN OR EXPIRED */}
          {!result.success && (
            <>
              <div className="size-16 rounded-full bg-terracotta/15 border border-terracotta/40 text-terracotta flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="size-8" />
              </div>

              <div className="space-y-3">
                <span className="text-xs uppercase tracking-widest text-terracotta font-semibold">
                  Lien non valide
                </span>
                <h1 className="font-display text-3xl text-paper font-light">
                  Impossible de confirmer cet audit
                </h1>
                <p className="text-sm text-paper/80 leading-relaxed max-w-md mx-auto">
                  {result.error || "Ce lien a déjà été utilisé ou a expiré (validité 48 heures)."}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  asChild
                  className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold text-sm w-full sm:w-auto"
                >
                  <Link to="/audit/demande">
                    Faire une nouvelle demande
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-pine hover:bg-pine/40 text-paper text-sm w-full sm:w-auto"
                >
                  <Link to="/">
                    Accueil
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
