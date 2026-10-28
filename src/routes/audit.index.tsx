import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
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
  Sparkles,
  Zap,
  Sliders,
  Award,
  Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { BeamsBackground } from "@/components/ui/beams-background";
import { ConnectedCarousel, type CarouselItem } from "@/components/ui/connected-carousel";
import { getPublicAuditCapacity } from "@/lib/audit/audit.functions";
import type { AuditCapacityStatus } from "@/lib/audit/audit.server";

export const Route = createFileRoute("/audit/")({
  loader: async () => {
    try {
      return await getPublicAuditCapacity();
    } catch (err) {
      console.warn("Could not load audit capacity:", err);
      return {
        capacity: 30,
        used: 2,
        remaining: 28,
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
        content:
          "Identifier exactement où votre système perd des clients. Diagnostic sans complaisance sous 5 jours ouvrés.",
      },
      { property: "og:image", content: "/images/audit-showcase.jpg" },
    ],
  }),
  component: AuditLandingPage,
});

const METHODOLOGY_ITEMS: CarouselItem[] = [
  {
    id: "website",
    stat: "Site Web & Conversion",
    role: "Conversion & Perception",
    author: "Parcours 01",
    quote:
      "Votre site explique-t-il votre offre en 5 secondes et convertit-il vos visiteurs sans friction ? Nous traquons les points de fuite invisibles.",
    defaultImage: "/images/product-showcase.jpg",
    selectedImage: "/images/product-showcase.jpg",
    points: [
      "Vitesse mobile & scores techniques PageSpeed",
      "Clarté immédiate du positionnement et de l'accroche",
      "Fluidité du parcours d'action et contact WhatsApp",
    ],
    actionHref: "/audit/demande",
    actionSearch: { track: "website" },
    actionText: "Choisir le parcours Site Web",
  },
  {
    id: "marketing",
    stat: "Marketing & Visibilité",
    role: "Acquisition & Perception",
    author: "Parcours 02",
    quote:
      "Vos canaux d'acquisition attirent-ils les bonnes personnes avec une promesse cohérente ? Analyse de vos profils et réassurance multicanale.",
    defaultImage: "/images/audit-showcase.jpg",
    selectedImage: "/images/audit-showcase.jpg",
    points: [
      "Vérification des liens publics et link-in-bio",
      "Cohérence visuelle et éditoriale entre canaux",
      "Alignement entre vos contenus et vos offres clés",
    ],
    actionHref: "/audit/demande",
    actionSearch: { track: "marketing" },
    actionText: "Choisir le parcours Marketing",
  },
  {
    id: "sales",
    stat: "Ventes & Suivi Commercial",
    role: "Sales & Automation",
    author: "Parcours 03",
    quote:
      "Où vos prospects s'évaporent-ils entre leur première question et le devis signé ? Diagnostic des délais et des relances oubliées.",
    defaultImage: "/images/product-showcase.jpg",
    selectedImage: "/images/product-showcase.jpg",
    points: [
      "Cartographie des fuites de suivi et délais de réponse",
      "Protocole de relance WhatsApp & email automatisé",
      "Filtre de qualification des prospects entrants",
    ],
    actionHref: "/audit/demande",
    actionSearch: { track: "sales" },
    actionText: "Choisir le parcours Ventes & Suivi",
  },
  {
    id: "general",
    stat: "Diagnostic Transversal",
    role: "Vue d'ensemble Studio",
    author: "Parcours 04",
    quote:
      "Vous constatez un ralentissement commercial sans savoir quel pilier corriger en premier. Nous localisons le premier goulot d'étranglement.",
    defaultImage: "/images/audit-showcase.jpg",
    selectedImage: "/images/audit-showcase.jpg",
    points: [
      "Scan transversal des 5 leviers de maturité",
      "Identification du goulot d'étranglement numéro 1",
      "Plan d'action priorisé pour débloquer la croissance",
    ],
    actionHref: "/audit/demande",
    actionSearch: { track: "general" },
    actionText: "Choisir le Diagnostic Transversal",
  },
];

const FAQS = [
  {
    q: "Pourquoi cet audit est-il gratuit ?",
    a: "Parce que nous croyons à la valeur démontrée avant l'engagement. Cet audit est notre façon de vous montrer notre rigueur d'analyse sans risque pour vous. Si le diagnostic est pertinent, nous serons naturellement votre premier choix quand vous déciderez d'investir.",
  },
  {
    q: "Combien de temps prend la réalisation ?",
    a: "Chaque audit est livré sous 5 jours ouvrés à compter de la confirmation de votre adresse email. Pour préserver cette cadence et une attention humaine minutieuse, nous limitons strictement les demandes à 30 places par mois.",
  },
  {
    q: "Que se passe-t-il après réception du rapport ?",
    a: "Vous recevez un lien privé vers votre rapport interactif, incluant un scorecard de maturité, les 3 constats majeurs et 3 victoires rapides que vous pouvez appliquer en totale autonomie. Vous êtes libre de nous contacter pour un accompagnement, ou de mettre en œuvre les conseils par vous-même.",
  },
  {
    q: "Avez-vous besoin de mes identifiants ou mots de passe ?",
    a: "Jamais. Nous n'accédons à aucun compte privé, outil interne, compte publicitaire ou analytics. Nous analysons exclusivement les informations publiques de votre marque et les réponses que vous nous fournissez dans le questionnaire.",
  },
  {
    q: "Que se passe-t-il si les 30 places mensuelles sont épuisées ?",
    a: "Vous êtes automatiquement inscrit sur notre liste d'attente prioritaire. Votre dossier sera traité en priorité le mois suivant, dans l'ordre chronologique de soumission.",
  },
];

