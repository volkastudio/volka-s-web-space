import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Globe,
  TrendingUp,
  Workflow,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  FileText,
  Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getPublicAuditCapacity } from "@/lib/audit/audit.functions";
import type { AuditCapacityStatus } from "@/lib/audit/audit.server";

export const Route = createFileRoute("/audit/")({
  loader: async () => {
    try {
      return await getPublicAuditCapacity();
    } catch (err) {
      console.warn("Could not load audit capacity:", err);
      return {
        capacity: 10,
        used: 2,
        remaining: 8,
        isOpen: true,
        deliveryDays: 5,
        monthName: "ce mois",
      } satisfies AuditCapacityStatus;
    }
  },
  head: () => ({
    meta: [
      { title: "Audit Croissance Gratuit — Volka Studio" },
      {
        name: "description",
        content:
          "Un diagnostic écrit et ciblé de votre système de croissance pour identifier où vous perdez des clients et quoi corriger en priorité.",
      },
      { property: "og:title", content: "Audit Croissance Gratuit — Volka Studio" },
      {
        property: "og:description",
        content: "Identifier exactement où votre système perd des clients. Diagnostic sans complaisance sous 5 jours ouvrés.",
      },
    ],
  }),
  component: AuditLandingPage,
});

interface TrackCardProps {
  id: "website" | "marketing" | "sales" | "general";
  title: string;
  tagline: string;
  scope: string;
  automatedItems: string[];
  humanItems: string[];
  icon: React.ReactNode;
}

const AUDIT_TRACKS: TrackCardProps[] = [
  {
    id: "website",
    title: "Site Web",
    tagline: "Conversion & Perception",
    scope: "Votre site explique-t-il votre offre en 5 secondes et convertit-il vos visiteurs ?",
    automatedItems: [
      "Vitesse mobile & desktop (scores PageSpeed)",
      "Accessibilité & conformité technique",
      "Aperçu du partage social (vignette WhatsApp/LinkedIn)",
    ],
    humanItems: [
      "Clarté du positionnement et du message d'accroche",
      "Fluidité du parcours de prise de contact / WhatsApp",
      "Signaux de confiance et réassurance perçue",
    ],
    icon: <Globe className="size-6 text-mint" />,
  },
  {
    id: "marketing",
    title: "Marketing & Visibilité",
    tagline: "Acquisition & Perception",
    scope: "Vos canaux d'acquisition attirent-ils les bonnes personnes avec un message cohérent ?",
    automatedItems: [
      "Vérification des liens publics et redirections (link-in-bio)",
      "Présence et cohérence des profils publics",
    ],
    humanItems: [
      "Cohérence visuelle et éditoriale entre canaux",
      "Clarté de la promesse sur les biographies de réseaux sociaux",
      "Alignement entre contenu partagé et vente de vos offres",
    ],
    icon: <TrendingUp className="size-6 text-mint" />,
  },
  {
    id: "sales",
    title: "Ventes & Suivi",
    tagline: "Sales & Automation",
    scope: "Où vos prospects s'évaporent-ils entre leur première question et le devis signé ?",
    automatedItems: [
      "Audit des formulaires de capture et confirmations automatiques",
    ],
    humanItems: [
      "Cartographie des fuites de suivi et délais de réponse",
      "Gestion des relances commerciales (WhatsApp / email)",
      "Identification des tâches répétitives à automatiser",
    ],
    icon: <Workflow className="size-6 text-mint" />,
  },
  {
    id: "general",
    title: "Je ne sais pas",
    tagline: "Diagnostic Transversal",
    scope: "Vous constatez un blocage commercial mais ne savez pas quel pilier corriger en premier.",
    automatedItems: [
      "Scan de premier niveau de votre présence en ligne",
    ],
    humanItems: [
      "Revue transversale des 5 piliers de croissance",
      "Localisation du goulot d'étranglement numéro 1",
      "Recommandation du parcours approfondi prioritaire",
    ],
    icon: <HelpCircle className="size-6 text-mint" />,
  },
];

const FAQS = [
  {
    q: "Pourquoi cet audit est-il gratuit ?",
    a: "Parce que nous croyons à la valeur démontrée avant l'engagement. Cet audit est notre façon de vous montrer notre rigueur d'analyse sans risque pour vous. Si le diagnostic est pertinent, nous serons naturellement votre premier choix quand vous déciderez d'investir.",
  },
  {
    q: "Combien de temps prend la réalisation ?",
    a: "Chaque audit est livré sous 5 jours ouvrés à compter de la confirmation de votre adresse email. Pour préserver cette cadence et une attention humaine minutieuse, nous limitons strictement les demandes à 10 places par mois.",
  },
  {
    q: "Que se passe-t-il après réception du rapport ?",
    a: "Vous recevez un lien privé vers votre rapport interactif, incluant un scorecard de maturité, les 3 constats majeurs et 3 victoires rapides que vous pouvez appliquer en totale autonomie. Vous êtes libre de nous contacter pour un accompagnement, ou de mettre en œuvre les conseils par vous-même.",
  },
  {
    q: "Avez-vous besoin de mes identifiants ou mots de passe ?",
    a: "Jamais. Nous n'accédons à aucun compte privé, outil interne, compte publicitaire ou analytics. Nous analysons exclusivement les informations publiques de votre marque et les réponses que vous nous fournissez dans le questionnaire.",
  },
];

