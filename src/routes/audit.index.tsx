import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Globe, TrendingUp, Workflow, HelpCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPublicAuditCapacity } from "@/lib/audit/audit.functions";
import type { AuditCapacityStatus } from "@/lib/audit/audit.server";

export const Route = createFileRoute("/audit/")({
  // Never invent numbers: if the real capacity cannot be loaded, show no counter at all.
  loader: async (): Promise<AuditCapacityStatus | null> => {
    try {
      return await getPublicAuditCapacity();
    } catch (err) {
      console.warn("Could not load audit capacity:", err);
      return null;
    }
  },
  head: () => ({
    meta: [
      { title: "Audit Croissance Gratuit — Volka Studio" },
      {
        name: "description",
        content:
          "Un diagnostic écrit de votre site, de votre marketing ou de votre suivi commercial : ce qui fonctionne, ce qui bloque, quoi corriger en premier.",
      },
      { property: "og:title", content: "Audit Croissance Gratuit — Volka Studio" },
      {
        property: "og:description",
        content: "Voyez où votre activité perd des clients et quoi corriger en premier.",
      },
      { property: "og:image", content: "/images/audit-showcase.jpg" },
    ],
  }),
  component: AuditLandingPage,
});

const TRACKS = [
  {
    id: "website",
    title: "Mon site web",
    desc: "Clarté de l'offre, vitesse sur mobile, chemin vers le contact.",
    icon: Globe,
  },
  {
    id: "marketing",
    title: "Mon marketing et ma visibilité",
    desc: "Profils publics, cohérence, contenus et lien en bio.",
    icon: TrendingUp,
  },
  {
    id: "sales",
    title: "Mes ventes et mon suivi",
    desc: "Où les demandes se perdent entre le premier message et la vente.",
    icon: Workflow,
  },
  {
    id: "general",
    title: "Je ne sais pas",
    desc: "On regarde l'ensemble pour trouver le premier blocage.",
    icon: HelpCircle,
  },
] as const;

