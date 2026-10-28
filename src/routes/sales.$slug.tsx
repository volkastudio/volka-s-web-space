import * as React from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
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
  head: ({ loaderData }) => {
    const title = `${loaderData?.title ?? "Produit"} — Volka Studio`;
    const description = loaderData?.description || loaderData?.headline || "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        {
          property: "og:image",
          content: loaderData?.cover_image || "/images/product-showcase.jpg",
        },
      ],
    };
  },
  component: SalesProductPage,
});

// ---------------------------------------------------------------------------
// Soft moving waves (single colour, very low opacity).
// Pure SVG + CSS transform: no JS animation, no blur filter, cheap on low-end phones.
// Each line is a sum of sines whose periods divide the tile width, so the loop is seamless.
// ---------------------------------------------------------------------------
const WAVE_TILE = 1200; // one seamless period, in viewBox units
const WAVE_VIEW_W = WAVE_TILE * 2;
const WAVE_VIEW_H = 800;

function buildWavePath(base: number, amp: number, phase: number, harmonic: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= WAVE_VIEW_W; x += 24) {
    const t = (2 * Math.PI * x) / WAVE_TILE;
    const y = base + amp * Math.sin(t + phase) + amp * 0.4 * Math.sin(harmonic * t + phase * 1.7);
    pts.push(`${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

const WAVE_LAYERS = [
  {
    duration: 70,
    lines: [
      { base: 250, amp: 70, phase: 0.2, harmonic: 2 },
      { base: 300, amp: 80, phase: 0.8, harmonic: 2 },
      { base: 350, amp: 90, phase: 1.4, harmonic: 3 },
    ],
  },
  {
    duration: 48,
    lines: [
      { base: 480, amp: 70, phase: 2.2, harmonic: 2 },
      { base: 540, amp: 85, phase: 2.9, harmonic: 3 },
      { base: 600, amp: 75, phase: 3.6, harmonic: 2 },
    ],
  },
].map((layer) => ({
  duration: layer.duration,
  paths: layer.lines.map((l) => buildWavePath(l.base, l.amp, l.phase, l.harmonic)),
}));

function WaveBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden text-mint"
      style={{
        maskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 35%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 50%, black 35%, transparent 100%)",
      }}
    >
      <style>{`
        @keyframes volka-wave-drift { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @media (prefers-reduced-motion: reduce) { .volka-wave { animation: none !important; } }
      `}</style>

      {/* Faint colour wash behind the content */}
      <div className="absolute left-1/2 top-1/2 size-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/[0.04] blur-3xl" />

      {WAVE_LAYERS.map((layer, i) => (
        <svg
          key={i}
          className="volka-wave absolute inset-y-0 left-0 h-full"
          style={{
            // two tiles wide, never narrower than 1800px, so waves keep their shape on phones
            width: "max(200%, 1800px)",
            animation: `volka-wave-drift ${layer.duration}s linear infinite`,
            willChange: "transform",
          }}
          viewBox={`0 0 ${WAVE_VIEW_W} ${WAVE_VIEW_H}`}
          preserveAspectRatio="none"
          fill="none"
        >
          {layer.paths.map((d, j) => (
            <g key={j} stroke="currentColor" strokeLinecap="round" vectorEffect="non-scaling-stroke">
              {/* wide, faint stroke = soft glow instead of a blur filter */}
              <path d={d} strokeWidth={44} opacity={0.02} vectorEffect="non-scaling-stroke" />
              <path d={d} strokeWidth={26} opacity={0.03} vectorEffect="non-scaling-stroke" />
              <path d={d} strokeWidth={12} opacity={0.04} vectorEffect="non-scaling-stroke" />
              <path d={d} strokeWidth={4} opacity={0.05} vectorEffect="non-scaling-stroke" />
              <path d={d} strokeWidth={1.25} opacity={0.11} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
      ))}
    </div>
  );
}

function SalesProductPage() {
  const product = Route.useLoaderData() as DigitalProductWithRegions;
  const search = Route.useSearch() as { src?: string };
  const sourceTag = search.src;

  const [choosing, setChoosing] = React.useState(false);
  const [redirecting, setRedirecting] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);

  const tracked = React.useRef(false);

  const goToRegion = async (regionKey: string) => {
    setError(false);
    setRedirecting(regionKey);
    try {
      const res = await getRegionRedirectUrl({
        data: { slug: product.slug, regionKey, sourceTag },
      });
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      throw new Error("No redirect URL");
    } catch (err) {
      console.error("Redirect error:", err);
      setRedirecting(null);
      setError(true);
    }
  };

  const handleCtaClick = () => {
    if (!tracked.current) {
      tracked.current = true;
      trackProductCta({ data: { slug: product.slug } }).catch(() => {});
    }

    // Single region configured: no question, go straight to the checkout.
    if (product.regions.length === 1 && product.regions[0]) {
      void goToRegion(product.regions[0].region_key);
      return;
    }

    setChoosing(true);
  };

  const blurb = product.description || product.headline;
  const noRegions = product.regions.length === 0;

  return (
    <div className="relative isolate min-h-screen flex flex-col overflow-hidden bg-forest-black text-paper font-sans selection:bg-mint selection:text-forest-black">
      <WaveBackground />
      <header className="relative z-10 px-6 sm:px-10 py-5">
        <a
          href="/"
          className="inline-flex items-center gap-2.5 font-display text-xl tracking-tight text-paper hover:text-mint transition-colors"
        >
          <img src="/volka-icon-light.png" alt="" className="size-6 object-contain" />
          <span>VOLKA</span>
        </a>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl font-light leading-[1.1] tracking-tight text-balance">
              {product.title}
            </h1>
            {blurb && (
              <p className="text-base sm:text-lg text-paper/75 leading-relaxed text-pretty whitespace-pre-line">
                {blurb}
              </p>
            )}
          </div>

          {noRegions ? (
            <p className="text-sm text-paper/60">
              Ce produit n'est pas encore disponible. Revenez bientôt.
            </p>
          ) : !choosing ? (
            <button
              type="button"
              onClick={handleCtaClick}
              disabled={Boolean(redirecting)}
              className="inline-flex w-full sm:w-auto min-h-14 items-center justify-center gap-2 rounded-full bg-ochre px-10 text-base font-semibold text-forest-black transition hover:bg-ochre/90 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {redirecting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  Obtenir
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-lg font-medium">Où habitez-vous ?</p>
              <div className="flex flex-col gap-3">
                {product.regions.map((region) => {
                  const isThis = redirecting === region.region_key;
                  return (
                    <button
                      key={region.id}
                      type="button"
                      disabled={Boolean(redirecting)}
                      onClick={() => void goToRegion(region.region_key)}
                      className="flex w-full min-h-14 items-center justify-center gap-2 rounded-full border border-paper/25 bg-paper/5 px-6 text-base font-medium text-paper transition hover:border-ochre hover:bg-paper/10 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                      {isThis ? <Loader2 className="size-5 animate-spin" /> : region.label_fr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-ochre">
              Le lien n'a pas pu s'ouvrir. Réessayez dans un instant.
            </p>
          )}
        </div>
      </main>

      <footer className="relative z-10 px-6 py-5 text-center text-xs text-paper/40">
        © {new Date().getFullYear()} Volka Studio
      </footer>
    </div>
  );
}
