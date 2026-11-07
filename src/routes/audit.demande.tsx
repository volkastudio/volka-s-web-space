import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Globe, TrendingUp, Workflow, HelpCircle } from "lucide-react";
import {
  CheckRow,
  ChoiceList,
  FlowInput,
  FlowTextarea,
  QuestionFlow,
  type ChoiceOption,
  type FlowQuestion,
} from "@/components/question-flow";
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
  // Diagnostic answers (the questions depend on the chosen track)
  q1: string;
  q2: string;
  // Contact
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

type Bi = { fr: string; en: string };

/** The two diagnostic questions that follow the chosen track. */
const DIAGNOSTIC: Record<
  "website" | "marketing" | "sales" | "general",
  {
    q1: { label: Bi; hint?: Bi; placeholder?: Bi };
    q2: { label: Bi; placeholder: Bi };
  }
> = {
  website: {
    q1: {
      label: { fr: "Quel est l'objectif numéro 1 de votre site ?", en: "What is the #1 objective of your website?" },
      hint: {
        fr: "Ex: Recevoir des messages WhatsApp, capturer des emails, vendre en ligne...",
        en: "E.g.: Receive contact requests, generate inbound qualified leads, online sales...",
      },
    },
    q2: {
      label: {
        fr: "Quelle est la page ou section que vous jugez la moins performante ?",
        en: "Which page or section do you feel is currently underperforming?",
      },
      placeholder: {
        fr: "Ex: La page d'accueil, la page tarifs, le formulaire...",
        en: "E.g.: Homepage, pricing table, contact form...",
      },
    },
  },
  marketing: {
    q1: {
      label: {
        fr: "Sur quels canaux êtes-vous le plus présent et quel est votre rythme ?",
        en: "Which channels are you most active on and at what frequency?",
      },
      hint: {
        fr: "Ex: LinkedIn (2x/semaine), Instagram Reels, newsletter...",
        en: "E.g.: LinkedIn (2x/week), Instagram Reels, newsletter...",
      },
    },
    q2: {
      label: { fr: "Liens vers vos principaux profils publics", en: "Links to your main public profiles" },
      placeholder: {
        fr: "Ex: instagram.com/votre_marque, linkedin.com/company/...",
        en: "E.g.: instagram.com/yourbrand, linkedin.com/company/...",
      },
    },
  },
  sales: {
    q1: {
      label: {
        fr: "Comment suivez-vous vos prospects entre le 1er message et la conclusion ?",
        en: "How do you track prospects between initial inquiry and closing?",
      },
      hint: {
        fr: "Ex: WhatsApp + carnet papier, Notion, CRM, tableur Excel...",
        en: "E.g.: WhatsApp + notes, Notion, CRM, spreadsheet...",
      },
    },
    q2: {
      label: {
        fr: "Quel est votre délai moyen de première réponse à une demande entrante ?",
        en: "What is your average response time to an incoming lead?",
      },
      placeholder: {
        fr: "Ex: Moins de 30 min, dans la journée, sous 48h...",
        en: "E.g.: Under 30 mins, same day, within 48h...",
      },
    },
  },
  general: {
    q1: {
      label: {
        fr: "Quel est le plus grand obstacle à la croissance de votre entreprise aujourd'hui ?",
        en: "What is the single biggest bottleneck to your growth today?",
      },
      placeholder: {
        fr: "Ex: Pas assez de contacts entrants, des prospects qui trouvent nos prix trop chers...",
        en: "E.g.: Not enough incoming leads, prospects hesitating on pricing...",
      },
    },
    q2: {
      label: { fr: "D'où proviennent vos meilleurs clients actuels ?", en: "Where do your best clients currently come from?" },
      placeholder: {
        fr: "Ex: Bouche-à-oreille, réseau direct, publications en ligne...",
        en: "E.g.: Word-of-mouth, direct network, online content...",
      },
    },
  },
};

function AuditWizardPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isEn = locale === "en";
  const tr = (text: Bi) => (isEn ? text.en : text.fr);

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

  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const mountTimeRef = React.useRef<number>(Date.now());

  // Save draft to sessionStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch {
        // private mode: the draft is simply not kept
      }
    }
  }, [formData]);

  const updateField = <K extends keyof WizardFormState>(field: K, value: WizardFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const trackOptions: ChoiceOption[] = [
    {
      value: "website",
      label: isEn ? "Website" : "Site Web",
      description: isEn
        ? "Mobile speed, clarity of your offer, contact / WhatsApp conversion path."
        : "Vitesse mobile, clarté de votre offre, parcours de prise de contact / WhatsApp.",
      icon: <Globe className="size-5" />,
    },
    {
      value: "marketing",
      label: isEn ? "Marketing & Visibility" : "Marketing & Visibilité",
      description: isEn
        ? "Consistency of public profiles, link-in-bio relevance, and content alignment."
        : "Cohérence des profils publics, pertinence du link-in-bio et alignement du contenu.",
      icon: <TrendingUp className="size-5" />,
    },
    {
      value: "sales",
      label: isEn ? "Sales & Follow-up" : "Ventes & Suivi",
      description: isEn
        ? "Handling incoming leads, follow-up leaks, and recommended automations."
        : "Traitement des leads entrants, fuites de relance et automatisations recommandées.",
      icon: <Workflow className="size-5" />,
    },
    {
      value: "general",
      label: isEn ? "I'm not sure" : "Je ne sais pas",
      description: isEn
        ? "Synthetic review of the 5 pillars to pinpoint your primary growth bottleneck."
        : "Revue synthétique des 5 piliers pour identifier votre blocage prioritaire.",
      icon: <HelpCircle className="size-5" />,
    },
  ];

  const teamOptions: ChoiceOption[] = [
    { value: "1-5", label: isEn ? "1 to 5 people" : "1 à 5 personnes" },
    { value: "6-15", label: isEn ? "6 to 15 people" : "6 à 15 personnes" },
    { value: "16-50", label: isEn ? "16 to 50 people" : "16 à 50 personnes" },
    { value: "50+", label: isEn ? "50+ people" : "Plus de 50 personnes" },
  ];

  const diag = DIAGNOSTIC[formData.track as keyof typeof DIAGNOSTIC] ?? DIAGNOSTIC.general;

  const questions: FlowQuestion[] = [
    {
      id: "track",
      title: isEn ? "Which diagnostic is your top priority?" : "Quel diagnostic souhaitez-vous en priorité ?",
      hint: isEn
        ? "Choose the track that matches your most pressing question right now."
        : "Choisissez le parcours qui correspond à votre plus grande interrogation actuelle.",
      autoAdvance: true,
      children: (
        <ChoiceList
          label={isEn ? "Audit track" : "Parcours d'audit"}
          options={trackOptions}
          value={formData.track}
          onChange={(value) => updateField("track", value as AuditTrack)}
        />
      ),
    },
    {
      id: "companyName",
      title: isEn ? "What's your company called?" : "Comment s'appelle votre entreprise ?",
      hint: isEn ? "Company or brand name." : "Nom de l'entreprise ou de la marque.",
      validate: () =>
        formData.companyName.trim()
          ? null
          : isEn
            ? "Company name is required."
            : "Le nom de l'entreprise est obligatoire.",
      children: (
        <FlowInput
          type="text"
          autoComplete="organization"
          placeholder={isEn ? "E.g. Bloom Studio, Horizon B2B..." : "Ex: Atelier Bloom, Horizon B2B..."}
          value={formData.companyName}
          onChange={(e) => updateField("companyName", e.target.value)}
        />
      ),
    },
    {
      id: "activitySector",
      title: isEn ? "What industry are you in?" : "Dans quel secteur travaillez-vous ?",
      validate: () =>
        formData.activitySector.trim()
          ? null
          : isEn
            ? "Industry / sector is required."
            : "Le secteur d'activité est obligatoire.",
      children: (
        <FlowInput
          type="text"
          placeholder={
            isEn
              ? "E.g. B2B Consulting, Luxury goods, E-commerce, SaaS..."
              : "Ex: Conseil B2B, E-commerce, Mode, SaaS..."
          }
          value={formData.activitySector}
          onChange={(e) => updateField("activitySector", e.target.value)}
        />
      ),
    },
    {
      id: "country",
      title: isEn ? "Which country do you mainly operate in?" : "Dans quel pays êtes-vous principalement actif ?",
      validate: () =>
        formData.country.trim() ? null : isEn ? "Country is required." : "Le pays est obligatoire.",
      children: (
        <FlowInput
          type="text"
          autoComplete="country-name"
          placeholder={
            isEn
              ? "E.g. France, Belgium, Switzerland, UK, International..."
              : "Ex: France, Belgique, Suisse, International..."
          }
          value={formData.country}
          onChange={(e) => updateField("country", e.target.value)}
        />
      ),
    },
    {
      id: "teamSize",
      title: isEn ? "How big is your team?" : "Combien de personnes dans votre équipe ?",
      autoAdvance: true,
      children: (
        <ChoiceList
          label={isEn ? "Team size" : "Taille de l'équipe"}
          options={teamOptions}
          value={formData.teamSize}
          onChange={(value) => updateField("teamSize", value)}
        />
      ),
    },
    {
      id: "websiteUrl",
      title: isEn ? "What's your website address?" : "Quelle est l'adresse de votre site web ?",
      hint: isEn
        ? "Optional, but recommended for the Website track."
        : "Facultatif, mais recommandé pour le parcours Site Web.",
      optional: true,
      children: (
        <FlowInput
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="https://votre-site.com"
          value={formData.websiteUrl}
          onChange={(e) => updateField("websiteUrl", e.target.value)}
        />
      ),
    },
    {
      id: "q1",
      title: tr(diag.q1.label),
      hint: diag.q1.hint ? tr(diag.q1.hint) : undefined,
      validate: () =>
        formData.q1.trim()
          ? null
          : isEn
            ? "This response is required to guide the audit."
            : "Cette réponse est nécessaire pour guider l'audit.",
      children: (
        <FlowTextarea
          placeholder={diag.q1.placeholder ? tr(diag.q1.placeholder) : undefined}
          value={formData.q1}
          onChange={(e) => updateField("q1", e.target.value)}
        />
      ),
    },
    {
      id: "q2",
      title: tr(diag.q2.label),
      optional: true,
      children: (
        <FlowInput
          type="text"
          placeholder={tr(diag.q2.placeholder)}
          value={formData.q2}
          onChange={(e) => updateField("q2", e.target.value)}
        />
      ),
    },
    {
      id: "contactName",
      title: isEn ? "What's your name?" : "Comment vous appelez-vous ?",
      hint: isEn ? "First and last name." : "Prénom et nom.",
      validate: () =>
        formData.contactName.trim().length >= 2
          ? null
          : isEn
            ? "Please enter your full name."
            : "Veuillez renseigner votre prénom et nom.",
      children: (
        <FlowInput
          type="text"
          autoComplete="name"
          placeholder={isEn ? "E.g. Alex Martin" : "Ex: Alexandre Martin"}
          value={formData.contactName}
          onChange={(e) => updateField("contactName", e.target.value)}
        />
      ),
    },
    {
      id: "contactEmail",
      title: isEn ? "What's your email address?" : "Quelle est votre adresse email ?",
      hint: isEn
        ? "A verification link will be immediately dispatched."
        : "Un lien de confirmation vous sera immédiatement expédié.",
      validate: () =>
        /^\S+@\S+\.\S+$/.test(formData.contactEmail.trim())
          ? null
          : isEn
            ? "A valid email address is required to receive the audit."
            : "Une adresse email valide est requise pour recevoir l'audit.",
      children: (
        <FlowInput
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="alex@acmecorp.com"
          value={formData.contactEmail}
          onChange={(e) => updateField("contactEmail", e.target.value)}
        />
      ),
    },
    {
      id: "contactPhone",
      title: isEn ? "And your WhatsApp number?" : "Et votre numéro WhatsApp ?",
      hint: isEn
        ? "International format recommended (e.g. +33 6 12 34 56 78)."
        : "Format international recommandé (ex : +33 6 12 34 56 78).",
      validate: () =>
        formData.contactPhone.trim().length >= 6
          ? null
          : isEn
            ? "A valid WhatsApp number with country code is required (e.g. +33 6 12 34 56 78)."
            : "Un numéro WhatsApp valide avec indicatif pays est requis (ex: +33 6 12 34 56 78).",
      children: (
        <FlowInput
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+33 6 12 34 56 78"
          value={formData.contactPhone}
          onChange={(e) => updateField("contactPhone", e.target.value)}
        />
      ),
    },
    {
      id: "consent",
      title: isEn ? "Last step: two confirmations." : "Dernière étape : deux confirmations.",
      hint: isEn
        ? "The interactive report will be delivered to your email address after confirmation."
        : "Le rapport interactif sera envoyé à votre adresse email après confirmation.",
      validate: () => {
        if (!formData.isEntitled) {
          return isEn
            ? "You must confirm you are authorized for this business."
            : "Vous devez confirmer être habilité(e) pour cette entreprise.";
        }
        if (!formData.privacyConsent) {
          return isEn
            ? "Your agreement with our privacy policy is required."
            : "Votre accord avec notre politique de confidentialité est requis.";
        }
        return null;
      },
      children: (
        <div className="grid gap-2.5">
          <CheckRow checked={formData.isEntitled} onChange={(value) => updateField("isEntitled", value)}>
            {isEn
              ? "I confirm that I am authorized to request this audit for this business and these public accounts."
              : "Je confirme être habilité(e) à demander cet audit pour cette entreprise et ces comptes publics."}
          </CheckRow>
          <CheckRow checked={formData.privacyConsent} onChange={(value) => updateField("privacyConsent", value)}>
            {isEn ? (
              <>
                I agree to my answers being processed to produce this audit, in accordance with the{" "}
                <Link to="/legal" target="_blank" rel="noopener" className="text-mint underline underline-offset-2">
                  privacy policy
                </Link>
                .
              </>
            ) : (
              <>
                J'accepte que mes réponses soient traitées pour la réalisation de cet audit, conformément à la{" "}
                <Link to="/legal" target="_blank" rel="noopener" className="text-mint underline underline-offset-2">
                  politique de confidentialité
                </Link>
                .
              </>
            )}
          </CheckRow>
        </div>
      ),
    },
  ];

  const handleSubmit = async () => {
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
        setServerError(res.error || (isEn ? "Something went wrong while sending." : "Une erreur est survenue lors de l'envoi."));
        setSubmitting(false);
        return;
      }

      // Clear draft on success
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
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
      const msg = err instanceof Error ? err.message : isEn ? "Network error" : "Erreur réseau";
      setServerError(msg);
      setSubmitting(false);
    }
  };

  return (
    <QuestionFlow
      questions={questions}
      // A track chosen on the presentation page skips the first question.
      initialIndex={search.track ? 1 : 0}
      exitHref="/audit"
      onSubmit={handleSubmit}
      submitting={submitting}
      error={serverError}
      labels={{
        next: isEn ? "Continue" : "Continuer",
        back: isEn ? "Previous question" : "Question précédente",
        skip: isEn ? "Skip" : "Passer",
        submit: isEn ? "Submit my audit request" : "Valider ma demande d'audit",
        submitting: isEn ? "Processing..." : "Traitement en cours...",
        exit: isEn ? "Leave the form" : "Quitter le formulaire",
      }}
      honeypot={
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="gotcha">Leave this field empty</label>
          <input
            id="gotcha"
            name="gotcha"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={formData.gotcha}
            onChange={(e) => updateField("gotcha", e.target.value)}
          />
        </div>
      }
    />
  );
}
