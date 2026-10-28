import * as React from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  CreditCard,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Loader2,
  X,
  Sparkles,
  Lock,
  Download,
  BookOpen,
  Zap,
  Globe2,
  PackageCheck,
  Layers,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeamsBackground } from "@/components/ui/beams-background";
import { Globe } from "@/components/ui/globe";
import { CarouselStacked, type StackedSlide } from "@/components/ui/carousel-stacked";
import {
  getPublicProduct,
  trackProductCta,
  getRegionRedirectUrl,
} from "@/lib/sales/sales.functions";
import type { DigitalProductWithRegions } from "@/lib/sales/sales.server";

const searchSchema = z.object({
  src: z.string().optional(),
});

export const Route = createFileRoute("/sales/$slug")({
  validateSearch: searchSchema,
  loader: async ({ params }) => {
    const product = await getPublicProduct({ data: { slug: params.slug } });
    if (!product) {
      throw notFound();
    }
    return product;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Produit"} — Volka Studio` },
      { name: "description", content: loaderData?.headline ?? "" },
      { property: "og:title", content: `${loaderData?.title ?? "Produit"} — Volka Studio` },
      { property: "og:description", content: loaderData?.headline ?? "" },
      {
        property: "og:image",
        content: loaderData?.cover_image || "/images/product-showcase.jpg",
      },
    ],
  }),
  component: SalesProductPage,
});

const DEFAULT_COVER_FALLBACKS = [
  "/images/product-showcase.jpg",
  "/images/audit-showcase.jpg",
  "/images/product-showcase.jpg",
  "/images/audit-showcase.jpg",
];