function AuditLandingPage() {
  const capacity = Route.useLoaderData();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="min-h-screen bg-forest-black text-paper flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-6 sm:px-12 border-b border-pine/30 overflow-hidden">
          {/* Subtle background glow */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-mint/5 rounded-full blur-[120px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pine/60 border border-mint/20 text-mint text-xs uppercase tracking-widest font-semibold backdrop-blur-sm">
              <span className="size-2 rounded-full bg-mint animate-pulse" />
              Diagnostic de croissance gratuit
            </div>

            {/* Main Headline in Cormorant Garamond */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-light text-paper leading-[1.08] tracking-tight">
              Identifier exactement où votre système perd des clients.
            </h1>

            {/* Subparagraph */}
            <p className="text-lg sm:text-xl text-mint/90 max-w-2xl mx-auto font-normal leading-relaxed">
              Un diagnostic écrit sans concession sur l'un de vos piliers commerciaux :
              ce qui fonctionne, ce qui bloque vos ventes, et quoi réparer en premier.
            </p>

            {/* Live Capacity Counter Badge */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {capacity.isOpen ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mint/15 border border-mint/40 text-paper text-sm font-medium">
                  <span className="size-2.5 rounded-full bg-mint" />
                  <span>
                    <strong>{capacity.remaining} places restantes</strong> pour le mois de {capacity.monthName}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta/20 border border-terracotta text-paper text-sm font-medium">
                  <AlertTriangle className="size-4 text-terracotta" />
                  <span>
                    Capacité atteinte pour {capacity.monthName} — Inscription sur <strong>liste d'attente prioritaire</strong>
                  </span>
                </div>
              )}

              <div className="inline-flex items-center gap-1.5 text-xs text-mint/70">
                <Clock className="size-3.5" />
                <span>Délai moyen : {capacity.deliveryDays} jours ouvrés</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-6">
              <Button
                asChild
                size="lg"
                className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-8 py-6 text-base rounded-md shadow-lg transition-transform active:scale-95"
              >
                <Link to="/audit/demande">
                  Demander mon audit gratuit
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 4 TRACK CARDS SECTION */}
        <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-ochre font-semibold">
              4 Parcours d'analyse
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-paper font-light">
              Choisissez le goulot d'étranglement à débloquer
            </h2>
            <p className="text-mint/80 text-sm sm:text-base">
              Chaque diagnostic combine une analyse technique automatisée et une revue stratégique humaine réalisée par notre studio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AUDIT_TRACKS.map((track) => (
              <div
                key={track.id}
                className="bg-pine/30 border border-pine/60 hover:border-mint/50 rounded-lg p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-sm"
              >
                <div className="space-y-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="p-2.5 rounded-md bg-pine/80 inline-block">
                        {track.icon}
                      </div>
                      <h3 className="font-display text-2xl text-paper font-medium pt-2">
                        {track.title}
                      </h3>
                      <p className="text-xs uppercase tracking-wider text-ochre font-semibold">
                        {track.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-paper/90 leading-relaxed font-normal">
                    {track.scope}
                  </p>

                  {/* Automated vs Human breakdown */}
                  <div className="space-y-4 pt-2 text-xs border-t border-pine/40">
                    <div className="space-y-1.5">
                      <span className="font-semibold text-mint flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-mint" />
                        Ce que nos outils analysent :
                      </span>
                      <ul className="space-y-1 pl-5 list-disc text-paper/70">
                        {track.automatedItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-semibold text-ochre flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-ochre" />
                        Ce que le studio examine à la main :
                      </span>
                      <ul className="space-y-1 pl-5 list-disc text-paper/70">
                        {track.humanItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-mint/30 hover:border-mint hover:bg-mint/10 text-paper hover:text-paper font-medium"
                  >
                    <Link to="/audit/demande" search={{ track: track.id }}>
                      Choisir ce parcours
                      <ArrowRight className="ml-2 size-4 text-mint" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SAMPLE REPORT TEASER SECTION */}
        <section className="py-16 px-6 sm:px-12 bg-pine/20 border-y border-pine/30">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs uppercase tracking-widest text-mint font-semibold">
                Livrable
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-paper font-light">
                À quoi ressemble votre rapport d'audit
              </h2>
              <p className="text-sm text-mint/80 max-w-xl mx-auto">
                Pas de jargon creux de 40 pages. Une page privée, claire et imprimable en PDF contenant l'essentiel pour agir.
              </p>
            </div>

            {/* Interactive Preview Card with Disclaimer Banner */}
            <div className="bg-forest-black border border-pine/80 rounded-lg p-6 sm:p-8 space-y-6 shadow-2xl relative">
              {/* Mandatory Disclaimer Banner */}
              <div className="bg-ochre/15 border border-ochre/40 rounded px-4 py-2 text-center text-xs text-ochre font-medium">
                Exemple fictif illustratif — Aucun résultat commercial n'est garanti
              </div>

              {/* Sample Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pine/40 pb-4">
                <div>
                  <span className="text-xs text-mint uppercase tracking-widest">
                    Diagnostic de croissance
                  </span>
                  <h4 className="font-display text-2xl text-paper">
                    Atelier Kōro — Ventes en ligne & Expérience client
                  </h4>
                </div>
                <div className="px-3 py-1 rounded bg-mint/15 text-mint text-xs font-mono font-semibold">
                  Score global : 3.8 / 5
                </div>
              </div>

              {/* Sample Scorecard bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-pine/40 rounded border border-pine/60 space-y-1">
                  <span className="text-mint font-medium">Clarté de l'offre</span>
                  <div className="w-full bg-forest-black h-2 rounded-full overflow-hidden">
                    <div className="bg-mint h-full w-[80%]" />
                  </div>
                  <span className="text-paper/60 text-[11px]">4.0 / 5 — Message percutant</span>
                </div>
                <div className="p-3 bg-pine/40 rounded border border-pine/60 space-y-1">
                  <span className="text-mint font-medium">Parcours WhatsApp</span>
                  <div className="w-full bg-forest-black h-2 rounded-full overflow-hidden">
                    <div className="bg-ochre h-full w-[50%]" />
                  </div>
                  <span className="text-paper/60 text-[11px]">2.5 / 5 — Délais trop longs</span>
                </div>
                <div className="p-3 bg-pine/40 rounded border border-pine/60 space-y-1">
                  <span className="text-mint font-medium">Vitesse & Mobile</span>
                  <div className="w-full bg-forest-black h-2 rounded-full overflow-hidden">
                    <div className="bg-mint h-full w-[90%]" />
                  </div>
                  <span className="text-paper/60 text-[11px]">4.5 / 5 — Très fluide</span>
                </div>
              </div>

              {/* Sample Findings */}
              <div className="space-y-3 pt-2">
                <span className="text-xs uppercase tracking-wider text-ochre font-semibold">
                  Extrait des 3 constats majeurs
                </span>
                <div className="p-3.5 bg-pine/30 rounded border-l-2 border-terracotta text-xs space-y-1">
                  <strong className="text-paper">
                    1. Le bouton WhatsApp ouvre un message vide sans modèle pré-rempli
                  </strong>
                  <p className="text-paper/70">
                    Le prospect doit inventer sa question. En pré-remplissant l'offre choisie, vous augmentez le taux de conversation initiale de 35%.
                  </p>
                </div>
                <div className="p-3.5 bg-pine/30 rounded border-l-2 border-mint text-xs space-y-1">
                  <strong className="text-paper">
                    2. Victoire rapide : Ajouter un badge de réassurance sous le prix
                  </strong>
                  <p className="text-paper/70">
                    Mentionner votre garantie ou modalité d'acompte directement à côté du CTA supprime l'hésitation au moment du clic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* EXCLUSIONS & HONEST BOUNDARIES SECTION */}
        <section className="py-16 px-6 sm:px-12 max-w-4xl mx-auto space-y-8">
          <div className="p-6 sm:p-8 rounded-lg bg-pine/30 border border-terracotta/40 space-y-4">
            <div className="flex items-center gap-3 text-terracotta font-medium">
              <ShieldCheck className="size-5" />
              <h3 className="font-display text-xl text-paper">
                Ce que cet audit n'est pas (Périmètre & limites honnêtes)
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-paper/80 list-disc pl-6 leading-relaxed">
              <li>
                <strong>Aucune garantie de résultat commercial :</strong> Ce diagnostic relève des faits observables et propose des pistes rationnelles. Nous ne promettons aucun chiffre d'affaires miraculeux.
              </li>
              <li>
                <strong>Pas d'accès à vos comptes privés :</strong> Nous n'exigeons aucun accès à vos comptes publicitaires, CMS ou analytics privés. L'analyse porte sur les informations publiques et vos déclarations.
              </li>
              <li>
                <strong>Pas d'exécution gratuite :</strong> L'audit identifie les blocages et formule des recommandations. Il n'inclut pas la rédaction de votre contenu ni la modification de votre site.
              </li>
              <li>
                <strong>Limite stricte :</strong> 1 seul audit par entreprise tous les 6 mois afin de laisser la place aux autres créateurs et marques.
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section className="py-16 px-6 sm:px-12 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-mint font-semibold">
              Questions Fréquentes
            </span>
            <h2 className="font-display text-3xl text-paper font-light">
              Tout ce que vous devez savoir
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-pine/30 border border-pine/60 rounded-md overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-paper hover:text-mint transition-colors"
                  >
                    <span className="text-sm sm:text-base font-medium">{faq.q}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-mint" : "text-mint/60"
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-paper/80 leading-relaxed border-t border-pine/30 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-8 text-center">
            <Button
              asChild
              size="lg"
              className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-8 py-5 text-base rounded-md shadow-md"
            >
              <Link to="/audit/demande">
                Demander mon diagnostic gratuit
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