function AuditLandingPage() {
  const capacity = Route.useLoaderData();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="min-h-screen bg-forest-black text-paper flex flex-col font-sans selection:bg-mint selection:text-forest-black">
      <SiteHeader />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* SECTION 1: HERO WITH BEAMS MOTION (Dark, Luminous, Atmospheric)           */}
        {/* ========================================================================= */}
        <section className="relative min-h-[85vh] flex items-center justify-center pt-28 pb-20 px-6 sm:px-12 overflow-hidden border-b border-pine/30">
          <BeamsBackground
            className="absolute inset-0 size-full"
            intensity="subtle"
            tone="volka"
          >
            <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 pt-8">
              {/* Display Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-display text-4xl sm:text-6xl md:text-7xl font-light text-paper leading-[1.08] tracking-tight max-w-4xl mx-auto"
              >
                Identifier exactement où votre système{" "}
                <span className="italic font-normal text-mint">perd des clients</span>.
              </motion.h1>

              {/* Subparagraph */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-base sm:text-xl text-paper/85 max-w-2xl mx-auto font-normal leading-relaxed"
              >
                Un diagnostic écrit sans complaisance sur l'un de vos piliers commerciaux :
                ce qui fonctionne, ce qui bloque vos conversions, et quoi réparer en premier.
              </motion.p>

              {/* Capacity Counter Pill + SLA */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                {capacity.isOpen ? (
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-pine/70 border border-mint/35 text-paper text-sm font-medium backdrop-blur-md shadow-inner">
                    <span className="size-2 rounded-full bg-mint" />
                    <span>
                      <strong className="text-mint font-semibold">{capacity.remaining} places restantes</strong>{" "}
                      pour {capacity.monthName}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta/20 border border-terracotta text-paper text-sm font-medium backdrop-blur-md">
                    <AlertTriangle className="size-4 text-terracotta" />
                    <span>
                      Capacité atteinte pour {capacity.monthName} — <strong>Liste d'attente ouverte</strong>
                    </span>
                  </div>
                )}

                <div className="inline-flex items-center gap-2 text-xs text-paper/70 font-mono">
                  <Clock className="size-3.5 text-mint" />
                  <span>Délai garanti : {capacity.deliveryDays} jours ouvrés</span>
                </div>
              </motion.div>

              {/* CTA Action */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-8 py-6 text-base rounded-md shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
                >
                  <Link to="/audit/demande">
                    Demander mon audit gratuit
                    <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>

              {/* Reassurance Micro-Metrics with unified text-mint icon colors */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="pt-8 border-t border-pine/30 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-paper/70 max-w-3xl mx-auto"
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="size-4 text-mint shrink-0" />
                  <span>100% Gratuit & Privé</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="size-4 text-mint shrink-0" />
                  <span>Aucun identifiant requis</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Zap className="size-4 text-mint shrink-0" />
                  <span>3 Actions immédiates</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Lock className="size-4 text-mint shrink-0" />
                  <span>Rapport PDF exportable</span>
                </div>
              </motion.div>
            </div>
          </BeamsBackground>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: MÉTHODOLOGIE DU STUDIO (INSPO 6 CONNECTED CAROUSEL)            */}
        {/* Crisp Warm Paper (#FEFFF1) background for maximum contrast & dynamism     */}
        {/* ========================================================================= */}
        <section className="py-24 px-6 sm:px-12 bg-paper text-forest-black border-b border-pine/15 overflow-hidden">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Editorial Section Header */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs uppercase tracking-widest text-ochre font-semibold font-mono">
                Méthodologie du Studio
              </span>
              <h2 className="font-display text-3xl sm:text-5xl text-forest-black font-light tracking-tight">
                Choisissez le goulot d'étranglement à débloquer
              </h2>
              <p className="text-forest-black/70 text-base leading-relaxed">
                Chaque diagnostic combine une analyse technique automatisée de premier niveau et une revue stratégique humaine approfondie.
              </p>
            </div>

            {/* Inspo 6 Connected Carousel Component */}
            <ConnectedCarousel
              items={METHODOLOGY_ITEMS}
              autoPlayInterval={6500}
              pauseOnHover={true}
            />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: FAQ ACCORDION (Warm Ivory Surface #FCF5EB)                     */}
        {/* ========================================================================= */}
        <section className="py-24 px-6 sm:px-12 bg-ivory text-forest-black">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-widest text-ochre font-semibold font-mono">
                Questions Fréquentes
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-forest-black font-light">
                Tout ce que vous devez savoir
              </h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="bg-paper border border-pine/15 rounded-lg overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 text-forest-black hover:text-forest transition-colors cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-semibold">{faq.q}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-forest" : "text-forest-black/50"
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 text-xs sm:text-sm text-forest-black/75 leading-relaxed border-t border-pine/10 pt-3">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Bottom Final CTA */}
            <div className="pt-8 text-center space-y-4">
              <Button
                asChild
                size="lg"
                className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-10 py-6 text-base rounded-md shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <Link to="/audit/demande">
                  Demander mon diagnostic gratuit
                  <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <p className="text-xs text-forest-black/60">
                30 places par mois · Traitement sous 5 jours ouvrés · Sans engagement
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
