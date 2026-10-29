import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Mail, CheckCircle2, ArrowRight, ShieldCheck, Home } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/audit/confirmation")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Confirmation d'envoi — Volka Studio" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: AuditConfirmationPage,
});

function AuditConfirmationPage() {
  const search = Route.useSearch();
  const email = search.email || "votre adresse email";

  return (
    <div className="min-h-screen bg-forest-black text-paper flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center pt-10 pb-16 px-5 sm:pt-20 sm:pb-24 sm:px-12">
        <div className="max-w-xl w-full bg-pine/30 border border-mint/30 rounded-xl p-6 sm:p-10 space-y-8 text-center shadow-2xl relative">
          {/* Top Icon Badge */}
          <div className="size-16 rounded-full bg-mint/15 border border-mint/40 text-mint flex items-center justify-center mx-auto shadow-inner">
            <Mail className="size-8" />
          </div>

          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest text-ochre font-semibold">
              Dernière étape requise
            </span>
            <h1 className="font-display text-3xl sm:text-4xl text-paper font-light">
              Vérifiez votre boîte de réception
            </h1>
            <p className="text-sm sm:text-base text-mint/90 leading-relaxed max-w-md mx-auto">
              Un email de confirmation vient d'être envoyé à{" "}
              <strong className="text-paper underline decoration-mint/40 underline-offset-4">{email}</strong>.
            </p>
          </div>

          {/* Steps Callout */}
          <div className="p-5 rounded-lg bg-forest-black/80 border border-pine/60 text-left space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <span className="size-5 rounded-full bg-mint text-forest-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                1
              </span>
              <p className="text-paper/85">
                Ouvrez le message ayant pour objet :{" "}
                <em className="text-mint font-medium">« [Volka Studio] Confirmez votre demande d'audit »</em>.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="size-5 rounded-full bg-mint text-forest-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                2
              </span>
              <p className="text-paper/85">
                Cliquez sur le bouton de confirmation unique pour activer votre demande (valable 48h).
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="size-5 rounded-full bg-mint text-forest-black font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                3
              </span>
              <p className="text-paper/85">
                Une fois votre adresse confirmée, votre demande est enregistrée et nous vous écrivons dès que le rapport est prêt.
              </p>
            </div>
          </div>

          {/* Reassurance text */}
          <p className="text-xs text-mint/70">
            Vous ne trouvez pas l'email ? Vérifiez vos dossiers <em className="text-paper/80">Spams</em> ou{" "}
            <em className="text-paper/80">Promotions</em>.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              variant="outline"
              className="border-pine hover:bg-pine/40 text-paper text-sm w-full sm:w-auto"
            >
              <Link to="/">
                <Home className="mr-2 size-4" />
                Retour à l'accueil
              </Link>
            </Button>
            <Button
              asChild
              className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold text-sm w-full sm:w-auto"
            >
              <Link to="/journal">
                Découvrir le Journal Volka
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
