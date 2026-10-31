import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  ShieldCheck,
  Building2,
  Target,
  Workflow,
  Compass,
  FileText,
} from "lucide-react";
import { useRef, useState } from "react";
import { z } from "zod";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];
const TOTAL_STEPS = 5;

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

/** Step indicator dots */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 24 : 6,
            backgroundColor:
              i < current
                ? "oklch(0.69 0.151 65.8)"
                : i === current
                  ? "oklch(0.82 0.055 168.8)"
                  : "rgba(255, 255, 255, 0.25)",
          }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="h-1.5 rounded-full"
        />
      ))}
    </div>
  );
}

/** Animated field wrapper */
function Field({
  label,
  id,
  error,
  required = false,
  helperText,
  children,
}: {
  label: string;
  id: string;
  error?: string | undefined;
  required?: boolean;
  helperText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
          {label} {required && <span className="text-primary">*</span>}
        </Label>
      </div>
      {children}
      {helperText && !error && (
        <p className="text-[11px] text-muted-foreground/80 leading-normal">{helperText}</p>
      )}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/** Selectable card button (single-select) */
function SelectCard({
  selected,
  onClick,
  title,
  subtitle,
  badge,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      className={[
        "group relative flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-md ring-1 ring-primary"
          : "border-border/70 bg-background/60 hover:border-primary/40 hover:bg-muted/40",
      ].join(" ")}
    >
      {icon && (
        <span
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
            selected
              ? "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground"
              : "border-border bg-background text-muted-foreground group-hover:text-foreground"
          }`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="block font-display text-base sm:text-lg font-medium leading-snug">
            {title}
          </span>
          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold ${
                selected
                  ? "bg-mint text-forest-black"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <span
            className={`mt-1 block text-xs leading-relaxed ${
              selected ? "text-primary-foreground/75" : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
      <div className="shrink-0 pt-0.5">
        <span
          className={`flex size-4 items-center justify-center rounded-full border transition-colors ${
            selected
              ? "border-mint bg-mint text-forest-black"
              : "border-border/80 bg-background"
          }`}
        >
          {selected && <Check className="size-2.5 stroke-[3]" />}
        </span>
      </div>
    </motion.button>
  );
}

/** Multi-select pill toggle */
function MultiPill({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 ${
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary text-foreground"
          : "border-border/60 bg-background/50 hover:border-primary/40 hover:bg-muted/30 text-foreground/80"
      }`}
    >
      <div
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/80 bg-background"
        }`}
      >
        {selected && <Check className="size-2.5 stroke-[3]" />}
      </div>
      <div className="min-w-0">
        <span className="block text-sm font-medium leading-snug">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block text-xs text-muted-foreground leading-normal">
            {subtitle}
          </span>
        )}
      </div>
    </button>
  );
}

/** Channel selector card */
function ChannelCard({
  selected,
  onClick,
  title,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={[
        "flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary"
          : "border-border/70 bg-background/60 hover:border-primary/50 hover:bg-muted/40",
      ].join(" ")}
    >
      <span
        className={[
          "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
          selected
            ? "border-gold/60 bg-gold text-forest-black"
            : "border-border bg-background text-muted-foreground",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="font-display text-base font-medium">{title}</span>
    </motion.button>
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

function StartProject() {
  const { t, locale, formatOfferPrice } = useI18n();
  const search = useSearch({ from: "/start" });
  const send = useServerFn(submitInquiry);
  const mountedAt = useRef(Date.now());
  const isFr = locale === "fr";

  const { timelines, budgets } = t.startForm;

  // Resolve default offer from search param
  const defaultOffer =
    search.offer && offers.find((o) => o.id === search.offer)
      ? search.offer
      : (offers[0]?.id ?? "Résoudre un problème précis");

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Extended state matching Section 13 & 14
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState<string>(SECTORS[0]!);
  const [location, setLocation] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState<"yes" | "no" | "revamp">("yes");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [role, setRole] = useState<string>(ROLES[0]!);

  const [primaryGoal, setPrimaryGoal] = useState<string>(PRIMARY_GOALS[0]!);
  const [selectedPillars, setSelectedPillars] = useState<string[]>(["perception"]);
  const [problemDescription, setProblemDescription] = useState("");

  const [actionChannels, setActionChannels] = useState<string[]>([ACTION_CHANNELS[0]!]);
  const [salesTracking, setSalesTracking] = useState<string>(SALES_TRACKING[0]!);
  const [automationNeeds, setAutomationNeeds] = useState("");

  const [vision, setVision] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<string>(defaultOffer);
  const [budgetRange, setBudgetRange] = useState<string>(budgets[1] ?? budgets[0]!);
  const [timeline, setTimeline] = useState<string>(timelines[0]!);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredChannel, setPreferredChannel] = useState<"email" | "whatsapp" | "phone">("email");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionRef, setSubmissionRef] = useState<string>("");

  const togglePillar = (id: string) => {
    setSelectedPillars((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleActionChannel = (ch: string) => {
    setActionChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const stepLabels = isFr
    ? ["Entreprise", "Objectifs", "Fonctionnement", "Projet & Budget", "Coordonnées"]
    : ["Business", "Goals", "Operations", "Project & Budget", "Contact"];

  const validateStep = (s: number): boolean => {
    const next: Record<string, string> = {};

    if (s === 0) {
      if (!company.trim()) next["company"] = isFr ? "Le nom de votre entreprise est requis." : "Company name is required.";
      if (!location.trim()) next["location"] = isFr ? "La ville et le pays sont requis." : "Location is required.";
      if ((websiteStatus === "yes" || websiteStatus === "revamp") && websiteUrl.trim()) {
        try {
          new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
        } catch {
          next["websiteUrl"] = isFr ? "Veuillez entrer une adresse URL valide." : "Please enter a valid URL.";
        }
      }
    } else if (s === 1) {
      if (!problemDescription.trim()) {
        next["problemDescription"] = isFr
          ? "Décrivez en quelques mots ce qui ne fonctionne pas comme vous le souhaiteriez."
          : "Please describe what is not working as expected.";
      }
    } else if (s === 3) {
      if (!vision.trim() || vision.trim().length < 10) {
        next["vision"] = isFr
          ? "Précisez en quelques phrases le résultat souhaité (au moins 10 caractères)."
          : "Please specify the desired outcome (at least 10 characters).";
      }
    } else if (s === 4) {
      if (!name.trim()) next["name"] = isFr ? "Votre nom complet est requis." : "Your name is required.";
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        next["email"] = isFr ? "Une adresse email valide est requise." : "A valid email is required.";
      }
      if (!phone.trim()) {
        next["phone"] = isFr ? "Un numéro de téléphone avec indicatif est requis." : "Phone number with country code is required.";
      }
      if (!consent) {
        next["consent"] = isFr
          ? "Veuillez accepter l'utilisation des données pour l'examen de votre demande."
          : "Please consent to the processing of your inquiry.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    setDirection(1);
    setStep((s) => {
      const nextStep = Math.min(s + 1, TOTAL_STEPS - 1);
      track("start_step_view", {
        path: "/start",
        metadata: { step: nextStep },
      });
      return nextStep;
    });
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleNext = () => {
    if (validateStep(step)) goNext();
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    // Compile rich structured brief for the backend
    const structuredChallenge = [
      `[Secteur] ${sector}`,
      `[Localisation] ${location}`,
      `[Site web] ${websiteStatus === "no" ? "Aucun" : websiteUrl || websiteStatus}`,
      `[Rôle] ${role}`,
      `[Objectif prioritaire] ${primaryGoal}`,
      `[Piliers ciblés] ${selectedPillars.join(", ")}`,
      `[Point de friction principal] ${problemDescription}`,
      `[Parcours actuel des prospects] ${actionChannels.join(", ")}`,
      `[Organisation commerciale] ${salesTracking}`,
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
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
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
        source: location || undefined,
        metadata: {
          offer: selectedOffer,
          timeline,
          budgetRange,
        },
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Une erreur est survenue lors de l'envoi. Veuillez réessayer."
      );
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 30 : -30, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -30 : 30, opacity: 0 }),
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
                    {selectedOffer}
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
                <Link to="/">
                  {isFr ? "Retour à l'accueil" : "Back to home"}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="volka"
                className="w-full sm:w-auto border-paper/20 text-paper hover:bg-paper/10 hover:text-paper"
              >
                <Link to="/cases">
                  {isFr ? "Découvrir nos concepts" : "Explore concept work"} <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Link
                to="/journal"
                className="text-xs font-mono uppercase tracking-[0.14em] text-paper/50 hover:text-paper transition-colors py-2 px-3"
              >
                {isFr ? "Lire le Journal" : "Read the Journal"}
              </Link>
            </motion.div>
          </div>
        </section>

        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground">
      <SiteHeader />

      {/* ─── Page header ─── */}
      <section className="border-b border-border bg-primary px-5 py-12 text-primary-foreground md:px-10 md:py-16 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <motion.p
                className="text-xs font-medium uppercase tracking-[0.2em] text-gold"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: easeOut }}
              >
                {t.form.eyebrow}
              </motion.p>
              <motion.h1
                className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl font-medium leading-tight"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
              >
                {t.form.title}
              </motion.h1>
              <motion.p
                className="mt-4 max-w-2xl text-sm md:text-base font-light text-primary-foreground/75 leading-relaxed"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: easeOut }}
              >
                {t.form.subtitle}
              </motion.p>
            </div>
            <motion.div
              className="flex flex-col gap-2 md:items-end shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <StepDots current={step} total={TOTAL_STEPS} />
              <p className="text-xs font-mono uppercase tracking-[0.14em] text-primary-foreground/60">
                {isFr
                  ? `Étape ${step + 1}/${TOTAL_STEPS} — ${stepLabels[step]}`
                  : `Step ${step + 1} of ${TOTAL_STEPS} — ${stepLabels[step]}`}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Onboarding wizard ─── */}
      <section className="min-h-[60vh] px-5 py-12 md:px-10 md:py-16 lg:px-14">
        <div className="mx-auto max-w-2xl">
          {/* Honeypot */}
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

          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: easeOut }}
            >
              {/* ── Step 0 (1/5): Votre entreprise ── */}
              {step === 0 && (
                <div className="space-y-7">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.2em] text-primary">
                      <Building2 className="size-3.5" />
                      {isFr ? "Étape 01 — Votre entreprise" : "Step 01 — Your business"}
                    </span>
                    <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">
                      {isFr ? "Commençons par comprendre votre activité." : "Let's start by understanding your business."}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isFr
                        ? "Quelques détails pour contextualiser votre environnement de marché."
                        : "A few details to understand your market and context."}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field
                        label={isFr ? "Nom de votre entreprise" : "Company name"}
                        id="company"
                        required
                        error={errors["company"]}
                      >
                        <Input
                          id="company"
                          className="h-12 rounded-lg border-border bg-background text-base"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          maxLength={120}
                          placeholder="Acme Corp"
                          autoFocus
                        />
                      </Field>
                    </div>

                    <div>
                      <Field
                        label={isFr ? "Secteur d'activité" : "Industry"}
                        id="sector"
                        required
                      >
                        <select
                          id="sector"
                          value={sector}
                          onChange={(e) => setSector(e.target.value)}
                          className="h-12 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                        >
                          {SECTORS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div>
                      <Field
                        label={isFr ? "Où votre entreprise est-elle basée ?" : "Company location"}
                        id="location"
                        required
                        error={errors["location"]}
                      >
                        <Input
                          id="location"
                          className="h-12 rounded-lg border-border bg-background text-base"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          maxLength={100}
                          placeholder={isFr ? "Paris, France ou Cotonou, Bénin" : "City, Country"}
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-2 space-y-3">
                      <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                        {isFr ? "Avez-vous déjà un site web ?" : "Do you already have a website?"} *
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {[
                          { id: "yes", label: isFr ? "Oui" : "Yes" },
                          { id: "revamp", label: isFr ? "Existe, mais à revoir" : "Needs a revamp" },
                          { id: "no", label: isFr ? "Non" : "No" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setWebsiteStatus(opt.id as any)}
                            className={`rounded-lg border p-3 text-center text-xs font-medium transition-all ${
                              websiteStatus === opt.id
                                ? "border-primary bg-primary text-primary-foreground font-semibold"
                                : "border-border bg-background hover:border-primary/50 text-foreground/80"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {(websiteStatus === "yes" || websiteStatus === "revamp") && (
                        <div className="pt-2">
                          <Field
                            label={isFr ? "Adresse de votre site web" : "Website URL"}
                            id="websiteUrl"
                            error={errors["websiteUrl"]}
                            helperText={isFr ? "Optionnel si le site n'est pas public." : "Optional if private."}
                          >
                            <Input
                              id="websiteUrl"
                              type="url"
                              className="h-12 rounded-lg border-border bg-background text-base"
                              value={websiteUrl}
                              onChange={(e) => setWebsiteUrl(e.target.value)}
                              placeholder="https://acmecorp.com"
                            />
                          </Field>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                        {isFr ? "Quel est votre rôle dans l'entreprise ?" : "Your role in the business"} *
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {ROLES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`rounded-lg border p-3 text-left text-xs font-medium transition-all ${
                              role === r
                                ? "border-primary bg-primary text-primary-foreground font-semibold"
                                : "border-border bg-background hover:border-primary/50 text-foreground/80"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 1 (2/5): Ce que vous voulez améliorer ── */}
              {step === 1 && (
                <div className="space-y-7">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.2em] text-primary">
                      <Target className="size-3.5" />
                      {isFr ? "Étape 02 — Ce que vous voulez améliorer" : "Step 02 — What you want to improve"}
                    </span>
                    <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">
                      {isFr ? "Qu'est-ce qui vous amène chez Volka aujourd'hui ?" : "What brings you to Volka today?"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isFr
                        ? "Identifions le blocage qui freine votre dynamique commerciale."
                        : "Let's identify the bottleneck slowing down your growth."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                      {isFr ? "Quel est votre principal objectif aujourd'hui ?" : "Primary goal today"} *
                    </Label>
                    <div className="grid gap-2">
                      {PRIMARY_GOALS.map((goal) => (
                        <SelectCard
                          key={goal}
                          selected={primaryGoal === goal}
                          onClick={() => setPrimaryGoal(goal)}
                          title={goal}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                      {isFr ? "Quels domaines souhaitez-vous améliorer ?" : "Pillars to improve"} *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isFr
                        ? "Choisissez tout ce qui vous semble pertinent. Pas besoin de connaître le jargon technique."
                        : "Select all that apply. No need to know technical agency terms."}
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {PILLARS_LIST.map((pillar) => (
                        <MultiPill
                          key={pillar.id}
                          selected={selectedPillars.includes(pillar.id)}
                          onClick={() => togglePillar(pillar.id)}
                          title={pillar.name}
                          subtitle={pillar.desc}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Field
                      label={isFr ? "Décrivez le problème principal que vous rencontrez" : "Describe the main problem you face"}
                      id="problemDescription"
                      required
                      error={errors["problemDescription"]}
                      helperText={isFr ? "Quelques phrases suffisent pour exposer la situation." : "A few sentences are enough."}
                    >
                      <Textarea
                        id="problemDescription"
                        rows={4}
                        className="rounded-lg border-border bg-background text-base"
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                        maxLength={1000}
                        placeholder={
                          isFr
                            ? "Ex. : Que se passe-t-il aujourd'hui ? Nos prospects trouvent notre offre peu claire et nous passons trop de temps à relancer manuellement sans savoir où les opportunités se perdent..."
                            : "What is happening today? Prospects struggle to understand our difference and we lose track of leads..."
                        }
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* ── Step 2 (3/5): Votre fonctionnement actuel ── */}
              {step === 2 && (
                <div className="space-y-7">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.2em] text-primary">
                      <Workflow className="size-3.5" />
                      {isFr ? "Étape 03 — Votre fonctionnement actuel" : "Step 03 — Current operations"}
                    </span>
                    <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">
                      {isFr ? "Quelques détails sur votre point de départ." : "A few details on where you stand."}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isFr
                        ? "Comprendre vos flux existants permet de concevoir une intervention réaliste."
                        : "Understanding your current setup allows us to scope a realistic intervention."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                      {isFr ? "Où vos prospects peuvent-ils passer à l'action aujourd'hui ?" : "Where can prospects take action today?"}
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {ACTION_CHANNELS.map((ch) => (
                        <MultiPill
                          key={ch}
                          selected={actionChannels.includes(ch)}
                          onClick={() => toggleActionChannel(ch)}
                          title={ch}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                      {isFr ? "Comment suivez-vous les prospects et opportunités aujourd'hui ?" : "How do you track opportunities today?"}
                    </Label>
                    <div className="grid gap-2">
                      {SALES_TRACKING.map((st) => (
                        <SelectCard
                          key={st}
                          selected={salesTracking === st}
                          onClick={() => setSalesTracking(st)}
                          title={st}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Field
                      label={isFr ? "Quelles tâches aimeriez-vous simplifier ou automatiser ? (Optionnel)" : "Tasks to automate or streamline (Optional)"}
                      id="automationNeeds"
                      helperText={isFr ? "Ex. : relancer automatiquement les devis, synchroniser les contacts, envoyer un email de confirmation..." : "E.g. send automated follow-ups, sync leads into CRM..."}
                    >
                      <Textarea
                        id="automationNeeds"
                        rows={3}
                        className="rounded-lg border-border bg-background text-base"
                        value={automationNeeds}
                        onChange={(e) => setAutomationNeeds(e.target.value)}
                        maxLength={1000}
                        placeholder={isFr ? "Décrivez les tâches manuelles récurrentes..." : "Describe recurring manual tasks..."}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* ── Step 3 (4/5): Résultat souhaité, calendrier et budget ── */}
              {step === 3 && (
                <div className="space-y-7">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.2em] text-primary">
                      <Compass className="size-3.5" />
                      {isFr ? "Étape 04 — Résultat souhaité & Cadre" : "Step 04 — Target outcome & Framework"}
                    </span>
                    <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">
                      {isFr ? "Définissons le cadre de votre projet." : "Let's define your project framework."}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isFr
                        ? "Précisez votre niveau d'ambition et les repères budgétaires envisagés."
                        : "Outline your desired outcome and initial budget expectations."}
                    </p>
                  </div>

                  <div>
                    <Field
                      label={isFr ? "À quoi reconnaîtriez-vous que ce projet est une réussite ?" : "What does success look like?"}
                      id="vision"
                      required
                      error={errors["vision"]}
                      helperText={isFr ? "Quel changement concret aimeriez-vous observer dans votre entreprise ?" : "What concrete change do you expect to see?"}
                    >
                      <Textarea
                        id="vision"
                        rows={4}
                        className="rounded-lg border-border bg-background text-base"
                        value={vision}
                        onChange={(e) => setVision(e.target.value)}
                        maxLength={2000}
                        placeholder={
                          isFr
                            ? "Ex. : Nous aimerions disposer d'un site clair qui convertit 5 à 10 demandes qualifiées par mois, avec un suivi CRM fluide sans perte de prospects..."
                            : "E.g. We want a clear value proposition and a system that yields 5-10 qualified leads per month..."
                        }
                      />
                    </Field>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                      {isFr ? "Quel type d'accompagnement vous semble le plus adapté ?" : "Preferred engagement type"} *
                    </Label>
                    <div className="grid gap-2.5">
                      {offers.map((o) => {
                        const loc = o.translations[locale] || o.translations.fr;
                        return (
                          <SelectCard
                            key={o.id}
                            selected={selectedOffer === o.id}
                            onClick={() => setSelectedOffer(o.id)}
                            title={loc.name}
                            subtitle={loc.tagline}
                            badge={formatOfferPrice(o)}
                            icon={<Sparkles className="size-3.5 text-primary" />}
                          />
                        );
                      })}
                      <SelectCard
                        selected={selectedOffer === "Not sure yet"}
                        onClick={() => setSelectedOffer("Not sure yet")}
                        title={isFr ? "Je ne sais pas encore" : "Not sure yet"}
                        subtitle={
                          isFr
                            ? "J'aimerais être orienté(e) en fonction de ma situation et des priorités."
                            : "I'd like guidance on the best starting point."
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                      {isFr ? "Quel budget avez-vous envisagé ? (repère indicatif HT)" : "Budget range (excl. VAT)"} *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isFr
                        ? "Les montants indiqués sont des repères pour cadrer le projet, pas un devis final."
                        : "These amounts are planning benchmarks, not a final quote."}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {budgets.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBudgetRange(b)}
                          className={`rounded-xl border p-3.5 text-left text-xs font-medium transition-all ${
                            budgetRange === b
                              ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "border-border/70 bg-background hover:border-primary/50 text-foreground/85"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                      {isFr ? "Quand aimeriez-vous démarrer ?" : "When would you like to start?"} *
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {timelines.map((tl) => (
                        <button
                          key={tl}
                          type="button"
                          onClick={() => setTimeline(tl)}
                          className={`rounded-xl border p-3.5 text-left text-xs font-medium transition-all ${
                            timeline === tl
                              ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "border-border/70 bg-background hover:border-primary/50 text-foreground/85"
                          }`}
                        >
                          {tl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 4 (5/5): Vos coordonnées ── */}
              {step === 4 && (
                <div className="space-y-7">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.2em] text-primary">
                      <FileText className="size-3.5" />
                      {isFr ? "Étape 05 — Vos coordonnées" : "Step 05 — Your contact details"}
                    </span>
                    <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">
                      {isFr ? "Où pouvons-nous vous recontacter ?" : "Where can we get back to you?"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isFr
                        ? "Dernière étape. Nous reviendrons vers vous avec une analyse préliminaire."
                        : "Final step. We will get back to you with a preliminary review."}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field
                        label={isFr ? "Votre prénom et nom" : "Your full name"}
                        id="name"
                        required
                        error={errors["name"]}
                      >
                        <Input
                          id="name"
                          className="h-12 rounded-lg border-border bg-background text-base"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          maxLength={100}
                          placeholder={isFr ? "Alexandre Martin" : "Alex Martin"}
                          autoFocus
                        />
                      </Field>
                    </div>

                    <div>
                      <Field
                        label={isFr ? "Votre adresse e-mail professionnelle" : "Work email address"}
                        id="email"
                        required
                        error={errors["email"]}
                      >
                        <Input
                          id="email"
                          type="email"
                          className="h-12 rounded-lg border-border bg-background text-base"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          maxLength={255}
                          placeholder="alex@acmecorp.com"
                        />
                      </Field>
                    </div>

                    <div>
                      <Field
                        label={isFr ? "Votre numéro de téléphone" : "Phone number"}
                        id="phone"
                        required
                        error={errors["phone"]}
                        helperText={isFr ? "Indicatif pays recommandé (ex. : +33 6 12 34 56 78)." : "Country code recommended."}
                      >
                        <Input
                          id="phone"
                          className="h-12 rounded-lg border-border bg-background text-base"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          maxLength={40}
                          placeholder="+33 6 12 34 56 78"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-mono uppercase tracking-[0.16em] text-foreground/80">
                      {isFr ? "Quel est le meilleur moyen de vous contacter ?" : "Best way to reach you"} *
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <ChannelCard
                        selected={preferredChannel === "email"}
                        onClick={() => setPreferredChannel("email")}
                        title="Email"
                        icon={<Mail className="size-4" />}
                      />
                      <ChannelCard
                        selected={preferredChannel === "whatsapp"}
                        onClick={() => setPreferredChannel("whatsapp")}
                        title="WhatsApp"
                        icon={<MessageCircle className="size-4" />}
                      />
                      <ChannelCard
                        selected={preferredChannel === "phone"}
                        onClick={() => setPreferredChannel("phone")}
                        title={isFr ? "Téléphone" : "Phone"}
                        icon={<Phone className="size-4" />}
                      />
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 size-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground">
                        {isFr ? (
                          <>
                            J'accepte que Volka utilise les informations transmises pour examiner ma demande et me recontacter à ce sujet. Consultez nos{" "}
                            <Link to="/legal" className="text-primary underline underline-offset-2">
                              mentions légales et politique de confidentialité
                            </Link>
                            .
                          </>
                        ) : (
                          <>
                            I agree that Volka may process this information to review my project and contact me. View our{" "}
                            <Link to="/legal" className="text-primary underline underline-offset-2">
                              privacy policy
                            </Link>
                            .
                          </>
                        )}
                      </span>
                    </label>
                    {errors["consent"] && (
                      <p className="mt-1.5 text-xs text-destructive font-medium">
                        {errors["consent"]}
                      </p>
                    )}
                  </div>

                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive"
                    >
                      {errorMessage}
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ─── Navigation buttons ─── */}
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> {isFr ? "Précédent" : "Previous"}
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
              >
                {isFr ? "Annuler" : "Cancel"}
              </Link>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <Button onClick={handleNext} variant="volka" size="volka">
                {isFr ? "Continuer" : "Continue"} <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                variant="volka"
                size="volka"
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    {isFr ? "Envoi de votre demande..." : "Submitting..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isFr ? "Envoyer ma demande" : "Submit my inquiry"} <ArrowUpRight className="size-4" />
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* Legal disclaimer under button matching Section 13 */}
          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/80 max-w-xl mx-auto">
            {isFr
              ? "L'envoi de ce formulaire ne vaut pas acceptation du projet ni validation d'un devis. Nous étudierons votre demande avant de vous proposer la suite la plus pertinente."
              : "Submitting this form does not mean the project is accepted or that a quote has been issued. We will review your request before proposing the most relevant next step."}
          </p>

          {/* Progress bar */}
          <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-border/60">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: easeOut }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>
              {isFr ? `Étape ${step + 1} sur ${TOTAL_STEPS}` : `Step ${step + 1} of ${TOTAL_STEPS}`}
            </span>
            <span>
              {Math.round(((step + 1) / TOTAL_STEPS) * 100)}% {isFr ? "complété" : "completed"}
            </span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
