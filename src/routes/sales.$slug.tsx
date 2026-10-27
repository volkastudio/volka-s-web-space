import * as React from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import {
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Globe,
  CreditCard,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      { property: "og:title", content: loaderData?.title ?? "Volka Studio" },
      { property: "og:description", content: loaderData?.headline ?? "" },
    ],
  }),
  component: SalesProductPage,
});

function SalesProductPage() {
  const product = Route.useLoaderData() as DigitalProductWithRegions;
  const search = Route.useSearch() as { src?: string };
  const sourceTag = search.src;

  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [redirecting, setRedirecting] = React.useState<string | null>(null);

  // Region click handler
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
    // Record event
    trackProductCta({ data: { slug: product.slug } }).catch(() => {});

    // If only 1 region is available, redirect directly
    if (product.regions.length === 1 && product.regions[0]) {
      await handleSelectRegion(product.regions[0].region_key);
      return;
    }

    // Open region selector modal
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-forest-black text-paper font-sans flex flex-col justify-between selection:bg-mint selection:text-forest-black">
      {/* DISTRACTION-FREE HEADER */}
      <header className="py-6 px-6 sm:px-12 border-b border-pine/30 flex items-center justify-between">
        <a
          href="/"
          className="font-display text-2xl tracking-tight text-paper hover:text-mint transition-colors font-medium"
        >
          VOLKA
        </a>

        {/* Discrete Language Switcher */}
        <div className="flex items-center gap-1.5 text-xs text-mint/80 font-mono">
          <span className="text-paper font-semibold">FR</span>
          <span>·</span>
          <span className="opacity-60 cursor-not-allowed">EN</span>
        </div>
      </header>

      {/* MAIN SALES CONTENT */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 sm:py-16 space-y-12">
        {/* Editorial Headline in Cormorant Garamond */}
        <div className="space-y-4 text-center sm:text-left">
          <span className="text-xs uppercase tracking-widest text-ochre font-semibold">
            {product.title}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-paper font-light leading-tight">
            {product.headline}
          </h1>
        </div>

        {/* Cover visual if available */}
        {product.cover_image && (
          <div className="rounded-lg overflow-hidden border border-pine/40 shadow-2xl aspect-video bg-pine/30">
            <img
              src={product.cover_image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Value Proposition Description */}
        <div className="prose prose-invert max-w-none text-mint/90 text-base leading-relaxed">
          <p>{product.description}</p>
        </div>

        {/* Features Bullet Points ("Ce que vous obtenez") */}
        {product.features.length > 0 && (
          <div className="p-6 sm:p-8 rounded-lg bg-pine/30 border border-pine/60 space-y-4 shadow-sm">
            <h2 className="font-display text-2xl text-paper font-medium">
              Ce que vous obtenez immédiatement :
            </h2>
            <ul className="space-y-3">
              {product.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-paper/90">
                  <div className="p-0.5 rounded-full bg-mint/20 text-mint shrink-0 mt-0.5">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Primary CTA (Desktop & Inline) */}
        <div className="pt-2 text-center">
          <Button
            size="lg"
            onClick={handleCtaClick}
            className="w-full sm:w-auto bg-ochre hover:bg-ochre/90 text-forest-black font-semibold text-base px-10 py-6 rounded-md shadow-xl transition-all duration-200 active:scale-95"
          >
            Obtenir maintenant
            <ArrowRight className="ml-2 size-5" />
          </Button>
          <p className="text-xs text-mint/60 pt-3">
            Accès instantané après validation sécurisée sur la plateforme partenaire.
          </p>
        </div>

        {/* Collapsible FAQ Accordion */}
        {product.faq.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-pine/30">
            <h3 className="font-display text-2xl text-paper font-light">
              Questions fréquentes
            </h3>
            <div className="space-y-2.5">
              {product.faq.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-pine/20 border border-pine/50 rounded-md overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 text-paper hover:text-mint transition-colors text-sm font-medium"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform ${
                          isOpen ? "rotate-180 text-mint" : "text-mint/60"
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-paper/80 leading-relaxed border-t border-pine/20 pt-2.5">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reassurance Footer */}
        <div className="p-4 rounded-md bg-pine/10 border border-pine/20 text-center text-xs text-mint/70 space-y-1">
          <ShieldCheck className="size-4 text-mint mx-auto mb-1" />
          <p>Paiement sécurisé chiffré SSL opéré par nos plateformes certifiées.</p>
          <p>Aucun abonnement caché. Accès à vie aux fichiers et mises à jour.</p>
        </div>
      </main>

      {/* MOBILE STICKY BOTTOM BAR (< 640px) */}
      <div className="sm:hidden sticky bottom-0 z-40 bg-forest-black/95 backdrop-blur-md border-t border-pine/40 p-4 shadow-2xl">
        <Button
          size="lg"
          onClick={handleCtaClick}
          className="w-full bg-ochre hover:bg-ochre/90 text-forest-black font-semibold text-base py-6 rounded-md shadow-lg"
        >
          Obtenir maintenant
          <ArrowRight className="ml-2 size-5" />
        </Button>
      </div>

      {/* INLINE REGION QUESTION MODAL ("Où habitez-vous ?") */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-forest-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => !redirecting && setModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md bg-pine border border-mint/40 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl text-paper z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-ochre font-semibold">
                  Accès à la boutique
                </span>
                <h3 className="font-display text-2xl text-paper">
                  Où habitez-vous ?
                </h3>
              </div>

              {!redirecting && (
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-paper/60 hover:text-paper hover:bg-pine/80"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>

            <p className="text-xs text-mint/90 leading-relaxed">
              Nous vous redirigeons vers la plateforme de paiement sécurisée adaptée à vos moyens de paiement locaux (Carte bancaire ou Mobile Money).
            </p>

            {/* Region Option Cards (min 56px height for touch targets) */}
            <div className="space-y-3 pt-2">
              {product.regions.map((region) => {
                const isRedirectingThis = redirecting === region.region_key;
                const isAfrica = region.region_key.toLowerCase().includes("afri");

                return (
                  <button
                    key={region.id}
                    type="button"
                    disabled={Boolean(redirecting)}
                    onClick={() => handleSelectRegion(region.region_key)}
                    className="w-full min-h-[56px] p-4 rounded-lg bg-forest-black/70 hover:bg-forest-black border border-pine/80 hover:border-mint transition-all flex items-center justify-between text-left group cursor-pointer disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-pine text-mint">
                        {isAfrica ? (
                          <Smartphone className="size-5" />
                        ) : (
                          <CreditCard className="size-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-paper group-hover:text-mint transition-colors">
                          {region.label_fr}
                        </div>
                        <div className="text-[11px] text-paper/60">
                          {isAfrica
                            ? "Mobile Money (MTN, Moov, Orange, Wave) & Carte"
                            : "Carte bancaire, Apple Pay & Google Pay"}
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
              <p className="text-center text-xs text-mint font-medium animate-pulse">
                Redirection vers la boutique sécurisée...
              </p>
            )}
          </div>
        </div>
      )}

      {/* MINIMAL FOOTER */}
      <footer className="py-6 px-6 sm:px-12 border-t border-pine/30 text-center text-xs text-mint/60">
        <p>© {new Date().getFullYear()} Volka Studio. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