function SalesProductPage() {
  const product = Route.useLoaderData() as DigitalProductWithRegions;
  const search = Route.useSearch() as { src?: string };
  const sourceTag = search.src;

  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [redirecting, setRedirecting] = React.useState<string | null>(null);
  const [selectedRegionKey, setSelectedRegionKey] = React.useState<"europe" | "afrique" | null>(null);

  // Region redirect handler
  const handleSelectRegion = async (regionKey: string) => {
    setRedirecting(regionKey);
    try {
      const res = await getRegionRedirectUrl({
        data: {
          slug: product.slug,
          regionKey,
          sourceTag,
        },
      });

      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err) {
      console.error("Redirect error:", err);
      setRedirecting(null);
    }
  };

  const handleCtaClick = async () => {
    // Fire analytics tracking event asynchronously
    trackProductCta({ data: { slug: product.slug } }).catch(() => {});

    // If only 1 region is configured, bypass modal and redirect directly
    if (product.regions.length === 1 && product.regions[0]) {
      await handleSelectRegion(product.regions[0].region_key);
      return;
    }

    // Otherwise show region question modal
    setModalOpen(true);
  };

  const coverImageUrl = product.cover_image || "/images/product-showcase.jpg";

  // Build Inspo 5 Stacked Cards slides from product features
  const stackedSlides: StackedSlide[] = React.useMemo(() => {
    const rawFeatures =
      product.features && product.features.length > 0
        ? product.features
        : [
            "Playbook d'exécution complet : Protocoles et étapes détaillées sans théorie superflue",
            "Templates & Fichiers opérationnels : Fiches prêtes à dupliquer dans votre environnement de travail",
            "Scripts & Modèles de relance : Formules testées pour accélérer vos conversions clients",
            "Guide de déploiement 48h : Checklist claire pour passer à l'action sans délai",
          ];

    return rawFeatures.map((item, idx) => {
      const hasColon = item.includes(":");
      const title = hasColon ? item.split(":")[0]?.trim() || item : item;
      const desc = hasColon
        ? item.split(":")[1]?.trim() || "Ressource opérationnelle conçue pour une application immédiate dans vos activités."
        : "Composant opérationnel calibré pour apporter un levier mesurable sans surcharge technique.";

      return {
        id: `deliverable-${idx}`,
        title,
        description: desc,
        badge: `Module 0${idx + 1}`,
        metric: "Inclus dans la suite",
        image: DEFAULT_COVER_FALLBACKS[idx % DEFAULT_COVER_FALLBACKS.length] || coverImageUrl,
      };
    });
  }, [product.features, coverImageUrl]);

  return (
    <div className="min-h-screen bg-forest-black text-paper font-sans flex flex-col justify-between selection:bg-mint selection:text-forest-black pb-16 sm:pb-0">
      {/* ========================================================================= */}
      {/* DISTRACTION-FREE HEADER                                                   */}
      {/* ========================================================================= */}
      <header className="py-4 px-6 sm:px-12 border-b border-pine/30 flex items-center justify-between backdrop-blur-md bg-forest-black/85 sticky top-0 z-30">
        <a
          href="/"
          className="font-display text-2xl tracking-tight text-paper hover:text-mint transition-colors font-medium flex items-center gap-2.5"
        >
          <img src="/volka-icon-light.png" alt="" className="size-6 object-contain" />
          <span>VOLKA</span>
          <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-pine text-mint border border-pine/50">
            Édition Studio
          </span>
        </a>

        {/* Discreet Language Switcher */}
        <div className="flex items-center gap-2 text-xs text-mint/80 font-mono">
          <span className="text-paper font-semibold px-2 py-0.5 rounded bg-pine/60">FR</span>
          <span className="text-paper/30">·</span>
          <span className="opacity-40 cursor-not-allowed">EN</span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: HERO WITH BEAMS MOTION + EDITORIAL SHOWCASE (Inspo 1 & 4)      */}
      {/* ========================================================================= */}
      <section className="relative pt-12 sm:pt-16 pb-20 px-6 sm:px-12 overflow-hidden border-b border-pine/30">
        <BeamsBackground
          className="absolute inset-0 size-full"
          intensity="subtle"
          tone="volka"
        >
          <div className="relative z-10 max-w-5xl mx-auto space-y-10 sm:space-y-12">
            {/* Top Eyebrow & Display Typography */}
            <div className="text-center max-w-3xl mx-auto space-y-5">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-black/85 border border-mint/30 text-mint text-xs uppercase tracking-widest font-semibold backdrop-blur-md shadow-lg"
              >
                <Sparkles className="size-3 text-ochre" />
                <span>Ressource Studio Volka</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-3xl sm:text-5xl lg:text-6xl text-paper font-light leading-[1.12] tracking-tight text-balance"
              >
                {product.headline || product.title}
              </motion.h1>

              {product.description && (
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-base sm:text-lg text-paper/85 font-normal leading-relaxed max-w-2xl mx-auto text-pretty"
                >
                  {product.description}
                </motion.p>
              )}
            </div>

            {/* Editorial Showcase Media Mockup with Floating Badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-pine/40 shadow-2xl bg-pine/20 group relative"
            >
              <img
                src={coverImageUrl}
                alt={product.title}
                className="w-full h-auto aspect-video object-cover transform transition-transform duration-700 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-black/85 via-forest-black/20 to-transparent pointer-events-none" />

              {/* Floating Reassurance Pills on Cover */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 text-xs text-paper backdrop-blur-md bg-forest-black/75 p-3.5 sm:p-4 rounded-xl border border-pine/40 shadow-xl">
                <div className="flex items-center gap-2">
                  <Download className="size-4 text-mint shrink-0" />
                  <span className="font-medium">Accès immédiat post-règlement</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-mint shrink-0" />
                  <span className="font-medium">Playbooks & Fichiers opérationnels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-mint shrink-0" />
                  <span className="font-medium">Règlement sécurisé multi-plateforme</span>
                </div>
              </div>
            </motion.div>

            {/* Desktop Hero CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-center pt-2 space-y-3"
            >
              <Button
                size="lg"
                onClick={handleCtaClick}
                className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold text-base sm:text-lg px-10 py-6 sm:py-7 rounded-md shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer inline-flex items-center"
              >
                <span>Obtenir maintenant</span>
                <ArrowRight className="ml-2.5 size-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <p className="text-xs text-mint/75 font-mono">
                Tarification et modalité de paiement confirmées sur la boutique sécurisée selon votre région.
              </p>
            </motion.div>
          </div>
        </BeamsBackground>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: CRISP WARM PAPER (#FEFFF1) - DYNAMIC 3D STACKED CARDS (Inspo 5) */}
      {/* BREAKS THE MONOCHROME GREEN: LIGHT BACKGROUND, HIGH READABILITY & MOTION    */}
      {/* ========================================================================= */}
      <section className="py-24 px-6 sm:px-12 bg-paper text-forest-black border-b border-pine/15 overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-ochre font-semibold font-mono">
              Contenu & Livrables
            </span>
            <h2 className="font-display text-3xl sm:text-5xl text-forest-black font-light tracking-tight">
              Ce que vous obtenez immédiatement
            </h2>
            <p className="text-forest-black/75 text-sm sm:text-base leading-relaxed">
              Explorez les modules de cette suite. Tout est conçu pour être déployé dans vos opérations sans théorie superflue.
            </p>
          </div>

          {/* Inspo 5: Dynamic 3D Stacked Cards Deck */}
          <CarouselStacked slides={stackedSlides} />

          {/* 3-Column Micro-Features Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-pine/15">
            <div className="p-5 rounded-xl bg-ivory border border-pine/15 shadow-xs flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-forest text-mint shrink-0 mt-0.5">
                <PackageCheck className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-forest-black">Fichiers directement éditables</h4>
                <p className="text-xs text-forest-black/70 leading-relaxed">
                  Formats universels (Notion, PDF, tableurs, scripts) prêts à être intégrés dans vos outils existants.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-ivory border border-pine/15 shadow-xs flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-forest text-mint shrink-0 mt-0.5">
                <Layers className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-forest-black">Licence d'usage perpétuelle</h4>
                <p className="text-xs text-forest-black/70 leading-relaxed">
                  Accès illimité pour vous et votre équipe interne, avec les futures révisions mineures incluses.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-ivory border border-pine/15 shadow-xs flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-forest text-mint shrink-0 mt-0.5">
                <FileCheck className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-forest-black">Testé en conditions réelles</h4>
                <p className="text-xs text-forest-black/70 leading-relaxed">
                  Chaque matrice est issue de nos missions de conseil et d'accompagnement studio sur le terrain.
                </p>
              </div>
            </div>
          </div>

          {/* Editorial Quality Callout */}
          <div className="p-6 sm:p-7 rounded-xl bg-forest text-paper space-y-2.5 shadow-md">
            <div className="flex items-center gap-2 text-mint font-semibold text-xs uppercase tracking-wider font-mono">
              <Zap className="size-4 text-ochre" />
              <span>Garantie de pertinence opérationnelle</span>
            </div>
            <p className="text-sm text-paper/85 leading-relaxed">
              Pas de contenu générique ni de promesses extravagantes : des systèmes précis, calibrés pour structurer vos opérations et débloquer vos conversions.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: WARM IVORY SURFACE (#FCF5EB) - FAQ & REASSURANCE               */}
      {/* ========================================================================= */}
      <section className="py-20 px-6 sm:px-12 bg-ivory text-forest-black flex-1">
        <div className="max-w-3xl mx-auto space-y-12">
          {product.faq && product.faq.length > 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs uppercase tracking-widest text-ochre font-semibold font-mono">
                  Transparence
                </span>
                <h3 className="font-display text-3xl sm:text-4xl text-forest-black font-light">
                  Questions fréquentes
                </h3>
              </div>

              <div className="space-y-3">
                {product.faq.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-paper border border-pine/15 rounded-lg overflow-hidden shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-forest-black hover:text-forest transition-colors text-sm font-semibold cursor-pointer"
                      >
                        <span>{item.q}</span>
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
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-forest-black/75 leading-relaxed border-t border-pine/10">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Pre-Checkout Action */}
          <div className="p-8 rounded-2xl bg-forest text-paper text-center space-y-6 shadow-xl border border-pine/40">
            <div className="space-y-2 max-w-lg mx-auto">
              <h4 className="font-display text-2xl sm:text-3xl font-light">
                Prêt à intégrer ces outils ?
              </h4>
              <p className="text-xs sm:text-sm text-paper/80 leading-relaxed">
                Paiement direct sécurisé avec vos moyens de paiement habituels (Mobile Money en Afrique, Carte bancaire / Apple Pay à l'international).
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleCtaClick}
              className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold text-base px-10 py-6 rounded-md shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              Obtenir maintenant
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* REGION SELECTION MODAL ("OÙ HABITEZ-VOUS ?") WITH 3D GLOBE (Inspo 2 & 3)   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-forest-black/80 backdrop-blur-md"
              onClick={() => !redirecting && setModalOpen(false)}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg bg-pine border border-mint/40 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl text-paper z-10 overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest text-ochre font-semibold font-mono flex items-center gap-1.5">
                    <Globe2 className="size-3.5" />
                    Accès à la boutique adaptée
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl text-paper font-light">
                    Où habitez-vous ?
                  </h3>
                </div>

                {!redirecting && (
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    aria-label="Fermer"
                    className="p-1.5 rounded-full text-paper/60 hover:text-paper hover:bg-forest transition-colors cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>

              {/* Interactive 3D Mini Globe Preview */}
              <div className="relative h-32 w-full flex items-center justify-center overflow-hidden rounded-xl bg-forest-black/60 border border-pine/50">
                <Globe
                  className="size-48 max-w-[190px] -my-8"
                  highlightRegion={selectedRegionKey}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-2 text-[10px] font-mono uppercase tracking-widest text-mint/80">
                  Routage géographique automatique
                </span>
              </div>

              <p className="text-xs sm:text-sm text-mint/90 leading-relaxed">
                Choisissez votre zone géographique pour accéder directement à la plateforme adaptée sans frais de change.
              </p>

              {/* Region Option Cards (min 56px height for touch targets) */}
              <div className="space-y-3 pt-1">
                {product.regions.map((region) => {
                  const isRedirectingThis = redirecting === region.region_key;
                  const isAfrica = region.region_key.toLowerCase().includes("afri");

                  return (
                    <button
                      key={region.id}
                      type="button"
                      disabled={Boolean(redirecting)}
                      onMouseEnter={() => setSelectedRegionKey(isAfrica ? "afrique" : "europe")}
                      onClick={() => handleSelectRegion(region.region_key)}
                      className="w-full min-h-[64px] p-4 rounded-xl bg-forest-black/80 hover:bg-forest-black border border-pine hover:border-mint transition-all flex items-center justify-between text-left group cursor-pointer disabled:opacity-60 shadow-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-lg bg-pine text-mint group-hover:bg-mint group-hover:text-forest transition-colors">
                          {isAfrica ? (
                            <Smartphone className="size-5" />
                          ) : (
                            <CreditCard className="size-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-paper group-hover:text-mint transition-colors">
                            {region.label_fr}
                          </div>
                          <div className="text-[11px] text-paper/65 pt-0.5 font-mono">
                            {isAfrica
                              ? "Mobile Money (MTN, Moov, Orange, Wave) & Carte locale"
                              : "Carte bancaire, Apple Pay & Google Pay (Whop)"}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isRedirectingThis ? (
                          <Loader2 className="size-5 text-mint animate-spin" />
                        ) : (
                          <ExternalLink className="size-4 text-paper/40 group-hover:text-mint transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {redirecting && (
                <div className="flex items-center justify-center gap-2 text-xs text-mint font-medium animate-pulse pt-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Redirection vers la plateforme de règlement sécurisée...</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* STICKY BOTTOM BAR ON MOBILE (< 640px)                                     */}
      {/* ========================================================================= */}
      <div className="fixed sm:hidden bottom-0 inset-x-0 z-40 bg-forest-black/95 backdrop-blur-lg border-t border-pine/50 p-3 px-4 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-paper truncate">{product.title}</div>
          <div className="text-[10px] text-mint font-mono">Accès immédiat</div>
        </div>
        <Button
          size="sm"
          onClick={handleCtaClick}
          className="bg-ochre hover:bg-ochre/90 text-forest-black font-semibold text-xs px-5 py-2.5 rounded-md shrink-0 shadow-md cursor-pointer"
        >
          Obtenir
          <ArrowRight className="ml-1 size-3.5" />
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* MINIMAL FOOTER                                                            */}
      {/* ========================================================================= */}
      <footer className="py-6 px-6 sm:px-12 border-t border-pine/30 text-center text-xs text-mint/60 bg-forest-black">
        <p>© {new Date().getFullYear()} Volka Studio. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
