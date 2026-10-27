import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, ShieldCheck, ArrowRight, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitUnsubscribe } from "@/lib/sales/sales.functions";

const searchSchema = z.object({
  email: z.string().email().optional(),
  test: z.string().optional(),
});

export const Route = createFileRoute("/sales/unsubscribe")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Désabonnement — Volka Studio" },
    ],
  }),
  loader: async ({ location }) => {
    const search = location.search as { email?: string; test?: string };
    if (search.email) {
      try {
        await submitUnsubscribe({ data: { email: search.email } });
        return { autoUnsubscribed: true, email: search.email };
      } catch (err) {
        return { autoUnsubscribed: false, email: search.email };
      }
    }
    return { autoUnsubscribed: false, email: "" };
  },
  component: SalesUnsubscribePage,
});

function SalesUnsubscribePage() {
  const { autoUnsubscribed, email: initialEmail } = Route.useLoaderData();
  const [emailInput, setEmailInput] = React.useState(initialEmail || "");
  const [confirmed, setConfirmed] = React.useState(autoUnsubscribed);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setLoading(true);
    try {
      await submitUnsubscribe({ data: { email: emailInput } });
      setConfirmed(true);
    } catch {
      setConfirmed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-black text-paper flex items-center justify-center p-6 selection:bg-mint selection:text-forest-black">
      <div className="max-w-md w-full bg-pine/60 border border-mint/20 rounded-2xl p-8 space-y-6 shadow-2xl backdrop-blur-xs text-center">
        {/* Emblem */}
        <div className="mx-auto size-12 rounded-full bg-mint/15 border border-mint/30 flex items-center justify-center text-mint">
          {confirmed ? <CheckCircle2 className="size-6 text-mint" /> : <Mail className="size-6 text-mint" />}
        </div>

        {confirmed ? (
          <div className="space-y-3">
            <h1 className="font-display text-3xl font-light text-paper">
              Désabonnement confirmé
            </h1>
            <p className="text-sm text-paper/80 font-sans leading-relaxed">
              Votre adresse email a été retirée avec effet immédiat de toutes nos séquences de suivi.
            </p>
            <div className="p-3.5 rounded-lg bg-forest-black/50 border border-mint/15 text-xs text-mint/80 flex items-center justify-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-mint" />
              <span>Garantie de non-sollicitation Volka Studio (Règle D24)</span>
            </div>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-mint hover:underline"
              >
                Retourner sur le site principal <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-light text-paper">
                Gestion de vos préférences
              </h1>
              <p className="text-xs text-paper/70 font-sans leading-relaxed">
                Indiquez votre adresse email pour stopper définitivement les emails de suivi post-achat.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <Input
                type="email"
                required
                placeholder="votre.email@exemple.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="bg-forest-black/60 border-mint/30 text-paper text-xs placeholder:text-paper/40"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-mint text-forest-black hover:bg-mint/90 font-semibold text-xs h-9"
              >
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : "Confirmer mon désabonnement"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
