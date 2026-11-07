import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "motion/react";
import { Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";

import {
  CheckRow,
  ChoiceList,
  FlowFrame,
  FlowInput,
  FlowIntro,
  FlowTextarea,
  QuestionFlow,
  flowPrimaryButton,
  flowSecondaryButton,
  type ChoiceOption,
  type FlowQuestion,
} from "@/components/question-flow";
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
      className="flex size-14 items-center justify-center rounded-sm border border-mint bg-mint/15 text-mint"
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
            shouldReduce ? { duration: 0 } : { duration: 0.55, delay: 0.25, ease: easeVolkaOut }
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

const PRIMARY_GOALS = [
  "Mieux positionner et présenter mon entreprise",
  "Attirer plus de prospects pertinents",
  "Transformer davantage de visiteurs ou de demandes en opportunités",
  "Mieux organiser les ventes et le suivi des prospects",
  "Réduire les tâches manuelles et connecter mes outils",
  "Revoir plusieurs éléments de mon système de croissance",
  "Je connais le problème, mais pas encore la bonne solution",
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

  // A plan chosen on the offers page arrives as ?offer=...; in that case we don't ask again.
  const presetOffer =
    search.offer && offers.find((o) => o.id === search.offer) ? search.offer : "";

  const [started, setStarted] = useState(false);

  // Answers. Choice questions start empty so nothing is sent that the visitor never picked.
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("");
  const [location, setLocation] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState<WebsiteStatus>("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [primaryGoal, setPrimaryGoal] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [vision, setVision] = useState("");

  const [selectedOffer, setSelectedOffer] = useState<string>(presetOffer);
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredChannel, setPreferredChannel] = useState<PreferredChannel>("email");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionRef, setSubmissionRef] = useState<string>("");

  const required = (value: string, fr: string, en: string) => (value.trim() ? null : tr(fr, en));
  const pickOne = (value: string) =>
    value ? null : tr("Choisissez une réponse pour continuer.", "Pick an answer to continue.");

  const exitLabel = tr("Quitter le formulaire", "Leave the form");

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

  const channelLabel = channelOptions.find((c) => c.value === preferredChannel)?.label ?? "";
  const offerLabel =
    offers.find((o) => o.id === selectedOffer)?.translations[locale].name ??
    (selectedOffer === "Not sure yet" ? tr("Je ne sais pas encore", "Not sure yet") : selectedOffer);

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
          placeholder={tr("Cotonou, Abidjan, Paris ou international", "Cotonou, Abidjan, Paris or international")}
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
      id: "problem",
      group: 1,
      title: tr(
        "Qu'est-ce qui ne fonctionne pas comme vous le souhaitez ?",
        "What isn't working the way you'd like?",
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
          maxLength={900}
          placeholder={tr(
            "Ex. : nos prospects trouvent notre offre peu claire et nous relançons à la main...",
            "E.g. prospects find our offer unclear and we follow up by hand...",
          )}
          value={problemDescription}
          onChange={(e) => setProblemDescription(e.target.value)}
        />
      ),
    },
    {
      id: "vision",
      group: 1,
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

    // ── Group 2: framework ──
    ...(presetOffer
      ? []
      : [
          {
            id: "offer",
            group: 2,
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
          } satisfies FlowQuestion,
        ]),
    {
      id: "budget",
      group: 2,
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
      group: 2,
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

    // ── Group 3: contact ──
    {
      id: "name",
      group: 3,
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
      group: 3,
      title: tr("Quelle est votre adresse e-mail ?", "What's your email address?"),
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
      id: "channel",
      group: 3,
      title: tr(
        "Comment préférez-vous qu'on vous réponde ?",
        "How would you like us to get back to you?",
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
    // The number is only needed when they chose WhatsApp or a call.
    ...(preferredChannel === "email"
      ? []
      : [
          {
            id: "phone",
            group: 3,
            title: tr("Quel est votre numéro ?", "What's your number?"),
            hint: tr(
              "Avec l'indicatif du pays, par exemple +229 01 23 45 67 89.",
              "With the country code, for example +229 01 23 45 67 89.",
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
                placeholder="+229 01 23 45 67 89"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            ),
          } satisfies FlowQuestion,
        ]),
    {
      id: "consent",
      group: 3,
      title: tr("Dernière étape : une confirmation.", "Last step: one confirmation."),
      hint: tr(
        "Nous reviendrons vers vous avec une première lecture de votre situation.",
        "We will get back to you with a first read of your situation.",
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
                J'accepte que Volka utilise les informations transmises pour examiner ma demande et
                me recontacter à ce sujet. Consultez nos{" "}
                <Link
                  to="/legal"
                  target="_blank"
                  rel="noopener"
                  className="text-mint underline underline-offset-2"
                >
                  mentions légales et politique de confidentialité
                </Link>
                .
              </>
            ) : (
              <>
                I agree that Volka may process this information to review my project and contact
                me. View our{" "}
                <Link
                  to="/legal"
                  target="_blank"
                  rel="noopener"
                  className="text-mint underline underline-offset-2"
                >
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
    // Compile a structured brief for the backend
    const structuredChallenge = [
      `[Secteur] ${sector}`,
      `[Localisation] ${location}`,
      `[Site web] ${websiteStatus === "no" ? "Aucun" : websiteUrl || websiteStatus}`,
      `[Objectif prioritaire] ${primaryGoal}`,
      `[Point de friction principal] ${problemDescription}`,
    ].join("\n");

    const payload: InquiryInput = {
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      phone: phone.trim(),
      preferredChannel,
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
          tr(
            "Certaines réponses sont incomplètes. Revenez en arrière pour les vérifier.",
            "Some answers are incomplete. Go back to check them.",
          ),
      );
      setStatus("error");
      return;
    }

    setStatus("sending");

    try {
      await send({ data: payload });

      setSubmissionRef(`VK-${Date.now().toString(36).toUpperCase()}`);
      setStatus("sent");

      track("start_submit", {
        path: "/start",
        ...(location ? { source: location } : {}),
        metadata: { offer: selectedOffer, timeline, budgetRange },
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

  // ─── Thank you ───
  if (status === "sent") {
    const summary: { label: string; value: string; detail?: string }[] = [
      { label: tr("Entreprise", "Business"), value: company || name, detail: location },
      { label: tr("Accompagnement envisagé", "Engagement"), value: offerLabel, detail: budgetRange },
      {
        label: tr("Réponse par", "We'll reply by"),
        value: channelLabel,
        detail: preferredChannel === "email" ? email : phone || email,
      },
    ];
    const nextSteps = [
      tr("Nous lisons votre demande avec attention.", "We read your request carefully."),
      tr(
        "Si un point est flou, nous vous écrivons par le canal choisi.",
        "If something is unclear, we write to you on the channel you chose.",
      ),
      tr(
        "Nous vous proposons la suite la plus adaptée à votre situation.",
        "We propose the next step that fits your situation.",
      ),
    ];

    return (
      <FlowFrame exitHref="/" exitLabel={tr("Retour à l'accueil", "Back to home")}>
        <main className="flex flex-1 flex-col justify-center px-5 pb-12 pt-6 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeVolkaOut }}
            className="mx-auto w-full max-w-xl"
          >
            <div className="flex items-center gap-4">
              <AnimatedCheck />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/50">
                {tr("Réf.", "Ref.")} {submissionRef}
              </p>
            </div>

            <h1 className="mt-8 text-balance font-display text-[2.4rem] font-medium leading-[1.05] tracking-[-0.01em] text-paper sm:text-6xl">
              {tr("Merci, votre demande est bien reçue.", "Thank you, your request is in.")}
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-paper/70 sm:text-lg">
              {tr(
                "L'équipe Volka va examiner votre situation et vous répondre par le canal que vous avez choisi.",
                "The Volka team will review your situation and reply on the channel you chose.",
              )}
            </p>

            <dl className="mt-10 divide-y divide-paper/10 border-y border-paper/10">
              {summary.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-6 py-4">
                  <dt className="font-mono text-xs uppercase tracking-[0.16em] text-paper/45">
                    {row.label}
                  </dt>
                  <dd className="min-w-0 text-right">
                    <span className="block text-base text-paper">{row.value}</span>
                    {row.detail && (
                      <span className="block truncate text-sm text-paper/55">{row.detail}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-mint">
                {tr("Et maintenant", "What happens next")}
              </h2>
              <ol className="mt-5 space-y-4">
                {nextSteps.map((step, i) => (
                  <li key={step} className="flex gap-4 text-base leading-snug text-paper/80">
                    <span className="font-mono text-sm text-mint">0{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <Link to="/" className={`${flowPrimaryButton} w-full sm:w-auto`}>
                {tr("Retour à l'accueil", "Back to home")}
              </Link>
              <Link to="/audit" className={`${flowSecondaryButton} w-full sm:w-auto`}>
                {tr("Découvrir l'audit gratuit", "See the free audit")}
              </Link>
            </div>
          </motion.div>
        </main>
      </FlowFrame>
    );
  }

  // ─── Before the first question ───
  if (!started) {
    return (
      <FlowIntro
        eyebrow={tr("Démarrer un projet", "Start a project")}
        title={tr(
          "Quelques questions pour comprendre votre projet.",
          "A few questions to understand your project.",
        )}
        body={tr(
          "Prenez votre temps. Il n'y a pas de bonne ou de mauvaise réponse, vous pouvez revenir en arrière à tout moment, et rien n'est envoyé avant la toute dernière étape.",
          "Take your time. There are no right or wrong answers, you can go back at any moment, and nothing is sent before the very last step.",
        )}
        facts={[
          { value: "≈ 3 min", label: tr("pour répondre", "to answer") },
          { value: tr("1 par 1", "1 by 1"), label: tr("une question à la fois", "one question at a time") },
          { value: tr("0 engagement", "No strings"), label: tr("à ce stade", "at this stage") },
        ]}
        startLabel={tr("Commencer", "Begin")}
        onStart={() => setStarted(true)}
        exitHref="/"
        exitLabel={exitLabel}
      />
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
        // One event each time the visitor reaches a new block of questions.
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
        exit: exitLabel,
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
