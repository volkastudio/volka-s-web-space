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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitAuditForm } from "@/lib/audit/audit.functions";
import type { AuditTrack } from "@/lib/audit/audit.server";
import { track } from "@/lib/analytics/tracker";

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

const STEPS = [
  { id: 1, title: "Parcours" },
  { id: 2, title: "Entreprise" },
  { id: 3, title: "Diagnostic" },
  { id: 4, title: "Coordonnées" },
] as const;

const TRACK_OPTIONS = [
  {
    id: "website",
    title: "Site Web",
    subtitle: "Conversion & Perception",
    desc: "Vitesse mobile, clarté de votre offre, parcours de prise de contact / WhatsApp.",
    icon: <Globe className="size-5 text-mint" />,
  },
  {
    id: "marketing",
    title: "Marketing & Visibilité",
    subtitle: "Acquisition & Perception",
    desc: "Cohérence des profils publics, pertinence du link-in-bio et alignement du contenu.",
    icon: <TrendingUp className="size-5 text-mint" />,
  },
  {
    id: "sales",
    title: "Ventes & Suivi",
    subtitle: "Sales & Automation",
    desc: "Traitement des leads entrants, fuites de relance et automatisations recommandées.",
    icon: <Workflow className="size-5 text-mint" />,
  },
  {
    id: "general",
    title: "Je ne sais pas",
    subtitle: "Diagnostic Transversal",
    desc: "Revue synthétique des 5 piliers pour identifier votre blocage prioritaire.",
    icon: <HelpCircle className="size-5 text-mint" />,
  },
] as const;

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
      if (!formData.companyName.trim()) errs["companyName"] = "Le nom de l'entreprise est obligatoire.";
      if (!formData.activitySector.trim()) errs["activitySector"] = "Le secteur d'activité est obligatoire.";
      if (!formData.country.trim()) errs["country"] = "Le pays est obligatoire.";
    }

    if (currentStep >= 3) {
      if (!formData.q1.trim()) errs["q1"] = "Cette réponse est nécessaire pour guider l'audit.";
    }

    if (currentStep >= 4) {
      if (!formData.contactName.trim() || formData.contactName.trim().length < 2) {
        errs["contactName"] = "Veuillez renseigner votre prénom et nom.";
      }
      if (!formData.contactEmail.trim() || !/^\S+@\S+\.\S+$/.test(formData.contactEmail)) {
        errs["contactEmail"] = "Une adresse email valide est requise pour recevoir l'audit.";
      }
      if (!formData.contactPhone.trim() || formData.contactPhone.trim().length < 6) {
        errs["contactPhone"] = "Un numéro WhatsApp valide avec indicatif pays est requis (ex: +229 ...).";
      }
      if (!formData.isEntitled) {
        errs["isEntitled"] = "Vous devez confirmer être habilité(e) pour cette entreprise.";
      }
      if (!formData.privacyConsent) {
        errs["privacyConsent"] = "Votre accord avec notre politique de confidentialité est requis.";
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
    <div className="min-h-screen bg-forest-black text-paper flex flex-col font-sans">
      <SiteHeader />

      <main className="flex-1 pt-8 pb-20 px-5 sm:px-12 sm:pt-16">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Top Title & Step Indicator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-mint/80">
              <Link
                to="/audit"
                className="inline-flex items-center gap-1 hover:text-paper transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Retour à la présentation
              </Link>
              <span className="font-mono uppercase tracking-widest">
                Étape {currentStep} sur 4
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl text-paper font-light">
              Demande d'audit croissance
            </h1>

            {/* Step Progress Pills */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {STEPS.map((s) => {
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
                            : "bg-pine/60"
                      }`}
                    />
                    <span
                      className={`text-[11px] block truncate ${
                        isCurrent
                          ? "text-mint font-semibold"
                          : isPassed
                            ? "text-paper/80"
                            : "text-mint/40"
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
              className="p-4 rounded bg-terracotta/20 border border-terracotta text-paper text-sm flex items-start gap-3"
            >
              <AlertCircle className="size-5 text-terracotta shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* WIZARD FORM */}
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
                  <h2 className="font-display text-2xl text-paper">
                    1. Quel diagnostic souhaitez-vous en priorité ?
                  </h2>
                  <p className="text-xs text-mint/80">
                    Choisissez le parcours qui correspond à votre plus grande interrogation actuelle.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {TRACK_OPTIONS.map((opt) => {
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
                        className={`p-4 sm:p-5 rounded-lg border text-left transition-all cursor-pointer flex items-start justify-between gap-4 ${
                          isSelected
                            ? "bg-pine/70 border-mint shadow-md ring-1 ring-mint"
                            : "bg-pine/20 border-pine/60 hover:border-mint/40 hover:bg-pine/40"
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
                          <p className="text-xs text-paper/70 pt-1 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>

                        <div
                          className={`size-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                            isSelected
                              ? "bg-mint border-mint text-forest-black"
                              : "border-mint/30"
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
                  <h2 className="font-display text-2xl text-paper">
                    2. Parlez-nous de votre entreprise
                  </h2>
                  <p className="text-xs text-mint/80">
                    Ces éléments nous permettent de contextualiser les attentes de votre marché.
                  </p>
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-xs text-paper font-medium">
                    Nom de l'entreprise ou de la marque <span className="text-terracotta">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Ex: Kōro Foods, Studio Néo..."
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    onBlur={() => markTouched("companyName")}
                    className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                    Secteur d'activité <span className="text-terracotta">*</span>
                  </Label>
                  <Input
                    id="activitySector"
                    type="text"
                    placeholder="Ex: Agroalimentaire, Conseil B2B, E-commerce, SaaS..."
                    value={formData.activitySector}
                    onChange={(e) => updateField("activitySector", e.target.value)}
                    onBlur={() => markTouched("activitySector")}
                    className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                    Pays principal d'activité <span className="text-terracotta">*</span>
                  </Label>
                  <Input
                    id="country"
                    type="text"
                    placeholder="Ex: Bénin, Côte d'Ivoire, France, Sénégal..."
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    onBlur={() => markTouched("country")}
                    className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                    Taille de l'équipe
                  </Label>
                  <select
                    id="teamSize"
                    value={formData.teamSize}
                    onChange={(e) => updateField("teamSize", e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-pine/30 border border-pine/70 text-paper text-sm focus:border-mint focus:outline-none"
                  >
                    <option value="1-5" className="bg-forest-black text-paper">1 à 5 personnes</option>
                    <option value="6-15" className="bg-forest-black text-paper">6 à 15 personnes</option>
                    <option value="16-50" className="bg-forest-black text-paper">16 à 50 personnes</option>
                    <option value="50+" className="bg-forest-black text-paper">Plus de 50 personnes</option>
                  </select>
                </div>

                {/* Website URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="websiteUrl" className="text-xs text-paper font-medium">
                    Site web actuel (Optionnel mais recommandé)
                  </Label>
                  <p className="text-[11px] text-mint/70">
                    Nécessaire si vous avez choisi le parcours Site Web.
                  </p>
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://votre-site.com"
                    value={formData.websiteUrl}
                    onChange={(e) => updateField("websiteUrl", e.target.value)}
                    className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: DIAGNOSTIC QUESTIONS */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl text-paper">
                    3. Précisions sur votre situation
                  </h2>
                  <p className="text-xs text-mint/80">
                    Deux questions pour orienter l'analyse de nos experts.
                  </p>
                </div>

                {/* Track-conditional questions */}
                {formData.track === "website" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="q1" className="text-xs text-paper font-medium">
                        Quel est l'objectif numéro 1 de votre site ? <span className="text-terracotta">*</span>
                      </Label>
                      <p className="text-[11px] text-mint/70">
                        Ex: Recevoir des messages WhatsApp, capturer des emails, vendre en ligne...
                      </p>
                      <Textarea
                        id="q1"
                        rows={3}
                        value={formData.q1}
                        onChange={(e) => updateField("q1", e.target.value)}
                        onBlur={() => markTouched("q1")}
                        className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                        Quelle est la page ou section que vous jugez la moins performante ?
                      </Label>
                      <Input
                        id="q2"
                        type="text"
                        placeholder="Ex: La page d'accueil, la page tarifs, le formulaire..."
                        value={formData.q2}
                        onChange={(e) => updateField("q2", e.target.value)}
                        className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
                      />
                    </div>
                  </>
                )}

                {formData.track === "marketing" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="q1" className="text-xs text-paper font-medium">
                        Sur quels canaux êtes-vous le plus présent et quel est votre rythme ? <span className="text-terracotta">*</span>
                      </Label>
                      <p className="text-[11px] text-mint/70">
                        Ex: LinkedIn (2x/semaine), Instagram Reels, newsletter...
                      </p>
                      <Textarea
                        id="q1"
                        rows={3}
                        value={formData.q1}
                        onChange={(e) => updateField("q1", e.target.value)}
                        onBlur={() => markTouched("q1")}
                        className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                        Liens vers vos principaux profils publics
                      </Label>
                      <Input
                        id="q2"
                        type="text"
                        placeholder="Ex: instagram.com/votre_marque, linkedin.com/company/..."
                        value={formData.q2}
                        onChange={(e) => updateField("q2", e.target.value)}
                        className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
                      />
                    </div>
                  </>
                )}

                {formData.track === "sales" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="q1" className="text-xs text-paper font-medium">
                        Comment suivez-vous vos prospects entre le 1er message et la conclusion ? <span className="text-terracotta">*</span>
                      </Label>
                      <p className="text-[11px] text-mint/70">
                        Ex: WhatsApp + carnet papier, Notion, CRM, tableur Excel...
                      </p>
                      <Textarea
                        id="q1"
                        rows={3}
                        value={formData.q1}
                        onChange={(e) => updateField("q1", e.target.value)}
                        onBlur={() => markTouched("q1")}
                        className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                        Quel est votre délai moyen de première réponse à une demande entrante ?
                      </Label>
                      <Input
                        id="q2"
                        type="text"
                        placeholder="Ex: Moins de 30 min, dans la journée, sous 48h..."
                        value={formData.q2}
                        onChange={(e) => updateField("q2", e.target.value)}
                        className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
                      />
                    </div>
                  </>
                )}

                {formData.track === "general" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="q1" className="text-xs text-paper font-medium">
                        Quel est le plus grand obstacle à la croissance de votre entreprise aujourd'hui ? <span className="text-terracotta">*</span>
                      </Label>
                      <Textarea
                        id="q1"
                        rows={3}
                        placeholder="Ex: Pas assez de contacts entrants, des prospects qui trouvent nos prix trop chers..."
                        value={formData.q1}
                        onChange={(e) => updateField("q1", e.target.value)}
                        onBlur={() => markTouched("q1")}
                        className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                        D'où proviennent vos meilleurs clients actuels ?
                      </Label>
                      <Input
                        id="q2"
                        type="text"
                        placeholder="Ex: Bouche-à-oreille, réseau direct, publications en ligne..."
                        value={formData.q2}
                        onChange={(e) => updateField("q2", e.target.value)}
                        className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                  <h2 className="font-display text-2xl text-paper">
                    4. Vos coordonnées pour la livraison
                  </h2>
                  <p className="text-xs text-mint/80">
                    Le rapport interactif sera envoyé à cette adresse email après confirmation.
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="contactName" className="text-xs text-paper font-medium">
                    Votre prénom et nom <span className="text-terracotta">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    type="text"
                    placeholder="Ex: Christian Kouassi"
                    value={formData.contactName}
                    onChange={(e) => updateField("contactName", e.target.value)}
                    onBlur={() => markTouched("contactName")}
                    className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                    Adresse email professionnelle <span className="text-terracotta">*</span>
                  </Label>
                  <p className="text-[11px] text-mint/70">
                    Un lien de confirmation vous sera immédiatement expédié.
                  </p>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="vous@entreprise.com"
                    value={formData.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                    onBlur={() => markTouched("contactEmail")}
                    className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
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
                    Numéro de téléphone WhatsApp <span className="text-terracotta">*</span>
                  </Label>
                  <p className="text-[11px] text-mint/70">
                    Format international recommandé (ex : +229 97 00 00 00).
                  </p>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+229 ..."
                    value={formData.contactPhone}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
                    onBlur={() => markTouched("contactPhone")}
                    className="bg-pine/30 border-pine/70 focus:border-mint text-paper"
                    aria-describedby={touched["contactPhone"] && errors["contactPhone"] ? "contactPhone-err" : undefined}
                  />
                  {touched["contactPhone"] && errors["contactPhone"] && (
                    <p id="contactPhone-err" role="alert" className="text-xs text-terracotta">
                      {errors["contactPhone"]}
                    </p>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-3 border-t border-pine/40 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isEntitled}
                      onChange={(e) => updateField("isEntitled", e.target.checked)}
                      className="mt-0.5 rounded border-pine bg-pine/30 text-ochre focus:ring-mint"
                    />
                    <span className="text-paper/90 leading-relaxed">
                      Je confirme être habilité(e) à demander cet audit pour cette entreprise et ces comptes publics. <span className="text-terracotta">*</span>
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
                      className="mt-0.5 rounded border-pine bg-pine/30 text-ochre focus:ring-mint"
                    />
                    <span className="text-paper/90 leading-relaxed">
                      J'accepte que mes réponses soient traitées pour la réalisation de cet audit, conformément à la{" "}
                      <Link to="/legal" className="text-mint underline underline-offset-2">
                        politique de confidentialité
                      </Link>. <span className="text-terracotta">*</span>
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
            <div className="flex flex-col-reverse gap-3 pt-4 border-t border-pine/50 sm:flex-row sm:items-center sm:justify-between">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={submitting}
                  className="h-12 w-full border-pine hover:bg-pine/40 text-paper sm:w-auto"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Précédent
                </Button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="h-12 w-full bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-6 sm:w-auto"
                >
                  Continuer
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full bg-ochre hover:bg-ochre/90 text-forest-black font-semibold px-7 shadow-lg sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      Valider ma demande d'audit
                      <Send className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
