import * as React from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { WaveBackground } from "@/components/wave-background";
import {
  getPublicProduct,
  trackProductCta,
  getRegionRedirectUrl,
  captureContact,
} from "@/lib/sales/sales.functions";
import type { DigitalProductWithRegions } from "@/lib/sales/sales.server";

const searchSchema = z.object({
  src: z.string().optional(),
});

export const Route = createFileRoute("/tools/$slug")({
  validateSearch: searchSchema,
  loader: async ({ params }) => {
    const product = await getPublicProduct({ data: { slug: params.slug } });
    if (!product) {
      throw notFound();
    }
    return product;
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.title ?? "Outil digital"} — Volka Studio`;
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
  component: ToolsProductPage,
});

type Step = "start" | "region" | "email";

const primaryButton =
  "inline-flex w-full sm:w-auto min-h-14 items-center justify-center gap-2 rounded-full bg-ochre px-10 text-base font-semibold text-forest-black transition hover:bg-ochre/90 active:scale-[0.98] disabled:opacity-70 cursor-pointer";
const submitButton = primaryButton.replace("sm:w-auto", "sm:w-full");
const optionButton =
  "flex w-full min-h-14 items-center justify-center gap-2 rounded-full border border-paper/25 bg-paper/5 px-6 text-base font-medium text-paper transition hover:border-ochre hover:bg-paper/10 active:scale-[0.98] disabled:opacity-60 cursor-pointer";
const inputClass =
  "w-full min-h-14 rounded-2xl border border-paper/25 bg-paper/5 px-5 text-base text-paper placeholder:text-paper/40 focus:border-ochre focus:outline-none";

function ToolsProductPage() {
  const product = Route.useLoaderData() as DigitalProductWithRegions;
  const search = Route.useSearch() as { src?: string };
  const sourceTag = search.src;
  const config = product.page_config;
  const capture = config.capture;

  const [step, setStep] = React.useState<Step>("start");
  const [chosenRegion, setChosenRegion] = React.useState<string | null>(null);
  const [redirecting, setRedirecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [consent, setConsent] = React.useState(false);

  const tracked = React.useRef(false);

  const redirectToRegion = async (regionKey: string) => {
    setError(null);
    setRedirecting(true);
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
      setRedirecting(false);
      setError("Le lien n'a pas pu s'ouvrir. Réessayez dans un instant.");
    }
  };

  // After the region is known: ask for the email (if enabled) or go straight to the checkout.
  const continueWithRegion = (regionKey: string) => {
    setChosenRegion(regionKey);
    if (capture.mode !== "off") {
      setStep("email");
      return;
    }
    void redirectToRegion(regionKey);
  };

  const handleCtaClick = () => {
    if (!tracked.current) {
      tracked.current = true;
      trackProductCta({ data: { slug: product.slug } }).catch(() => {});
    }

    // Single region configured: no question.
    if (product.regions.length === 1 && product.regions[0]) {
      continueWithRegion(product.regions[0].region_key);
      return;
    }
    setStep("region");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenRegion) return;

    const trimmed = email.trim();
    const looksValid = /^\S+@\S+\.\S+$/.test(trimmed);

    if (capture.mode === "required" && !looksValid) {
      setError("Entrez une adresse email valide pour continuer.");
      return;
    }

    setError(null);
    if (looksValid) {
      setRedirecting(true);
      // Never block access: redirect regardless of background capture result
      await captureContact({
        data: {
          slug: product.slug,
          regionKey: chosenRegion,
          email: trimmed,
          name: capture.ask_name && name.trim() ? name.trim() : undefined,
          marketingConsent: consent,
          sourceTag,
        },
      }).catch(() => undefined);
    }
    await redirectToRegion(chosenRegion);
  };

  const goBack = () => {
    setError(null);
    if (step === "email") {
      setStep(product.regions.length > 1 ? "region" : "start");
    } else {
      setStep("start");
    }
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
              Ce contenu n'est pas encore disponible. Revenez bientôt.
            </p>
          ) : step === "start" ? (
            <button
              type="button"
              onClick={handleCtaClick}
              disabled={redirecting}
              className={primaryButton}
            >
              {redirecting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  {config.cta_label}
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>
          ) : step === "region" ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-lg font-medium">{config.region_question}</p>
                {config.region_hint && (
                  <p className="text-sm text-paper/60">{config.region_hint}</p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {product.regions.map((region) => (
                  <button
                    key={region.id}
                    type="button"
                    disabled={redirecting}
                    onClick={() => continueWithRegion(region.region_key)}
                    className={optionButton}
                  >
                    {redirecting && chosenRegion === region.region_key ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      region.label_fr
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} noValidate className="space-y-4 text-left">
              <div className="space-y-1 text-center">
                <p className="text-lg font-medium">{capture.title}</p>
                {capture.subtitle && <p className="text-sm text-paper/60">{capture.subtitle}</p>}
              </div>

              {capture.ask_name && (
                <input
                  type="text"
                  name="name"
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre prénom"
                  aria-label="Votre prénom"
                  className={inputClass}
                />
              )}

              <input
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={capture.email_label}
                aria-label={capture.email_label}
                required={capture.mode === "required"}
                className={inputClass}
              />

              {capture.consent_label && (
                <label className="flex items-start gap-3 text-sm text-paper/75 leading-snug cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 size-5 shrink-0 accent-ochre"
                  />
                  <span>{capture.consent_label}</span>
                </label>
              )}

              <button type="submit" disabled={redirecting} className={submitButton}>
                {redirecting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    {capture.button_label}
                    <ArrowRight className="size-5" />
                  </>
                )}
              </button>

              {capture.mode === "optional" && (
                <div className="text-center">
                  <button
                    type="button"
                    disabled={redirecting}
                    onClick={() => chosenRegion && void redirectToRegion(chosenRegion)}
                    className="min-h-11 px-4 text-sm text-paper/60 underline underline-offset-4 hover:text-paper cursor-pointer"
                  >
                    {capture.skip_label}
                  </button>
                </div>
              )}
            </form>
          )}

          {step !== "start" && !redirecting && (
            <div>
              <button
                type="button"
                onClick={goBack}
                className="inline-flex min-h-11 items-center gap-1.5 px-3 text-sm text-paper/50 hover:text-paper cursor-pointer"
              >
                <ArrowLeft className="size-4" />
                Retour
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-ochre">
              {error}
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

