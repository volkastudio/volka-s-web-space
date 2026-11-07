import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "motion/react";
import { Mail, MessageCircle, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { z } from "zod";

import {
  CheckRow,
  ChoiceList,
  FlowInput,
  FlowTextarea,
  MultiChoiceList,
  QuestionFlow,
  type ChoiceOption,
  type FlowQuestion,
} from "@/components/question-flow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { submitInquiry } from "@/lib/inquiries.functions";
import { inquirySchema, type InquiryInput } from "@/lib/inquiry-schema";
import { offers } from "@/data/offers";
import { useI18n } from "@/i18n/context";
import { easeVolkaOut } from "@/lib/motion";
import { track } from "@/lib/analytics/tracker";

const searchSchema = z.object({
  offer: z.string().optional(),
  source: z.string().optional(),
});

export const Route = createFileRoute("/start")({
  validateSearch: searchSchema,
  component: StartProject,
  head: () => ({
    meta: [
      { title: "Démarrer un projet — Volka" },
      {
        name: "description",
        content:
          "Parlons de votre projet. Répondez à quelques questions pour nous aider à comprendre votre activité et ce que vous cherchez à améliorer. Aucun engagement à ce stade.",
      },
      { property: "og:title", content: "Démarrer un projet — Volka" },
      {
        property: "og:description",
        content:
          "Quelques questions pour comprendre votre entreprise et le type d'accompagnement qui pourrait vous convenir.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/** Animated SVG check drawn on form success. */
function AnimatedCheck() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: easeVolkaOut }}
      className="flex size-14 items-center justify-center rounded-full bg-mint/20 border border-mint text-mint"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <motion.path
          d="M6 14.5 L11.5 20 L22 8.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={
            shouldReduce
              ? { duration: 0 }
              : { duration: 0.55, delay: 0.25, ease: easeVolkaOut }
          }
        />
      </svg>
    </motion.div>
  );
}

const SECTORS = [
  "Services aux entreprises",
  "Technologie & numérique",
  "Commerce & distribution",
  "Santé & bien-être",
  "Immobilier & construction",
  "Finance & assurance",
  "Éducation & formation",
  "Hôtellerie, restauration & tourisme",
  "Industrie & fabrication",
  "Autre secteur",
] as const;

const ROLES = [
  "Fondateur / dirigeant",
  "Direction marketing ou commerciale",
  "Responsable d'équipe",
  "Autre rôle décisionnaire",
  "Autre",
] as const;

const PRIMARY_GOALS = [
  "Mieux positionner et présenter mon entreprise",
  "Attirer plus de prospects pertinents",
  "Transformer davantage de visiteurs ou de demandes en opportunités",
  "Mieux organiser les ventes et le suivi des prospects",
  "Réduire les tâches manuelles et connecter mes outils",
  "Revoir plusieurs éléments de mon système de croissance",
  "Je connais le problème, mais pas encore la bonne solution",
] as const;

const PILLARS_LIST = [
  {
    id: "perception",
    name: "Perception",
    desc: "Clarifier le positionnement, le message ou l'image de marque",
  },
  {
    id: "acquisition",
    name: "Acquisition",
    desc: "Attirer les bonnes personnes via les campagnes et contenus",
  },
  {
    id: "conversion",
    name: "Conversion",
    desc: "Faciliter le passage de l'intérêt à une opportunité qualifiée",
  },
  {
    id: "sales",
    name: "Ventes",
    desc: "Mieux organiser le pipeline commercial et les relances",
  },
  {
    id: "automation",
    name: "Automatisation",
    desc: "Réduire les tâches répétitives et connecter les outils",
  },
  {
    id: "not_sure",
    name: "Je ne suis pas sûr(e)",
    desc: "J'ai besoin d'aide pour identifier les priorités",
  },
] as const;

const ACTION_CHANNELS = [
  "Site web",
  "Messagerie instantanée (WhatsApp, Messenger…)",
  "Formulaire de contact",
  "Prise de rendez-vous en ligne",
  "Téléphone",
  "Réseaux sociaux",
  "Aucun parcours clair pour le moment",
] as const;

const SALES_TRACKING = [
  "CRM dédié",
  "Tableur (Excel, Google Sheets)",
  "Messageries instantanées et e-mails",
  "Plusieurs outils non connectés",
  "Pas de méthode définie",
] as const;

const toOptions = (values: readonly string[]): ChoiceOption[] =>
  values.map((value) => ({ value, label: value }));

type WebsiteStatus = "" | "yes" | "revamp" | "no";
type PreferredChannel = "email" | "whatsapp" | "phone";

function StartProject() {
  const { t, locale, formatOfferPrice } = useI18n();
  const search = useSearch({ from: "/start" });
  const send = useServerFn(submitInquiry);
  const mountedAt = useRef(Date.now());
  const lastGroup = useRef(-1);
  const isFr = locale === "fr";
  const tr = (fr: string, en: string) => (isFr ? fr : en);

  const { timelines, budgets } = t.startForm;

  // A plan chosen on the offers page arrives as ?offer=...; otherwise the visitor picks one.
  const presetOffer =
    search.offer && offers.find((o) => o.id === search.offer) ? search.offer : "";

  // Answers. Choice questions start empty so nothing is sent that the visitor never picked.
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("");
  const [location, setLocation] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState<WebsiteStatus>("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [role, setRole] = useState("");

  const [primaryGoal, setPrimaryGoal] = useState("");
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [problemDescription, setProblemDescription] = useState("");

  const [actionChannels, setActionChannels] = useState<string[]>([]);
  const [salesTracking, setSalesTracking] = useState("");
  const [automationNeeds, setAutomationNeeds] = useState("");

  const [vision, setVision] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<string>(presetOffer);
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredChannel, setPreferredChannel] = useState<PreferredChannel>("email");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionRef, setSubmissionRef] = useState<string>("");

  const toggleIn = (setter: Dispatch<SetStateAction<string[]>>, value: string) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const required = (value: string, fr: string, en: string) => (value.trim() ? null : tr(fr, en));
  const pickOne = (value: string) =>
    value ? null : tr("Choisissez une réponse pour continuer.", "Pick an answer to continue.");

  const websiteOptions: ChoiceOption[] = [
    { value: "yes", label: tr("Oui", "Yes") },
    { value: "revamp", label: tr("Existe, mais à revoir", "Needs a revamp") },
    { value: "no", label: tr("Non", "No") },
  ];

  const offerOptions: ChoiceOption[] = [
    ...offers.map((o) => {
      const loc = o.translations[locale] || o.translations.fr;
      return {
        value: o.id,
        label: loc.name,
        description: loc.tagline,
        badge: formatOfferPrice(o),
        icon: <Sparkles className="size-4" />,
      };
    }),
    {
      value: "Not sure yet",
      label: tr("Je ne sais pas encore", "Not sure yet"),
      description: tr(
        "J'aimerais être orienté(e) en fonction de ma situation et des priorités.",
        "I'd like guidance on the best starting point.",
      ),
    },
  ];

  const channelOptions: ChoiceOption[] = [
    { value: "email", label: "Email", icon: <Mail className="size-5" /> },
    { value: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="size-5" /> },
    { value: "phone", label: tr("Téléphone", "Phone"), icon: <Phone className="size-5" /> },
  ];

  const questions: FlowQuestion[] = [
    // ── Group 0: the business ──
    {
      id: "company",
      group: 0,
      title: tr("Comment s'appelle votre entreprise ?", "What's your company called?"),
      validate: () =>
        required(company, "Le nom de votre entreprise est requis.", "Company name is required."),
      children: (
        <FlowInput
          type="text"
          autoComplete="organization"
          maxLength={120}
          placeholder="Acme Corp"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      ),
    },
    {
      id: "sector",
      group: 0,
      title: tr("Dans quel secteur travaillez-vous ?", "What industry are you in?"),
      autoAdvance: true,
      validate: () => pickOne(sector),
      children: (
        <ChoiceList
          label={tr("Secteur d'activité", "Industry")}
          options={toOptions(SECTORS)}
          value={sector}
          onChange={setSector}
        />
      ),
    },
    {
      id: "location",
      group: 0,
      title: tr("Où votre entreprise est-elle basée ?", "Where is your company based?"),
      validate: () =>
        required(location, "La ville et le pays sont requis.", "Location is required."),
      children: (
        <FlowInput
          type="text"
          maxLength={100}
          placeholder={tr(
            "Paris, Bruxelles, Genève ou international",
            "Paris, London, New York or international",
          )}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      ),
    },
    {
      id: "websiteStatus",
      group: 0,
      title: tr("Avez-vous déjà un site web ?", "Do you already have a website?"),
      autoAdvance: true,
      validate: () => pickOne(websiteStatus),
      children: (
        <ChoiceList
          label={tr("Site web", "Website")}
          options={websiteOptions}
          value={websiteStatus}
          onChange={(value) => setWebsiteStatus(value as WebsiteStatus)}
        />
      ),
    },
    ...(websiteStatus === "yes" || websiteStatus === "revamp"
      ? [
          {
            id: "websiteUrl",
            group: 0,
            title: tr("Quelle est l'adresse de votre site ?", "What's your website address?"),
            hint: tr("Optionnel si le site n'est pas public.", "Optional if private."),
            optional: true,
            validate: () => {
              if (!websiteUrl.trim()) return null;
              try {
                new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
                return null;
              } catch {
                return tr("Veuillez entrer une adresse URL valide.", "Please enter a valid URL.");
              }
            },
            children: (
              <FlowInput
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="https://acmecorp.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            ),
          } satisfies FlowQuestion,
        ]
      : []),
    {
      id: "role",
      group: 0,
      title: tr("Quel est votre rôle dans l'entreprise ?", "What's your role in the business?"),
      autoAdvance: true,
      validate: () => pickOne(role),
      children: (
        <ChoiceList
          label={tr("Rôle", "Role")}
          options={toOptions(ROLES)}
          value={role}
          onChange={setRole}
        />
      ),
    },

    // ── Group 1: what to improve ──
    {
      id: "primaryGoal",
      group: 1,
      title: tr("Quel est votre principal objectif aujourd'hui ?", "What's your main goal today?"),
      autoAdvance: true,
      validate: () => pickOne(primaryGoal),
      children: (
        <ChoiceList
          label={tr("Objectif principal", "Primary goal")}
          options={toOptions(PRIMARY_GOALS)}
          value={primaryGoal}
          onChange={setPrimaryGoal}
        />
      ),
    },
    {
      id: "pillars",
      group: 1,
      title: tr("Quels domaines souhaitez-vous améliorer ?", "Which areas do you want to improve?"),
      hint: tr(
        "Choisissez tout ce qui vous semble pertinent. Pas besoin de connaître le jargon technique.",
        "Select all that apply. No need to know technical agency terms.",
      ),
      validate: () =>
        selectedPillars.length > 0
          ? null
          : tr("Choisissez au moins un domaine.", "Pick at least one area."),
      children: (
        <MultiChoiceList
          label={tr("Domaines à améliorer", "Areas to improve")}
          options={PILLARS_LIST.map((p) => ({ value: p.id, label: p.name, description: p.desc }))}
          values={selectedPillars}
          onToggle={(value) => toggleIn(setSelectedPillars, value)}
        />
      ),
    },
    {
      id: "problem",
      group: 1,
      title: tr(
        "Décrivez le problème principal que vous rencontrez",
        "Describe the main problem you face",
      ),
      hint: tr(
        "Quelques phrases suffisent pour exposer la situation.",
        "A few sentences are enough.",
      ),
      validate: () =>
        required(
          problemDescription,
          "Décrivez en quelques mots ce qui ne fonctionne pas comme vous le souhaiteriez.",
          "Please describe what is not working as expected.",
        ),
      children: (
        <FlowTextarea
          maxLength={600}
          placeholder={tr(
            "Ex. : nos prospects trouvent notre offre peu claire et nous relançons à la main...",
            "E.g. prospects find our offer unclear and we follow up by hand...",
          )}
          value={problemDescription}
          onChange={(e) => setProblemDescription(e.target.value)}
        />
      ),
    },

    // ── Group 2: how things work today (all optional) ──
    {
      id: "actionChannels",
      group: 2,
      title: tr(
        "Où vos prospects peuvent-ils passer à l'action aujourd'hui ?",
        "Where can prospects take action today?",
      ),
      hint: tr("Plusieurs choix possibles.", "Select all that apply."),
      optional: true,
      children: (
        <MultiChoiceList
          label={tr("Canaux actuels", "Current channels")}
          options={toOptions(ACTION_CHANNELS)}
          values={actionChannels}
          onToggle={(value) => toggleIn(setActionChannels, value)}
        />
      ),
    },
    {
      id: "salesTracking",
      group: 2,
      title: tr(
        "Comment suivez-vous les prospects et opportunités aujourd'hui ?",
        "How do you track opportunities today?",
      ),
      optional: true,
      autoAdvance: true,
      children: (
        <ChoiceList
          label={tr("Suivi commercial", "Sales tracking")}
          options={toOptions(SALES_TRACKING)}
          value={salesTracking}
          onChange={setSalesTracking}
        />
      ),
    },
    {
      id: "automationNeeds",
      group: 2,
      title: tr(
        "Quelles tâches aimeriez-vous simplifier ou automatiser ?",
        "Which tasks would you like to streamline or automate?",
      ),
      hint: tr(
        "Optionnel. Ex. : relancer automatiquement les devis, synchroniser les contacts, envoyer un email de confirmation...",
        "Optional. E.g. send automated follow-ups, sync leads into CRM...",
      ),
      optional: true,
      children: (
        <FlowTextarea
          maxLength={500}
          placeholder={tr(
            "Décrivez les tâches manuelles récurrentes...",
            "Describe recurring manual tasks...",
          )}
          value={automationNeeds}
          onChange={(e) => setAutomationNeeds(e.target.value)}
        />
      ),
    },

    // ── Group 3: outcome, framework, budget ──
    {
      id: "vision",
      group: 3,
      title: tr(
        "À quoi reconnaîtriez-vous que ce projet est une réussite ?",
        "What does success look like?",
      ),
      hint: tr(
        "Quel changement concret aimeriez-vous observer dans votre entreprise ?",
        "What concrete change do you expect to see?",
      ),
      validate: () =>
        vision.trim().length >= 20
          ? null
          : tr(
              "Précisez en quelques mots le résultat souhaité (au moins 20 caractères).",
              "Please describe the desired outcome (at least 20 characters).",
            ),
      children: (
        <FlowTextarea
          maxLength={2000}
          placeholder={tr(
            "Ex. : un site clair qui convertit 5 à 10 demandes qualifiées par mois...",
            "E.g. a clear site that yields 5-10 qualified leads per month...",
          )}
          value={vision}
          onChange={(e) => setVision(e.target.value)}
        />
      ),
    },
    {
      id: "offer",
      group: 3,
      title: tr(
        "Quel type d'accompagnement vous semble le plus adapté ?",
        "Which kind of support fits best?",
      ),
      autoAdvance: true,
      validate: () => pickOne(selectedOffer),
      children: (
        <ChoiceList
          label={tr("Accompagnement", "Engagement type")}
          options={offerOptions}
          value={selectedOffer}
          onChange={setSelectedOffer}
        />
      ),
    },
    {
      id: "budget",
      group: 3,
      title: tr("Quel budget avez-vous envisagé ?", "What budget did you have in mind?"),
      hint: tr(
        "Repère indicatif HT, pour cadrer le projet. Ce n'est pas un devis final.",
        "Excl. VAT. A planning benchmark, not a final quote.",
      ),
      autoAdvance: true,
      validate: () => pickOne(budgetRange),
      children: (
        <ChoiceList
          label={tr("Budget", "Budget")}
          options={toOptions(budgets)}
          value={budgetRange}
          onChange={setBudgetRange}
        />
      ),
    },
    {
      id: "timeline",
      group: 3,
      title: tr("Quand aimeriez-vous démarrer ?", "When would you like to start?"),
      autoAdvance: true,
      validate: () => pickOne(timeline),
      children: (
        <ChoiceList
          label={tr("Calendrier", "Timeline")}
          options={toOptions(timelines)}
          value={timeline}
          onChange={setTimeline}
        />
      ),
    },

    // ── Group 4: contact ──
    {
      id: "name",
      group: 4,
      title: tr("Comment vous appelez-vous ?", "What's your name?"),
      hint: tr("Prénom et nom.", "First and last name."),
      validate: () =>
        name.trim().length >= 2
          ? null
          : tr("Votre nom complet est requis.", "Your name is required."),
      children: (
        <FlowInput
          type="text"
          autoComplete="name"
          maxLength={100}
          placeholder={tr("Alexandre Martin", "Alex Martin")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      ),
    },
    {
      id: "email",
      group: 4,
      title: tr("Quelle est votre adresse e-mail professionnelle ?", "What's your work email?"),
      validate: () =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
          ? null
          : tr("Une adresse email valide est requise.", "A valid email is required."),
      children: (
        <FlowInput
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          maxLength={255}
          placeholder="alex@acmecorp.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      ),
    },
    {
      id: "phone",
      group: 4,
      title: tr("Quel est votre numéro de téléphone ?", "What's your phone number?"),
      hint: tr(
        "Indicatif pays recommandé (ex. : +33 6 12 34 56 78).",
        "Country code recommended.",
      ),
      validate: () =>
        required(
          phone,
          "Un numéro de téléphone avec indicatif est requis.",
          "Phone number with country code is required.",
        ),
      children: (
        <FlowInput
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={40}
          placeholder="+33 6 12 34 56 78"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      ),
    },
    {
      id: "channel",
      group: 4,
      title: tr(
        "Quel est le meilleur moyen de vous contacter ?",
        "What's the best way to reach you?",
      ),
      autoAdvance: true,
      children: (
        <ChoiceList
          label={tr("Canal préféré", "Preferred channel")}
          options={channelOptions}
          value={preferredChannel}
          onChange={(value) => setPreferredChannel(value as PreferredChannel)}
        />
      ),
    },
    {
      id: "consent",
      group: 4,
      title: tr("Dernière étape : une confirmation.", "Last step: one confirmation."),
      hint: tr(
        "Nous reviendrons vers vous avec une analyse préliminaire.",
        "We will get back to you with a preliminary review.",
      ),
      validate: () =>
        consent
          ? null
          : tr(
              "Veuillez accepter l'utilisation des données pour l'examen de votre demande.",
              "Please consent to the processing of your inquiry.",
            ),
      children: (
        <div className="space-y-5">
          <CheckRow checked={consent} onChange={setConsent}>
            {isFr ? (
              <>
                J'accepte que Volka utilise les informations transmises pour examiner ma demande et me
                recontacter à ce sujet. Consultez nos{" "}
                <Link to="/legal" target="_blank" rel="noopener" className="text-mint underline underline-offset-2">
                  mentions légales et politique de confidentialité
                </Link>
                .
              </>
            ) : (
              <>
                I agree that Volka may process this information to review my project and contact me. View
                our{" "}
                <Link to="/legal" target="_blank" rel="noopener" className="text-mint underline underline-offset-2">
                  privacy policy
                </Link>
                .
              </>
            )}
          </CheckRow>
          <p className="text-xs leading-relaxed text-paper/50">
            {tr(
              "L'envoi de ce formulaire ne vaut pas acceptation du projet ni validation d'un devis. Nous étudierons votre demande avant de vous proposer la suite la plus pertinente.",
              "Submitting this form does not mean the project is accepted or that a quote has been issued. We will review your request before proposing the most relevant next step.",
            )}
          </p>
        </div>
      ),
    },
  ];

  const handleSubmit = async () => {
    // Compile rich structured brief for the backend
    const structuredChallenge = [
      `[Secteur] ${sector}`,
      `[Localisation] ${location}`,
      `[Site web] ${websiteStatus === "no" ? "Aucun" : websiteUrl || websiteStatus}`,
      `[Rôle] ${role}`,
      `[Objectif prioritaire] ${primaryGoal}`,
      `[Piliers ciblés] ${selectedPillars.join(", ")}`,
      `[Point de friction principal] ${problemDescription}`,
      actionChannels.length > 0 ? `[Parcours actuel des prospects] ${actionChannels.join(", ")}` : null,
      salesTracking ? `[Organisation commerciale] ${salesTracking}` : null,
      automationNeeds ? `[Besoins d'automatisation] ${automationNeeds}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const payload: InquiryInput = {
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      phone: phone.trim(),
      preferredChannel: preferredChannel === "phone" ? "whatsapp" : preferredChannel,
      offer: selectedOffer,
      timeline,
      budgetRange,
      vision: vision.trim(),
      challenge: structuredChallenge,
      referralSource: `Localisation: ${location}`,
      website: honeypot,
      locale,
      elapsedMs: Math.max(0, Date.now() - mountedAt.current),
    };

    const parsed = inquirySchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ??
          tr("Certaines réponses sont incomplètes. Revenez en arrière pour les vérifier.", "Some answers are incomplete. Go back to check them."),
      );
      setStatus("error");
      return;
    }

    setStatus("sending");

    try {
      await send({
        data: payload,
      });

      const refCode = `VK-${Date.now().toString(36).toUpperCase()}`;
      setSubmissionRef(refCode);
      setStatus("sent");

      track("start_submit", {
        path: "/start",
        ...(location ? { source: location } : {}),
        metadata: {
          offer: selectedOffer,
          timeline,
          budgetRange,
        },
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : tr(
              "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
              "Something went wrong while sending. Please try again.",
            ),
      );
    }
  };

  // ─── Executive Confirmation / Thank You Screen ───
  if (status === "sent") {
    return (
      <main className="min-h-screen bg-forest-black text-paper font-sans">
        <SiteHeader />

        <section className="relative px-5 py-20 sm:py-28 md:px-10 lg:px-14 overflow-hidden">
          {/* Ambient glow backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-mint/15 blur-3xl animate-liquid-glow"
          />

          <div className="relative mx-auto max-w-3xl">
            {/* Header pill */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeVolkaOut }}
              className="flex items-center gap-3"
            >
              <AnimatedCheck />
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint/10 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-mint">
                  <ShieldCheck className="size-3.5" />
                  {isFr ? "Demande bien enregistrée" : "Inquiry registered"}
                </span>
                <p className="font-mono text-xs text-paper/40">
                  {isFr ? "Réf." : "Ref."} {submissionRef}
                </p>
              </div>
            </motion.div>

            {/* Title & Core message matching Section 15 */}
            <motion.h1
              className="mt-8 font-display text-4xl sm:text-5xl md:text-6xl font-light leading-tight tracking-tight text-paper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: easeVolkaOut }}
            >
              {isFr ? "Merci, nous avons bien reçu votre demande." : "Thank you, your request has been received."}
            </motion.h1>

            <motion.div
              className="mt-6 space-y-4 text-base sm:text-lg text-paper/80 font-light leading-relaxed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: easeVolkaOut }}
            >
              <p>
                {isFr
                  ? "Merci de nous avoir présenté votre projet. L'équipe Volka va examiner les informations transmises pour mieux comprendre votre situation et déterminer la suite la plus pertinente."
                  : "Thank you for introducing your project. The Volka team will review your information to understand your situation and recommend the most relevant next step."}
              </p>
              <p className="text-sm text-paper/60">
                {isFr
                  ? "Si nous avons besoin d'une précision, nous vous contacterons par le moyen que vous avez indiqué."
                  : "If we need any clarification, we will reach out through your preferred contact channel."}
              </p>
            </motion.div>

            {/* Receipt Summary Card */}
            <motion.div
              className="mt-10 rounded-2xl border border-paper/15 bg-paper/[0.04] p-6 sm:p-8 backdrop-blur-md space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: easeVolkaOut }}
            >
              <div className="flex items-center justify-between border-b border-paper/10 pb-4">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-mint">
                  {isFr ? "Récapitulatif de votre brief" : "Intake summary"}
                </span>
                <span className="font-mono text-xs text-paper/50">
                  {new Date().toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="block text-xs font-mono text-paper/40 uppercase tracking-wider">
                    {isFr ? "Entreprise" : "Business"}
                  </span>
                  <span className="font-medium text-paper text-base mt-0.5 block">
                    {company || name}
                  </span>
                  <span className="text-xs text-paper/60">{location}</span>
                </div>

                <div>
                  <span className="block text-xs font-mono text-paper/40 uppercase tracking-wider">
                    {isFr ? "Accompagnement envisagé" : "Target engagement"}
                  </span>
                  <span className="font-medium text-paper text-base mt-0.5 block">
                    {offers.find((o) => o.id === selectedOffer)?.translations[locale].name ??
                      selectedOffer}
                  </span>
                  <span className="text-xs text-mint/80">{budgetRange}</span>
                </div>

                <div>
                  <span className="block text-xs font-mono text-paper/40 uppercase tracking-wider">
                    {isFr ? "Contact" : "Contact"}
                  </span>
                  <span className="font-medium text-paper mt-0.5 block">{name}</span>
                  <span className="text-xs text-paper/60">{email}</span>
                </div>

                <div>
                  <span className="block text-xs font-mono text-paper/40 uppercase tracking-wider">
                    {isFr ? "Canal préféré" : "Preferred channel"}
                  </span>
                  <span className="font-medium text-paper capitalize mt-0.5 block">
                    {preferredChannel}
                  </span>
                  <span className="text-xs text-paper/60">{phone}</span>
                </div>
              </div>
            </motion.div>

            {/* Next Steps Roadmap */}
            <motion.div
              className="mt-10 space-y-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: easeVolkaOut }}
            >
              <h3 className="font-display text-xl font-light text-paper">
                {isFr ? "Ce qui se passe maintenant" : "What happens next"}
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-paper/10 bg-paper/[0.02] p-4 space-y-1.5">
                  <span className="font-mono text-xs text-mint">01</span>
                  <p className="font-medium text-sm text-paper">
                    {isFr ? "Analyse du dossier" : "Review & analysis"}
                  </p>
                  <p className="text-xs text-paper/65 leading-relaxed">
                    {isFr
                      ? "Nous étudions vos réponses et vos supports publics sous 48h ouvrées."
                      : "We review your answers and public touchpoints within 48 business hours."}
                  </p>
                </div>

                <div className="rounded-xl border border-paper/10 bg-paper/[0.02] p-4 space-y-1.5">
                  <span className="font-mono text-xs text-mint">02</span>
                  <p className="font-medium text-sm text-paper">
                    {isFr ? "Échange de cadrage" : "Clarification check"}
                  </p>
                  <p className="text-xs text-paper/65 leading-relaxed">
                    {isFr
                      ? "Si des clarifications sont utiles, nous vous contactons par votre canal favori."
                      : "If details need sharpening, we reach out via your preferred channel."}
                  </p>
                </div>

                <div className="rounded-xl border border-paper/10 bg-paper/[0.02] p-4 space-y-1.5">
                  <span className="font-mono text-xs text-mint">03</span>
                  <p className="font-medium text-sm text-paper">
                    {isFr ? "Suite proposée" : "Proposed next step"}
                  </p>
                  <p className="text-xs text-paper/65 leading-relaxed">
                    {isFr
                      ? "Proposition d'un plan d'intervention ou recommandation adaptée."
                      : "A concrete proposal or recommendation suited to your priorities."}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="mt-12 flex flex-col sm:flex-row items-center gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: easeVolkaOut }}
            >
              <Button asChild variant="volka" size="volka" className="w-full sm:w-auto">
                <Link to="/">{isFr ? "Retour à l'accueil" : "Back to home"}</Link>
              </Button>
              <Link
                to="/audit"
                className="text-xs font-mono uppercase tracking-[0.14em] text-paper/60 transition-colors hover:text-mint"
              >
                {isFr ? "Découvrir l'audit gratuit" : "See the free audit"}
              </Link>
            </motion.div>
          </div>
        </section>

        <SiteFooter />
      </main>
    );
  }

  return (
    <QuestionFlow
      questions={questions}
      exitHref="/"
      onSubmit={handleSubmit}
      submitting={status === "sending"}
      error={status === "error" ? errorMessage : null}
      onStep={(question) => {
        // Same signal as before: one event each time the visitor reaches a new block of questions.
        const group = question.group ?? 0;
        if (group !== lastGroup.current) {
          lastGroup.current = group;
          track("start_step_view", { path: "/start", metadata: { step: group } });
        }
      }}
      labels={{
        next: tr("Continuer", "Continue"),
        back: tr("Question précédente", "Previous question"),
        skip: tr("Passer", "Skip"),
        submit: tr("Envoyer ma demande", "Submit my inquiry"),
        submitting: tr("Envoi de votre demande...", "Submitting..."),
        exit: tr("Quitter le formulaire", "Leave the form"),
      }}
      honeypot={
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Leave this field empty</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>
      }
    />
  );
}
