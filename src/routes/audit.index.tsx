import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Globe, TrendingUp, Workflow, HelpCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TealBackground } from "@/components/teal-background";
import { getPublicAuditCapacity } from "@/lib/audit/audit.functions";
import type { AuditCapacityStatus } from "@/lib/audit/audit.server";
import { useI18n } from "@/i18n/context";

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
      { title: "Audit de Croissance Gratuit — Diagnostic Site, Marketing ou Ventes | Volka Studio" },
      {
        name: "description",
        content:
          "Recevez un diagnostic écrit et personnalisé sur votre site, votre acquisition ou votre suivi commercial : ce qui fonctionne, ce qui bloque, et quoi corriger en priorité. Gratuit, en 48 h.",
      },
      { property: "og:title", content: "Audit de Croissance Gratuit — Volka Studio" },
      {
        property: "og:description",
        content: "Un diagnostic écrit pour identifier précisément où votre activité perd des clients et quoi corriger en premier.",
      },
      { property: "og:image", content: "/images/audit-showcase.jpg" },
    ],
  }),
  component: AuditLandingPage,
});

function AuditLandingPage() {
  const capacity = Route.useLoaderData();
  const { locale } = useI18n();
  const isEn = locale === "en";
  const days = capacity?.deliveryDays;

  const tracks = [
    {
      id: "website",
      title: isEn ? "My website" : "Mon site web",
      desc: isEn
        ? "Offer clarity, mobile speed, path to contact / WhatsApp."
        : "Clarté de l'offre, vitesse sur mobile, chemin vers le contact.",
      icon: Globe,
    },
    {
      id: "marketing",
      title: isEn ? "My marketing & visibility" : "Mon marketing et ma visibilité",
      desc: isEn
        ? "Public profiles, consistency, content & link-in-bio."
        : "Profils publics, cohérence, contenus et lien en bio.",
      icon: TrendingUp,
    },
    {
      id: "sales",
      title: isEn ? "My sales & follow-up" : "Mes ventes et mon suivi",
      desc: isEn
        ? "Where inquiries get lost between first message and sale."
        : "Où les demandes se perdent entre le premier message et la vente.",
      icon: Workflow,
    },
    {
      id: "general",
      title: isEn ? "I'm not sure" : "Je ne sais pas",
      desc: isEn
        ? "We review the whole picture to identify the primary bottleneck."
        : "On regarde l'ensemble pour trouver le premier blocage.",
      icon: HelpCircle,
    },
  ] as const;

  const faqs = [
    {
      q: isEn ? "Why is it free?" : "Pourquoi est-ce gratuit ?",
      a: isEn
        ? "It is a limited first step to demonstrate how we analyze a business. It requires no commitment and does not replace a quote."
        : "C'est une première étape limitée pour vous montrer comment nous analysons une situation. Elle ne vous engage à rien et ne remplace pas un devis.",
    },
    {
      q: isEn ? "What does the report include?" : "Que contient le rapport ?",
      a: isEn
        ? "A private link with a review of what works, the 3 primary points to fix, 3 fast actions you can take yourself, and the offer that best fits if you wish to collaborate."
        : "Un lien privé avec une lecture de ce qui fonctionne, les 3 principaux points à corriger, 3 actions rapides que vous pouvez faire seul, et l'offre qui correspondrait le mieux si vous souhaitez être accompagné.",
    },
    {
      q: isEn ? "Do you need my passwords?" : "Avez-vous besoin de mes mots de passe ?",
      a: isEn
        ? "No, never. We review only public assets and what you share in the form. We never access private accounts, ads managers, or analytics."
        : "Non, jamais. Nous regardons uniquement ce qui est public et ce que vous nous écrivez dans le formulaire. Nous n'accédons à aucun compte privé, publicitaire ou analytique.",
    },
    {
      q: isEn ? "What is the turnaround time?" : "Quel est le délai ?",
      a: days
        ? isEn
          ? `The report is delivered within ${days} business days after verifying your email. Spots are limited each month to guarantee this turnaround.`
          : `Le rapport est envoyé sous ${days} jours ouvrés après la confirmation de votre email. Le nombre d'audits est limité chaque mois pour garder ce délai.`
        : isEn
          ? "Turnaround is indicated in your verification email. The number of audits is limited each month."
          : "Le délai est indiqué dans votre email de confirmation. Le nombre d'audits est limité chaque mois.",
    },
    {
      q: isEn ? "What happens if this month's spots are full?" : "Que se passe-t-il si les places du mois sont prises ?",
      a: isEn
        ? "You are placed on the waiting list and processed the following month, in order of arrival."
        : "Vous êtes ajouté à la liste d'attente et traité le mois suivant, dans l'ordre d'arrivée.",
    },
  ];

  return (
    <div className="min-h-svh flex flex-col bg-forest-black text-paper font-sans selection:bg-mint selection:text-forest-black">
      <main className="flex-1">
        {/* HERO: fills the whole first screen, content centred */}
        <section className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden px-6 pb-16 pt-28 sm:pb-20 sm:pt-32">
          <TealBackground variant="glow" />
          <SiteHeader variant="overlay" />
          <div className="relative z-10 mx-auto max-w-2xl text-center space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-mint">
              {isEn ? "Free growth audit" : "Audit croissance gratuit"}
            </p>
            <h1 className="font-display text-4xl sm:text-6xl font-light leading-[1.08] tracking-tight text-balance">
              {isEn ? (
                <>
                  See where your business is{" "}
                  <span className="italic text-mint font-light">losing clients</span>.
                </>
              ) : (
                <>
                  Voyez où votre activité{" "}
                  <span className="italic text-mint font-light">perd des clients</span>.
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg text-paper/75 leading-relaxed text-pretty">
              {isEn
                ? "A written diagnosis of your website, marketing or sales follow-up: what works, what blocks, and what to fix first."
                : "Un diagnostic écrit de votre site, de votre marketing ou de votre suivi commercial : ce qui fonctionne, ce qui bloque, et quoi corriger en premier."}
            </p>

            <div className="pt-2 space-y-4">
              <Link
                to="/audit/demande"
                className="inline-flex w-full sm:w-auto min-h-14 items-center justify-center gap-2 rounded-sm bg-ochre px-10 text-base font-semibold text-forest-black transition hover:bg-ochre/90 active:scale-[0.98] shadow-xl"
              >
                <span>{isEn ? "Request my free audit" : "Demander mon audit gratuit"}</span>
                <ArrowRight className="size-5" />
              </Link>

              <p className="text-sm text-paper/60">
                {capacity?.isOpen && (
                  <>
                    <span className="text-mint font-medium">
                      {capacity.remaining}{" "}
                      {isEn
                        ? capacity.remaining > 1
                          ? "spots remaining"
                          : "spot remaining"
                        : capacity.remaining > 1
                          ? "places restantes"
                          : "place restante"}
                    </span>{" "}
                    {isEn ? "this month" : "ce mois-ci"}
                    <span className="mx-2 text-paper/30">·</span>
                  </>
                )}
                {capacity && !capacity.isOpen && (
                  <>
                    <span className="text-ochre font-medium">
                      {isEn
                        ? "Month's spots full: waiting list open"
                        : "Places du mois complètes : liste d'attente ouverte"}
                    </span>
                    <span className="mx-2 text-paper/30">·</span>
                  </>
                )}
                {isEn ? "Free, zero obligation" : "Gratuit, sans engagement"}
              </p>
            </div>
          </div>
        </section>

        {/* TRACKS: Light background, hidden on mobile */}
        <section className="hidden md:block px-6 py-14 sm:py-20 border-t border-border bg-ivory text-forest-black">
          <div className="mx-auto max-w-3xl space-y-8">
            <h2 className="font-display text-2xl sm:text-4xl font-light text-center text-balance text-forest-black">
              {isEn ? "What do we look at for you?" : "Qu'est-ce qu'on regarde pour vous ?"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {tracks.map((track) => {
                const Icon = track.icon;
                return (
                  <Link
                    key={track.id}
                    to="/audit/demande"
                    search={{ track: track.id }}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-paper p-5 transition shadow-xs hover:border-ochre/80 hover:shadow-md active:scale-[0.99]"
                  >
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block text-base font-medium text-forest-black">{track.title}</span>
                      <span className="block text-sm text-forest-black/70 leading-snug">{track.desc}</span>
                    </span>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-forest-black/30 transition group-hover:translate-x-0.5 group-hover:text-ochre" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS: Light background */}
        <section className="px-6 py-14 sm:py-20 border-t border-border bg-background text-forest-black">
          <div className="mx-auto max-w-3xl space-y-8">
            <h2 className="font-display text-2xl sm:text-4xl font-light text-center text-balance text-forest-black">
              {isEn ? "How it works" : "Comment ça se passe"}
            </h2>

            <ol className="grid gap-6 sm:grid-cols-3">
              {[
                [
                  "1",
                  isEn ? "You answer" : "Vous répondez",
                  isEn
                    ? "A few questions about your business. Takes about 3 minutes."
                    : "Quelques questions sur votre activité. Compter 3 minutes.",
                ],
                [
                  "2",
                  isEn ? "You confirm" : "Vous confirmez",
                  isEn
                    ? "A link in your inbox confirms that the inquiry is truly yours."
                    : "Un lien dans votre email confirme que la demande est bien de vous.",
                ],
                [
                  "3",
                  isEn ? "You receive the report" : "Vous recevez le rapport",
                  days
                    ? isEn
                      ? `A private link, delivered within ${days} business days, with your 3 priorities and 3 quick actions.`
                      : `Un lien privé, sous ${days} jours ouvrés, avec vos 3 priorités et 3 actions rapides.`
                    : isEn
                      ? "A private link with your 3 priorities and 3 quick actions."
                      : "Un lien privé avec vos 3 priorités et 3 actions rapides.",
                ],
              ].map(([n, title, text]) => (
                <li key={n} className="flex gap-4 sm:block sm:space-y-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/25 font-mono text-sm text-primary">
                    {n}
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium text-forest-black">{title}</p>
                    <p className="text-sm text-forest-black/70 leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="text-center text-xs text-forest-black/60 leading-relaxed max-w-xl mx-auto">
              {isEn
                ? "Based strictly on public information and your answers. This is not a quote, an implementation, or a guarantee of results."
                : "Basé uniquement sur des informations publiques et sur vos réponses. Ce n'est ni un devis, ni une mise en œuvre, ni une promesse de résultat."}
            </p>
          </div>
        </section>

        {/* FAQ: Light background */}
        <section className="px-6 py-14 sm:py-20 border-t border-border bg-ivory text-forest-black">
          <div className="mx-auto max-w-2xl space-y-8">
            <h2 className="font-display text-2xl sm:text-4xl font-light text-center text-balance text-forest-black">
              {isEn ? "Frequently asked questions" : "Questions fréquentes"}
            </h2>

            <div className="divide-y divide-border rounded-2xl border border-border bg-paper shadow-xs">
              {faqs.map((faq) => (
                <details key={faq.q} className="group px-5">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-medium text-forest-black [&::-webkit-details-marker]:hidden">
                    <span>{faq.q}</span>
                    <ChevronDown className="size-4 shrink-0 text-forest-black/50 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 text-sm text-forest-black/75 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>

            <div className="text-center">
              <Link
                to="/audit/demande"
                className="inline-flex w-full sm:w-auto min-h-14 items-center justify-center gap-2 rounded-sm bg-ochre px-10 text-base font-semibold text-forest-black transition hover:bg-ochre/90 active:scale-[0.98] shadow-md"
              >
                <span>{isEn ? "Request my free audit" : "Demander mon audit gratuit"}</span>
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
