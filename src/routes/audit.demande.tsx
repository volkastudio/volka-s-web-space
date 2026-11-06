import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import {
  Globe,
  TrendingUp,
  Workflow,
  HelpCircle,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
  Send,
  Loader2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TealBackground } from "@/components/teal-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitAuditForm } from "@/lib/audit/audit.functions";
import type { AuditTrack } from "@/lib/audit/audit.server";
import { track } from "@/lib/analytics/tracker";
import { useI18n } from "@/i18n/context";

const searchSchema = z.object({
  track: z.enum(["website", "marketing", "sales", "general"]).optional(),
});

export const Route = createFileRoute("/audit/demande")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Demande d'Audit Croissance — Volka Studio" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: AuditWizardPage,
});

interface WizardFormState {
  track: AuditTrack;
  companyName: string;
  activitySector: string;
  country: string;
  teamSize: string;
  websiteUrl: string;
  // Step 3 answers
  q1: string;
  q2: string;
  // Step 4 contact
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  isEntitled: boolean;
  privacyConsent: boolean;
  // Bot guards
  gotcha: string;
}

const INITIAL_FORM: WizardFormState = {
  track: "website",
  companyName: "",
  activitySector: "",
  country: "",
  teamSize: "1-5",
  websiteUrl: "",
  q1: "",
  q2: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  isEntitled: false,
  privacyConsent: false,
  gotcha: "",
};

const STORAGE_KEY = "volka_audit_draft_v1";

function AuditWizardPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isEn = locale === "en";

  const steps = React.useMemo(
    () => [
      { id: 1, title: isEn ? "Track" : "Parcours" },
      { id: 2, title: isEn ? "Company" : "Entreprise" },
      { id: 3, title: isEn ? "Diagnostic" : "Diagnostic" },
      { id: 4, title: isEn ? "Contact" : "Coordonnées" },
    ],
    [isEn]
  );

  const trackOptions = React.useMemo(
    () => [
      {
        id: "website" as const,
        title: isEn ? "Website" : "Site Web",
        subtitle: isEn ? "Conversion & Perception" : "Conversion & Perception",
        desc: isEn
          ? "Mobile speed, clarity of your offer, contact / WhatsApp conversion path."
          : "Vitesse mobile, clarté de votre offre, parcours de prise de contact / WhatsApp.",
        icon: <Globe className="size-5 text-mint" />,
      },
      {
        id: "marketing" as const,
        title: isEn ? "Marketing & Visibility" : "Marketing & Visibilité",
        subtitle: isEn ? "Acquisition & Perception" : "Acquisition & Perception",
        desc: isEn
          ? "Consistency of public profiles, link-in-bio relevance, and content alignment."
          : "Cohérence des profils publics, pertinence du link-in-bio et alignement du contenu.",
        icon: <TrendingUp className="size-5 text-mint" />,
      },
      {
        id: "sales" as const,
        title: isEn ? "Sales & Follow-up" : "Ventes & Suivi",
        subtitle: isEn ? "Sales & Automation" : "Sales & Automation",
        desc: isEn
          ? "Handling incoming leads, follow-up leaks, and recommended automations."
          : "Traitement des leads entrants, fuites de relance et automatisations recommandées.",
        icon: <Workflow className="size-5 text-mint" />,
      },
      {
        id: "general" as const,
        title: isEn ? "I'm not sure" : "Je ne sais pas",
        subtitle: isEn ? "Cross-cutting Diagnostic" : "Diagnostic Transversal",
        desc: isEn
          ? "Synthetic review of the 5 pillars to pinpoint your primary growth bottleneck."
          : "Revue synthétique des 5 piliers pour identifier votre blocage prioritaire.",
        icon: <HelpCircle className="size-5 text-mint" />,
      },
    ],
    [isEn]
  );

  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [formData, setFormData] = React.useState<WizardFormState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...INITIAL_FORM,
            ...parsed,
            ...(search.track ? { track: search.track } : {}),
          };
        }
      } catch {
        // fallback
      }
    }
    return {
      ...INITIAL_FORM,
      ...(search.track ? { track: search.track } : {}),
    };
  });

  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const mountTimeRef = React.useRef<number>(Date.now());

  // Save draft to sessionStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const updateField = <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Field validation rules
  const getErrors = () => {
    const errs: Record<string, string> = {};

    if (currentStep >= 2) {
      if (!formData.companyName.trim()) {
        errs["companyName"] = isEn ? "Company name is required." : "Le nom de l'entreprise est obligatoire.";
      }
      if (!formData.activitySector.trim()) {
        errs["activitySector"] = isEn ? "Industry / sector is required." : "Le secteur d'activité est obligatoire.";
      }
      if (!formData.country.trim()) {
        errs["country"] = isEn ? "Country is required." : "Le pays est obligatoire.";
      }
    }

    if (currentStep >= 3) {
      if (!formData.q1.trim()) {
        errs["q1"] = isEn ? "This response is required to guide the audit." : "Cette réponse est nécessaire pour guider l'audit.";
      }
    }

    if (currentStep >= 4) {
      if (!formData.contactName.trim() || formData.contactName.trim().length < 2) {
        errs["contactName"] = isEn ? "Please enter your full name." : "Veuillez renseigner votre prénom et nom.";
      }
      if (!formData.contactEmail.trim() || !/^\S+@\S+\.\S+$/.test(formData.contactEmail)) {
        errs["contactEmail"] = isEn ? "A valid email address is required to receive the audit." : "Une adresse email valide est requise pour recevoir l'audit.";
      }
      if (!formData.contactPhone.trim() || formData.contactPhone.trim().length < 6) {
        errs["contactPhone"] = isEn
          ? "A valid WhatsApp number with country code is required (e.g. +33 6 12 34 56 78)."
          : "Un numéro WhatsApp valide avec indicatif pays est requis (ex: +33 6 12 34 56 78).";
      }
      if (!formData.isEntitled) {
        errs["isEntitled"] = isEn
          ? "You must confirm you are authorized for this business."
          : "Vous devez confirmer être habilité(e) pour cette entreprise.";
      }
      if (!formData.privacyConsent) {
        errs["privacyConsent"] = isEn
          ? "Your agreement with our privacy policy is required."
          : "Votre accord avec notre politique de confidentialité est requis.";
      }
    }

    return errs;
  };

  const errors = getErrors();

  const handleNext = () => {
    // Check if current step has errors
    const stepErrors: Record<string, boolean> = {};
    if (currentStep === 2) {
      if (!formData.companyName.trim()) stepErrors["companyName"] = true;
      if (!formData.activitySector.trim()) stepErrors["activitySector"] = true;
      if (!formData.country.trim()) stepErrors["country"] = true;
    }
    if (currentStep === 3) {
      if (!formData.q1.trim()) stepErrors["q1"] = true;
    }

    if (Object.keys(stepErrors).length > 0) {
      setTouched((prev) => ({ ...prev, ...stepErrors }));
      return;
    }

    setServerError(null);
    setCurrentStep((prev) => Math.min(4, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setServerError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 4) {
      handleNext();
      return;
    }

    // Touch all step 4 fields
    setTouched({
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      isEntitled: true,
      privacyConsent: true,
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    setServerError(null);

    const elapsedMs = Date.now() - mountTimeRef.current;

    try {
      const res = await submitAuditForm({
        data: {
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          companyName: formData.companyName,
          activitySector: formData.activitySector,
          country: formData.country,
          teamSize: formData.teamSize,
          track: formData.track,
          websiteUrl: formData.websiteUrl || undefined,
          specificAnswers: {
            q1: formData.q1,
            q2: formData.q2,
          },
          isEntitled: formData.isEntitled,
          privacyConsent: formData.privacyConsent,
          gotcha: formData.gotcha,
          elapsedMs,
        },
      });

      if (!res.success) {
        setServerError(res.error || "Une erreur est survenue lors de l'envoi.");
        setSubmitting(false);
        return;
      }

      // Clear draft on success
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(STORAGE_KEY);
      }

      track("audit_submit", {
        path: "/audit/demande",
        metadata: {
          track: formData.track,
          sector: formData.activitySector,
        },
      });

      // Navigate to confirmation page
      navigate({
        to: "/audit/confirmation",
        search: { email: formData.contactEmail },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      setServerError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-black text-paper relative isolate flex flex-col font-sans overflow-hidden">
      <TealBackground variant="glow" />
      <SiteHeader />

      <main className="relative z-10 flex-1 pt-8 pb-20 px-5 sm:px-12 sm:pt-16">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Top Title & Step Indicator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-mint/80">
              <Link
                to="/audit"
                className="inline-flex items-center gap-1 hover:text-paper transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                {isEn ? "Back to presentation" : "Retour à la présentation"}
              </Link>
              <span className="font-mono uppercase tracking-widest text-mint">
                {isEn ? `Step ${currentStep} of 4` : `Étape ${currentStep} sur 4`}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl text-paper font-light tracking-[-0.03em]">
              {isEn ? (
                <>
                  Request a{" "}
                  <span className="italic text-mint font-light">growth audit</span>
                </>
              ) : (
                <>
                  Demande d'audit{" "}
                  <span className="italic text-mint font-light">croissance</span>
                </>
              )}
            </h1>

            {/* Step Progress Pills */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {steps.map((s) => {
                const isPassed = s.id < currentStep;
                const isCurrent = s.id === currentStep;
                return (
                  <div key={s.id} className="space-y-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-colors duration-200 ${
                        isCurrent
                          ? "bg-mint"
                          : isPassed
                            ? "bg-mint/40"
                            : "bg-paper/10"
                      }`}
                    />
                    <span
                      className={`text-[11px] block truncate ${
                        isCurrent
                          ? "text-mint font-semibold"
                          : isPassed
                            ? "text-paper/80"
                            : "text-paper/40"
                      }`}
                    >
                      {s.id}. {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-terracotta/20 border border-terracotta text-paper text-sm flex items-start gap-3"
            >
              <AlertCircle className="size-5 text-terracotta shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Glass Card Wrapper around Wizard Form */}
          <div className="rounded-2xl border border-paper/15 bg-paper/[0.04] p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <form onSubmit={handleSubmit} noValidate className="audit-form space-y-8">
              {/* Mobile comfort: 16px text stops iOS zooming into fields; 48px touch targets */}
              <style>{`
                .audit-form input:not([type="checkbox"]), .audit-form select, .audit-form textarea { font-size: 16px; }
                .audit-form input:not([type="checkbox"]), .audit-form select { min-height: 48px; }
                .audit-form input[type="checkbox"] { width: 1.25rem; height: 1.25rem; flex-shrink: 0; }
              `}</style>
              {/* Honeypot field (hidden from real users) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website_check">Ne pas remplir</label>
                <input
                  id="website_check"
                  type="text"
                  value={formData.gotcha}
                  onChange={(e) => updateField("gotcha", e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* STEP 1: PARCOURS */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl text-paper font-light">
                      {isEn ? "1. Which diagnostic is your top priority?" : "1. Quel diagnostic souhaitez-vous en priorité ?"}
                    </h2>
                    <p className="text-xs text-mint/80">
                      {isEn
                        ? "Choose the track that matches your most pressing question right now."
                        : "Choisissez le parcours qui correspond à votre plus grande interrogation actuelle."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {trackOptions.map((opt) => {
                      const isSelected = formData.track === opt.id;
                      return (
                        <div
                          key={opt.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => updateField("track", opt.id as AuditTrack)}
                          onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                              e.preventDefault();
                              updateField("track", opt.id as AuditTrack);
                            }
                          }}
                          className={`p-4 sm:p-5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-4 ${
                            isSelected
                              ? "bg-pine/70 border-mint shadow-md ring-1 ring-mint"
                              : "bg-paper/[0.03] border-paper/15 hover:border-mint/40 hover:bg-paper/[0.06]"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              {opt.icon}
                              <span className="font-medium text-paper text-base">
                                {opt.title}
                              </span>
                            </div>
                            <span className="text-xs text-ochre uppercase tracking-wider block font-semibold">
                              {opt.subtitle}
                            </span>
                            {/* Subtext hidden by default; displayed ONLY when active/selected */}
                            {isSelected && (
                              <p className="text-xs text-paper/80 pt-1 leading-relaxed">
                                {opt.desc}
                              </p>
                            )}
                          </div>

                          <div
                            className={`size-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                              isSelected
                                ? "bg-mint border-mint text-forest-black"
                                : "border-paper/30"
                            }`}
                          >
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: ENTREPRISE */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl text-paper font-light">
                      {isEn ? "2. Tell us about your business" : "2. Parlez-nous de votre entreprise"}
                    </h2>
                    <p className="text-xs text-mint/80">
                      {isEn
                        ? "These details help us contextualize expectations in your market."
                        : "Ces éléments nous permettent de contextualiser les attentes de votre marché."}
                    </p>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-xs text-paper font-medium">
                      {isEn ? "Company or brand name" : "Nom de l'entreprise ou de la marque"} <span className="text-terracotta">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder={isEn ? "E.g. Bloom Studio, Horizon B2B..." : "Ex: Atelier Bloom, Horizon B2B..."}
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      onBlur={() => markTouched("companyName")}
                      className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                      aria-describedby={touched["companyName"] && errors["companyName"] ? "companyName-err" : undefined}
                    />
                    {touched["companyName"] && errors["companyName"] && (
                      <p id="companyName-err" role="alert" className="text-xs text-terracotta">
                        {errors["companyName"]}
                      </p>
                    )}
                  </div>

                  {/* Activity Sector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="activitySector" className="text-xs text-paper font-medium">
                      {isEn ? "Industry / Sector" : "Secteur d'activité"} <span className="text-terracotta">*</span>
                    </Label>
                    <Input
                      id="activitySector"
                      type="text"
                      placeholder={isEn ? "E.g. B2B Consulting, Luxury goods, E-commerce, SaaS..." : "Ex: Conseil B2B, E-commerce, Mode, SaaS..."}
                      value={formData.activitySector}
                      onChange={(e) => updateField("activitySector", e.target.value)}
                      onBlur={() => markTouched("activitySector")}
                      className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                      aria-describedby={touched["activitySector"] && errors["activitySector"] ? "activitySector-err" : undefined}
                    />
                    {touched["activitySector"] && errors["activitySector"] && (
                      <p id="activitySector-err" role="alert" className="text-xs text-terracotta">
                        {errors["activitySector"]}
                      </p>
                    )}
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5">
                    <Label htmlFor="country" className="text-xs text-paper font-medium">
                      {isEn ? "Main country of operation" : "Pays principal d'activité"} <span className="text-terracotta">*</span>
                    </Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder={isEn ? "E.g. France, Belgium, Switzerland, UK, International..." : "Ex: France, Belgique, Suisse, International..."}
                      value={formData.country}
                      onChange={(e) => updateField("country", e.target.value)}
                      onBlur={() => markTouched("country")}
                      className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                      aria-describedby={touched["country"] && errors["country"] ? "country-err" : undefined}
                    />
                    {touched["country"] && errors["country"] && (
                      <p id="country-err" role="alert" className="text-xs text-terracotta">
                        {errors["country"]}
                      </p>
                    )}
                  </div>

                  {/* Team Size */}
                  <div className="space-y-1.5">
                    <Label htmlFor="teamSize" className="text-xs text-paper font-medium">
                      {isEn ? "Team size" : "Taille de l'équipe"}
                    </Label>
                    <select
                      id="teamSize"
                      value={formData.teamSize}
                      onChange={(e) => updateField("teamSize", e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-paper/5 border border-paper/20 text-paper text-sm focus:border-mint focus:outline-none"
                    >
                      <option value="1-5" className="bg-forest-black text-paper">{isEn ? "1 to 5 people" : "1 à 5 personnes"}</option>
                      <option value="6-15" className="bg-forest-black text-paper">{isEn ? "6 to 15 people" : "6 à 15 personnes"}</option>
                      <option value="16-50" className="bg-forest-black text-paper">{isEn ? "16 to 50 people" : "16 à 50 personnes"}</option>
                      <option value="50+" className="bg-forest-black text-paper">{isEn ? "50+ people" : "Plus de 50 personnes"}</option>
                    </select>
                  </div>

                  {/* Website URL */}
                  <div className="space-y-1.5">
                    <Label htmlFor="websiteUrl" className="text-xs text-paper font-medium">
                      {isEn ? "Current website (Optional but recommended)" : "Site web actuel (Optionnel mais recommandé)"}
                    </Label>
                    <p className="text-[11px] text-mint/70">
                      {isEn ? "Required if you selected the Website track." : "Nécessaire si vous avez choisi le parcours Site Web."}
                    </p>
                    <Input
                      id="websiteUrl"
                      type="url"
                      placeholder="https://votre-site.com"
                      value={formData.websiteUrl}
                      onChange={(e) => updateField("websiteUrl", e.target.value)}
                      className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: DIAGNOSTIC QUESTIONS */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl text-paper font-light">
                      {isEn ? "3. Details on your current situation" : "3. Précisions sur votre situation"}
                    </h2>
                    <p className="text-xs text-mint/80">
                      {isEn
                        ? "Two questions to guide our strategic analysis."
                        : "Deux questions pour orienter l'analyse de nos experts."}
                    </p>
                  </div>

                  {/* Track-conditional questions */}
                  {formData.track === "website" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="q1" className="text-xs text-paper font-medium">
                          {isEn ? "What is the #1 objective of your website?" : "Quel est l'objectif numéro 1 de votre site ?"} <span className="text-terracotta">*</span>
                        </Label>
                        <p className="text-[11px] text-mint/70">
                          {isEn ? "E.g.: Receive contact requests, generate inbound qualified leads, online sales..." : "Ex: Recevoir des messages WhatsApp, capturer des emails, vendre en ligne..."}
                        </p>
                        <Textarea
                          id="q1"
                          rows={3}
                          value={formData.q1}
                          onChange={(e) => updateField("q1", e.target.value)}
                          onBlur={() => markTouched("q1")}
                          className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                          aria-describedby={touched["q1"] && errors["q1"] ? "q1-err" : undefined}
                        />
                        {touched["q1"] && errors["q1"] && (
                          <p id="q1-err" role="alert" className="text-xs text-terracotta">
                            {errors["q1"]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="q2" className="text-xs text-paper font-medium">
                          {isEn ? "Which page or section do you feel is currently underperforming?" : "Quelle est la page ou section que vous jugez la moins performante ?"}
                        </Label>
                        <Input
                          id="q2"
                          type="text"
                          placeholder={isEn ? "E.g.: Homepage, pricing table, contact form..." : "Ex: La page d'accueil, la page tarifs, le formulaire..."}
                          value={formData.q2}
                          onChange={(e) => updateField("q2", e.target.value)}
                          className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                        />
                      </div>
                    </>
                  )}

                  {formData.track === "marketing" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="q1" className="text-xs text-paper font-medium">
                          {isEn ? "Which channels are you most active on and at what frequency?" : "Sur quels canaux êtes-vous le plus présent et quel est votre rythme ?"} <span className="text-terracotta">*</span>
                        </Label>
                        <p className="text-[11px] text-mint/70">
                          {isEn ? "E.g.: LinkedIn (2x/week), Instagram Reels, newsletter..." : "Ex: LinkedIn (2x/semaine), Instagram Reels, newsletter..."}
                        </p>
                        <Textarea
                          id="q1"
                          rows={3}
                          value={formData.q1}
                          onChange={(e) => updateField("q1", e.target.value)}
                          onBlur={() => markTouched("q1")}
                          className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                          aria-describedby={touched["q1"] && errors["q1"] ? "q1-err" : undefined}
                        />
                        {touched["q1"] && errors["q1"] && (
                          <p id="q1-err" role="alert" className="text-xs text-terracotta">
                            {errors["q1"]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="q2" className="text-xs text-paper font-medium">
                          {isEn ? "Links to your main public profiles" : "Liens vers vos principaux profils publics"}
                        </Label>
                        <Input
                          id="q2"
                          type="text"
                          placeholder={isEn ? "E.g.: instagram.com/yourbrand, linkedin.com/company/..." : "Ex: instagram.com/votre_marque, linkedin.com/company/..."}
                          value={formData.q2}
                          onChange={(e) => updateField("q2", e.target.value)}
                          className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                        />
                      </div>
                    </>
                  )}

                  {formData.track === "sales" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="q1" className="text-xs text-paper font-medium">
                          {isEn ? "How do you track prospects between initial inquiry and closing?" : "Comment suivez-vous vos prospects entre le 1er message et la conclusion ?"} <span className="text-terracotta">*</span>
                        </Label>
                        <p className="text-[11px] text-mint/70">
                          {isEn ? "E.g.: WhatsApp + notes, Notion, CRM, spreadsheet..." : "Ex: WhatsApp + carnet papier, Notion, CRM, tableur Excel..."}
                        </p>
                        <Textarea
                          id="q1"
                          rows={3}
                          value={formData.q1}
                          onChange={(e) => updateField("q1", e.target.value)}
                          onBlur={() => markTouched("q1")}
                          className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                          aria-describedby={touched["q1"] && errors["q1"] ? "q1-err" : undefined}
                        />
                        {touched["q1"] && errors["q1"] && (
                          <p id="q1-err" role="alert" className="text-xs text-terracotta">
                            {errors["q1"]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="q2" className="text-xs text-paper font-medium">
                          {isEn ? "What is your average response time to an incoming lead?" : "Quel est votre délai moyen de première réponse à une demande entrante ?"}
                        </Label>
                        <Input
                          id="q2"
                          type="text"
                          placeholder={isEn ? "E.g.: Under 30 mins, same day, within 48h..." : "Ex: Moins de 30 min, dans la journée, sous 48h..."}
                          value={formData.q2}
                          onChange={(e) => updateField("q2", e.target.value)}
                          className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                        />
                      </div>
                    </>
                  )}

                  {formData.track === "general" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="q1" className="text-xs text-paper font-medium">
                          {isEn ? "What is the single biggest bottleneck to your growth today?" : "Quel est le plus grand obstacle à la croissance de votre entreprise aujourd'hui ?"} <span className="text-terracotta">*</span>
                        </Label>
                        <Textarea
                          id="q1"
                          rows={3}
                          placeholder={isEn ? "E.g.: Not enough incoming leads, prospects hesitating on pricing..." : "Ex: Pas assez de contacts entrants, des prospects qui trouvent nos prix trop chers..."}
                          value={formData.q1}
                          onChange={(e) => updateField("q1", e.target.value)}
                          onBlur={() => markTouched("q1")}
                          className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                          aria-describedby={touched["q1"] && errors["q1"] ? "q1-err" : undefined}
                        />
                        {touched["q1"] && errors["q1"] && (
                          <p id="q1-err" role="alert" className="text-xs text-terracotta">
                            {errors["q1"]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="q2" className="text-xs text-paper font-medium">
                          {isEn ? "Where do your best clients currently come from?" : "D'où proviennent vos meilleurs clients actuels ?"}
                        </Label>
                        <Input
                          id="q2"
                          type="text"
                          placeholder={isEn ? "E.g.: Word-of-mouth, direct network, online content..." : "Ex: Bouche-à-oreille, réseau direct, publications en ligne..."}
                          value={formData.q2}
                          onChange={(e) => updateField("q2", e.target.value)}
                          className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 4: COORDONNÉES & ENGAGEMENTS */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl text-paper font-light">
                      {isEn ? "4. Contact info for report delivery" : "4. Vos coordonnées pour la livraison"}
                    </h2>
                    <p className="text-xs text-mint/80">
                      {isEn
                        ? "The interactive report will be delivered to this email address."
                        : "Le rapport interactif sera envoyé à cette adresse email après confirmation."}
                    </p>
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contactName" className="text-xs text-paper font-medium">
                      {isEn ? "Your full name" : "Votre prénom et nom"} <span className="text-terracotta">*</span>
                    </Label>
                    <Input
                      id="contactName"
                      type="text"
                      placeholder={isEn ? "E.g. Alex Martin" : "Ex: Alexandre Martin"}
                      value={formData.contactName}
                      onChange={(e) => updateField("contactName", e.target.value)}
                      onBlur={() => markTouched("contactName")}
                      className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                      aria-describedby={touched["contactName"] && errors["contactName"] ? "contactName-err" : undefined}
                    />
                    {touched["contactName"] && errors["contactName"] && (
                      <p id="contactName-err" role="alert" className="text-xs text-terracotta">
                        {errors["contactName"]}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contactEmail" className="text-xs text-paper font-medium">
                      {isEn ? "Professional work email" : "Adresse email professionnelle"} <span className="text-terracotta">*</span>
                    </Label>
                    <p className="text-[11px] text-mint/70">
                      {isEn ? "A verification link will be immediately dispatched." : "Un lien de confirmation vous sera immédiatement expédié."}
                    </p>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="alex@acmecorp.com"
                      value={formData.contactEmail}
                      onChange={(e) => updateField("contactEmail", e.target.value)}
                      onBlur={() => markTouched("contactEmail")}
                      className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                      aria-describedby={touched["contactEmail"] && errors["contactEmail"] ? "contactEmail-err" : undefined}
                    />
                    {touched["contactEmail"] && errors["contactEmail"] && (
                      <p id="contactEmail-err" role="alert" className="text-xs text-terracotta">
                        {errors["contactEmail"]}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="contactPhone" className="text-xs text-paper font-medium">
                      {isEn ? "WhatsApp phone number" : "Numéro de téléphone WhatsApp"} <span className="text-terracotta">*</span>
                    </Label>
                    <p className="text-[11px] text-mint/70">
                      {isEn ? "International format recommended (e.g. +33 6 12 34 56 78)." : "Format international recommandé (ex : +33 6 12 34 56 78)."}
                    </p>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+33 6 12 34 56 78"
                      value={formData.contactPhone}
                      onChange={(e) => updateField("contactPhone", e.target.value)}
                      onBlur={() => markTouched("contactPhone")}
                      className="bg-paper/5 border-paper/20 focus:border-mint focus:ring-1 focus:ring-mint text-paper placeholder:text-paper/35"
                      aria-describedby={touched["contactPhone"] && errors["contactPhone"] ? "contactPhone-err" : undefined}
                    />
                    {touched["contactPhone"] && errors["contactPhone"] && (
                      <p id="contactPhone-err" role="alert" className="text-xs text-terracotta">
                        {errors["contactPhone"]}
                      </p>
                    )}
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3 pt-3 border-t border-paper/15 text-xs">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isEntitled}
                        onChange={(e) => updateField("isEntitled", e.target.checked)}
                        className="mt-0.5 rounded border-paper/20 bg-paper/10 text-ochre focus:ring-mint"
                      />
                      <span className="text-paper/90 leading-relaxed">
                        {isEn
                          ? "I confirm that I am authorized to request this audit for this business and these public accounts."
                          : "Je confirme être habilité(e) à demander cet audit pour cette entreprise et ces comptes publics."}{" "}
                        <span className="text-terracotta">*</span>
                      </span>
                    </label>
                    {touched["isEntitled"] && errors["isEntitled"] && (
                      <p role="alert" className="text-xs text-terracotta pl-6">
                        {errors["isEntitled"]}
                      </p>
                    )}

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.privacyConsent}
                        onChange={(e) => updateField("privacyConsent", e.target.checked)}
                        className="mt-0.5 rounded border-paper/20 bg-paper/10 text-ochre focus:ring-mint"
                      />
                      <span className="text-paper/90 leading-relaxed">
                        {isEn ? (
                          <>
                            I agree to my answers being processed to produce this audit, in accordance with the{" "}
                            <Link to="/legal" className="text-mint underline underline-offset-2">
                              privacy policy
                            </Link>. <span className="text-terracotta">*</span>
                          </>
                        ) : (
                          <>
                            J'accepte que mes réponses soient traitées pour la réalisation de cet audit, conformément à la{" "}
                            <Link to="/legal" className="text-mint underline underline-offset-2">
                              politique de confidentialité
                            </Link>. <span className="text-terracotta">*</span>
                          </>
                        )}
                      </span>
                    </label>
                    {touched["privacyConsent"] && errors["privacyConsent"] && (
                      <p role="alert" className="text-xs text-terracotta pl-6">
                        {errors["privacyConsent"]}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* BUTTON BAR */}
              <div className="flex flex-col-reverse gap-3 pt-4 border-t border-paper/15 sm:flex-row sm:items-center sm:justify-between">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={submitting}
                    className="h-12 w-full rounded-full border-paper/20 hover:bg-paper/10 text-paper sm:w-auto px-6"
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    {isEn ? "Previous" : "Précédent"}
                  </Button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-12 w-full rounded-full bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-7 shadow-xl sm:w-auto"
                  >
                    {isEn ? "Continue" : "Continuer"}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 w-full rounded-full bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-8 shadow-xl sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {isEn ? "Processing..." : "Traitement en cours..."}
                      </>
                    ) : (
                      <>
                        {isEn ? "Submit my audit request" : "Valider ma demande d'audit"}
                        <Send className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