function AuditLandingPage() {
  const capacity = Route.useLoaderData();
  const days = capacity?.deliveryDays;

  const faqs = [
    {
      q: "Pourquoi est-ce gratuit ?",
      a: "C'est une première étape limitée pour vous montrer comment nous analysons une situation. Elle ne vous engage à rien et ne remplace pas un devis.",
    },
    {
      q: "Que contient le rapport ?",
      a: "Un lien privé avec une lecture de ce qui fonctionne, les 3 principaux points à corriger, 3 actions rapides que vous pouvez faire seul, et l'offre qui correspondrait le mieux si vous souhaitez être accompagné.",
    },
    {
      q: "Avez-vous besoin de mes mots de passe ?",
      a: "Non, jamais. Nous regardons uniquement ce qui est public et ce que vous nous écrivez dans le formulaire. Nous n'accédons à aucun compte privé, publicitaire ou analytique.",
    },
    {
      q: "Quel est le délai ?",
      a: days
        ? `Le rapport est envoyé sous ${days} jours ouvrés après la confirmation de votre email. Le nombre d'audits est limité chaque mois pour garder ce délai.`
        : "Le délai est indiqué dans votre email de confirmation. Le nombre d'audits est limité chaque mois.",
    },
    {
      q: "Que se passe-t-il si les places du mois sont prises ?",
      a: "Vous êtes ajouté à la liste d'attente et traité le mois suivant, dans l'ordre d'arrivée.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-forest-black text-paper font-sans selection:bg-mint selection:text-forest-black">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-mint">
              Audit croissance gratuit
            </p>
            <h1 className="font-display text-4xl sm:text-6xl font-light leading-[1.08] tracking-tight text-balance">
              Voyez où votre activité{" "}
              <span className="italic text-mint">perd des clients</span>.
            </h1>
            <p className="text-base sm:text-lg text-paper/75 leading-relaxed text-pretty">
              Un diagnostic écrit de votre site, de votre marketing ou de votre suivi commercial :
              ce qui fonctionne, ce qui bloque, et quoi corriger en premier.
            </p>

            <div className="pt-2 space-y-4">
              <Link
                to="/audit/demande"
                className="inline-flex w-full sm:w-auto min-h-14 items-center justify-center gap-2 rounded-full bg-ochre px-10 text-base font-semibold text-forest-black transition hover:bg-ochre/90 active:scale-[0.98]"
              >
                Demander mon audit gratuit
                <ArrowRight className="size-5" />
              </Link>

              <p className="text-sm text-paper/60">
                {capacity?.isOpen && (
                  <>
                    <span className="text-mint font-medium">
                      {capacity.remaining} {capacity.remaining > 1 ? "places restantes" : "place restante"}
                    </span>{" "}
                    ce mois-ci
                    <span className="mx-2 text-paper/30">·</span>
                  </>
                )}
                {capacity && !capacity.isOpen && (
                  <>
                    <span className="text-ochre font-medium">Places du mois complètes : liste d'attente ouverte</span>
                    <span className="mx-2 text-paper/30">·</span>
                  </>
                )}
                Gratuit, sans engagement
              </p>
            </div>
          </div>
        </section>

        {/* TRACKS */}
        <section className="px-6 py-14 sm:py-20 border-t border-pine/30">
          <div className="mx-auto max-w-3xl space-y-8">
            <h2 className="font-display text-2xl sm:text-4xl font-light text-center text-balance">
              Qu'est-ce qu'on regarde pour vous ?
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {TRACKS.map((track) => {
                const Icon = track.icon;
                return (
                  <Link
                    key={track.id}
                    to="/audit/demande"
                    search={{ track: track.id }}
                    className="group flex items-start gap-4 rounded-2xl border border-paper/15 bg-paper/5 p-5 transition hover:border-ochre/70 hover:bg-paper/10 active:scale-[0.99]"
                  >
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-pine/60 text-mint">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block text-base font-medium">{track.title}</span>
                      <span className="block text-sm text-paper/65 leading-snug">{track.desc}</span>
                    </span>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-paper/30 transition group-hover:translate-x-0.5 group-hover:text-ochre" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-6 py-14 sm:py-20 border-t border-pine/30">
          <div className="mx-auto max-w-3xl space-y-8">
            <h2 className="font-display text-2xl sm:text-4xl font-light text-center text-balance">
              Comment ça se passe
            </h2>

            <ol className="grid gap-6 sm:grid-cols-3">
              {[
                ["1", "Vous répondez", "Quelques questions sur votre activité. Compter 3 minutes."],
                ["2", "Vous confirmez", "Un lien dans votre email confirme que la demande est bien de vous."],
                [
                  "3",
                  "Vous recevez le rapport",
                  days
                    ? `Un lien privé, sous ${days} jours ouvrés, avec vos 3 priorités et 3 actions rapides.`
                    : "Un lien privé avec vos 3 priorités et 3 actions rapides.",
                ],
              ].map(([n, title, text]) => (
                <li key={n} className="flex gap-4 sm:block sm:space-y-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-mint/40 font-mono text-sm text-mint">
                    {n}
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-paper/65 leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="text-center text-xs text-paper/50 leading-relaxed max-w-xl mx-auto">
              Basé uniquement sur des informations publiques et sur vos réponses. Ce n'est ni un devis,
              ni une mise en œuvre, ni une promesse de résultat.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-14 sm:py-20 border-t border-pine/30">
          <div className="mx-auto max-w-2xl space-y-8">
            <h2 className="font-display text-2xl sm:text-4xl font-light text-center text-balance">
              Questions fréquentes
            </h2>

            <div className="divide-y divide-paper/10 rounded-2xl border border-paper/15 bg-paper/5">
              {faqs.map((faq) => (
                <details key={faq.q} className="group px-5">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-medium [&::-webkit-details-marker]:hidden">
                    <span>{faq.q}</span>
                    <ChevronDown className="size-4 shrink-0 text-paper/50 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 text-sm text-paper/70 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>

            <div className="text-center">
              <Link
                to="/audit/demande"
                className="inline-flex w-full sm:w-auto min-h-14 items-center justify-center gap-2 rounded-full bg-ochre px-10 text-base font-semibold text-forest-black transition hover:bg-ochre/90 active:scale-[0.98]"
              >
                Demander mon audit gratuit
                <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
