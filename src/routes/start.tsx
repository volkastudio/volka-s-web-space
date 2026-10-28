import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowUpRight, ArrowLeft, ArrowRight, Check, Mail, MessageCircle, Sparkles } from "lucide-react";
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

const searchSchema = z.object({
  offer: z.string().optional(),
  source: z.string().optional(),
});

export const Route = createFileRoute("/start")({
  validateSearch: searchSchema,
  component: StartProject,
  head: () => ({
    meta: [
      { title: "Lancer un projet — Volka Studio" },
      {
        name: "description",
        content:
          "Dites-nous ce que vous bâtissez. Partagez votre périmètre, votre calendrier et votre budget — nous répondons sous un jour ouvré.",
      },
      { property: "og:title", content: "Lancer un projet — Volka Studio" },
      {
        property: "og:description",
        content: "Un brief concis, une réponse considérée sous un jour ouvré.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];
const TOTAL_STEPS = 4;

/** Animated SVG check drawn on form success. */
function AnimatedCheck() {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: easeVolkaOut }}
      className="flex size-16 items-center justify-center border border-gold"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <motion.path
          d="M5 14 L12 21 L23 8"
          stroke="oklch(0.69 0.151 65.8)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={
            shouldReduce
              ? { duration: 0 }
              : { duration: 0.55, delay: 0.35, ease: easeVolkaOut }
          }
        />
      </svg>
    </motion.div>
  );
}

/** Step indicator pill */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 24 : 6,
            backgroundColor:
              i < current
                ? "oklch(0.69 0.151 65.8)"
                : i === current
                  ? "oklch(0.28 0.055 172.6)"
                  : "oklch(0.82 0.018 85.8)",
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
  children,
}: {
  label: string;
  id: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-[0.14em] text-foreground/80">
        {label}
      </Label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/** Selectable card button */
function SelectCard({
  selected,
  onClick,
  title,
  subtitle,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={[
        "flex w-full items-start gap-4 border p-4 text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:border-primary/50 hover:bg-muted/40",
      ].join(" ")}
    >
      {icon && (
        <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <span className="block font-display text-xl leading-tight">{title}</span>
        {subtitle && (
          <span className={`mt-0.5 block text-xs ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {subtitle}
          </span>
        )}
      </div>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold"
        >
          <Check className="size-3 text-primary" />
        </motion.span>
      )}
    </motion.button>
  );
}

/** Channel card — active state uses illuminated orange icon bg on dark green */
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
        "flex w-full items-center gap-4 border p-4 text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:border-primary/50 hover:bg-muted/40",
      ].join(" ")}
    >
      {/* Icon circle — orange bg when active, default otherwise */}
      <span
        className={[
          "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
          selected
            ? "border-gold/60 bg-gold text-primary"
            : "border-border bg-background text-muted-foreground",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="font-display text-xl leading-tight">{title}</span>
    </motion.button>
  );
}

function StartProject() {
  const { t, locale, formatPrice } = useI18n();
  const search = useSearch({ from: "/start" });
  const send = useServerFn(submitInquiry);
  const mountedAt = useRef(Date.now());

  const { timelines, budgets } = t.startForm;

  // Resolve default offer from search param
  const defaultOffer =
    search.offer && offers.find((o) => o.id === search.offer)
      ? search.offer
      : (offers[0]?.id ?? "Résoudre un problème précis");

  const scopeOptions = [
    ...offers.map((o) => {
      const loc = o.translations[locale] || o.translations.fr;
      return {
        value: o.id,
        label: loc.name,
        detail: `${formatPrice(o.prices)} · ${loc.duration}`,
      };
    }),
    { value: "Not sure yet", label: t.startForm.scopeNotSure, detail: t.startForm.scopeNotSureDetail },
  ];

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<InquiryInput>({
    name: "",
    email: "",
    company: "",
    phone: "",
    preferredChannel: "email",
    offer: defaultOffer as InquiryInput["offer"],
    timeline: timelines[0]!,
    budgetRange: budgets[1] ?? budgets[0]!,
    vision: "",
    challenge: "",
    referralSource: "",
    website: "", // honeypot
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const set = <K extends keyof InquiryInput>(key: K, value: InquiryInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const validateStep = (s: number): boolean => {
    const next: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim()) next["name"] = "Votre nom est requis.";
      if (!form.email.trim()) next["email"] = "Votre email est requis.";
    }
    if (s === 3) {
      if (!form.vision.trim()) next["vision"] = "Partagez votre vision pour qu'on puisse vous aider.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) goNext();
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    const parsed = inquirySchema.safeParse(form);
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
        data: { ...parsed.data, locale, elapsedMs: Math.max(0, Date.now() - mountedAt.current) },
      });
      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue. Réessayez.");
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  if (status === "sent") {
    return (
      <main className="bg-background text-foreground">
        <SiteHeader />
        <section className="mx-auto max-w-3xl px-5 py-28 md:px-10 md:py-40 lg:px-14">
          <div className="flex items-center gap-4">
            <AnimatedCheck />
            <img
              src="/vectors/success.svg"
              alt="Success icon"
              width={500}
              height={500}
              className="size-16 object-contain"
            />
          </div>
          <motion.h1
            className="mt-10 font-display text-6xl leading-[0.95] md:text-7xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: easeVolkaOut }}
          >
            {t.form.successTitle}
          </motion.h1>
          <motion.p
            className="mt-8 text-lg font-light leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: easeVolkaOut }}
          >
            {t.form.successMessage}
          </motion.p>
          <motion.p
            className="mt-6 text-sm leading-relaxed text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {t.form.urgentNote}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: easeVolkaOut }}
          >
            <Button asChild variant="volka" size="volka" className="mt-12">
              <Link to="/cases">
                {t.form.seeCases} <ArrowUpRight />
              </Link>
            </Button>
          </motion.div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  const stepLabels = [
    "Vous",
    "Votre projet",
    "Calendrier & Budget",
    "Votre ambition",
  ];

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
                className="mt-3 font-display text-5xl font-medium leading-tight md:text-6xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
              >
                {t.form.title}
              </motion.h1>
            </div>
            <motion.div
              className="flex flex-col gap-2 md:items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <StepDots current={step} total={TOTAL_STEPS} />
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground/50">
                Étape {step + 1}/{TOTAL_STEPS} — {stepLabels[step]}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Onboarding wizard ─── */}
      <section className="min-h-[60vh] px-5 py-14 md:px-10 md:py-20 lg:px-14">
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
              value={form.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
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

              {/* ── Step 0: Contact info ── */}
              {step === 0 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">01 — Vous</p>
                    <h2 className="mt-3 font-display text-4xl font-medium">Commençons par faire connaissance.</h2>
                    <p className="mt-3 text-sm text-muted-foreground">Quelques informations pour qu'on sache à qui on parle.</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label={t.form.name} id="name" error={errors["name"]}>
                      <Input
                        id="name"
                        className="h-12 rounded-none border-border bg-background text-base"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        maxLength={100}
                        placeholder="Jean Dupont"
                        autoFocus
                      />
                    </Field>
                    <Field label={t.startForm.company} id="company">
                      <Input
                        id="company"
                        className="h-12 rounded-none border-border bg-background text-base"
                        value={form.company ?? ""}
                        onChange={(e) => set("company", e.target.value)}
                        maxLength={120}
                        placeholder="Acme Corp"
                      />
                    </Field>
                    <Field label={t.form.email} id="email" error={errors["email"]}>
                      <Input
                        id="email"
                        type="email"
                        className="h-12 rounded-none border-border bg-background text-base"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        maxLength={255}
                        placeholder="jean@example.com"
                      />
                    </Field>
                    <Field label={t.form.phone} id="phone">
                      <Input
                        id="phone"
                        className="h-12 rounded-none border-border bg-background text-base"
                        value={form.phone ?? ""}
                        onChange={(e) => set("phone", e.target.value)}
                        maxLength={40}
                        placeholder="+229 97 00 00 00"
                      />
                    </Field>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-foreground/80">{t.form.preferredChannel}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: "email", label: "Email", icon: <Mail className="size-4" /> },
                        { value: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="size-4" /> },
                      ] as const).map((ch) => (
                        <ChannelCard
                          key={ch.value}
                          selected={form.preferredChannel === ch.value}
                          onClick={() => set("preferredChannel", ch.value)}
                          title={ch.label}
                          icon={ch.icon}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 1: Scope ── */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">02 — Votre projet</p>
                    <h2 className="mt-3 font-display text-4xl font-medium">Quel type de projet avez-vous en tête ?</h2>
                    <p className="mt-3 text-sm text-muted-foreground">Choisissez la formule qui correspond le mieux à vos besoins.</p>
                  </div>

                  <div className="grid gap-3">
                    {scopeOptions.map((option) => (
                      <SelectCard
                        key={option.value}
                        selected={form.offer === option.value}
                        onClick={() => set("offer", option.value as InquiryInput["offer"])}
                        title={option.label}
                        subtitle={option.detail}
                        icon={option.value !== "Not sure yet" ? <Sparkles className="size-3.5" /> : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Timeline & Budget ── */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">03 — Calendrier & Budget</p>
                    <h2 className="mt-3 font-display text-4xl font-medium">Quand et avec quel budget ?</h2>
                    <p className="mt-3 text-sm text-muted-foreground">Aidez-nous à calibrer notre proposition.</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-foreground/80">{t.form.timelineLabel}</p>
                    <div className="grid gap-2">
                      {timelines.map((tl) => (
                        <SelectCard
                          key={tl}
                          selected={form.timeline === tl}
                          onClick={() => set("timeline", tl)}
                          title={tl}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-foreground/80">{t.form.budgetLabel}</p>
                    <div className="grid gap-2">
                      {budgets.map((b) => (
                        <SelectCard
                          key={b}
                          selected={form.budgetRange === b}
                          onClick={() => set("budgetRange", b)}
                          title={b}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Vision ── */}
              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">04 — Votre ambition</p>
                    <h2 className="mt-3 font-display text-4xl font-medium">Décrivez ce que vous bâtissez.</h2>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Plus vous partagez, mieux nous cernerons votre besoin.
                    </p>
                  </div>

                  <Field label={t.form.visionLabel} id="vision" error={errors["vision"]}>
                    <Textarea
                      id="vision"
                      rows={5}
                      className="rounded-none border-border bg-background text-base"
                      value={form.vision}
                      onChange={(e) => set("vision", e.target.value)}
                      maxLength={2000}
                      placeholder="Ex : Je lance une marque de mode éco-responsable à Cotonou et je veux être perçue comme une référence au niveau continental d'ici 2 ans..."
                    />
                  </Field>

                  <Field label={t.form.challengeLabel} id="challenge">
                    <Textarea
                      id="challenge"
                      rows={3}
                      className="rounded-none border-border bg-background text-base"
                      value={form.challenge ?? ""}
                      onChange={(e) => set("challenge", e.target.value)}
                      maxLength={2000}
                      placeholder="Optionnel — qu'est-ce qui bloque aujourd'hui ?"
                    />
                  </Field>

                  <Field label={t.form.referralLabel} id="referral">
                    <Input
                      id="referral"
                      className="h-12 rounded-none border-border bg-background text-base"
                      value={form.referralSource ?? ""}
                      onChange={(e) => set("referralSource", e.target.value)}
                      maxLength={120}
                      placeholder="Optionnel"
                    />
                  </Field>

                  {status === "error" && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
                    >
                      {errorMessage}
                    </motion.p>
                  )}

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t.startForm.privacyNote}
                  </p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* ─── Navigation buttons ─── */}
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-8">
            {step > 0 ? (
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Précédent
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS - 1 ? (
              <Button onClick={handleNext} variant="volka" size="volka">
                Suivant <ArrowRight className="size-4" />
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
                    {t.form.submitting}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {t.form.submit} <ArrowUpRight className="size-4" />
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-px w-full overflow-hidden bg-border">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.5, ease: easeOut }}
            />
          </div>
          <p className="mt-2 text-right text-xs text-muted-foreground">
            {Math.round(((step + 1) / TOTAL_STEPS) * 100)}% complété
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
