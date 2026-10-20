import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";

import { Reveal } from "@/components/reveal";
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

export const Route = createFileRoute("/start")({
  component: StartProject,
  head: () => ({
    meta: [
      { title: "Start a project — Volka Studio" },
      {
        name: "description",
        content:
          "Tell us about your business and your ambition. Share your scope, timeline and budget and we reply within one working day.",
      },
      { property: "og:title", content: "Start a project — Volka Studio" },
      {
        property: "og:description",
        content: "A short brief, a considered reply within one working day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const fieldClass = "mt-2 h-12 rounded-none border-border bg-background text-base";

/**
 * Animated SVG check drawn on form success.
 * Uses stroke-dashoffset animation for the path-draw effect.
 */
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

function StartProject() {
  const { t, locale } = useI18n();
  const send = useServerFn(submitInquiry);
  const mountedAt = useRef(Date.now());

  const { timelines, budgets } = t.startForm;

  // Scope options derived from the single source of truth in offers.ts
  const scopeOptions = [
    ...offers.map((o) => ({
      value: o.id,
      label: o.name,
      detail: `${o.prices.xof} / ${o.prices.eur} · ${o.duration}`,
    })),
    { value: "Not sure yet", label: t.startForm.scopeNotSure, detail: t.startForm.scopeNotSureDetail },
  ];

  const [form, setForm] = useState<InquiryInput>({
    name: "",
    email: "",
    company: "",
    phone: "",
    preferredChannel: "email",
    offer: "Présence",
    timeline: timelines[0]!,
    budgetRange: budgets[1] ?? budgets[0]!,
    vision: "",
    challenge: "",
    referralSource: "",
    website: "", // honeypot: must stay empty
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const set = <K extends keyof InquiryInput>(key: K, value: InquiryInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "sent") {
    return (
      <main className="bg-background text-foreground">
        <SiteHeader />
        <section className="mx-auto max-w-3xl px-5 py-28 md:px-10 md:py-40 lg:px-14">
          <AnimatedCheck />
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

  return (
    <main className="bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t.form.eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-6xl font-medium leading-[0.92] md:text-8xl">
              {t.form.title}
            </h1>
            <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
              {t.form.subtitle}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <form onSubmit={handleSubmit} className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.55fr_1.45fr]">
          <aside className="space-y-8 text-sm leading-relaxed text-muted-foreground">
            <Reveal>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground">
                  {t.form.howItWorks}
                </p>
                <p className="mt-3">{t.form.howItWorksText}</p>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground">
                  {t.form.responseTime}
                </p>
                <p className="mt-3">{t.form.responseTimeText}</p>
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground">
                  {t.form.directMail}
                </p>
                <p className="mt-3">
                  <a className="underline hover:text-foreground" href="mailto:hello@volkastudio.com">
                    hello@volkastudio.com
                  </a>
                </p>
              </div>
            </Reveal>
          </aside>

          <div className="space-y-12">
            {/* Honeypot: invisible to people and assistive tech, tempting to bots. */}
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

            {/* Step 1 — About you */}
            <fieldset className="border-t border-border pt-8">
              <legend className="sr-only">{t.form.step1}</legend>
              <Reveal>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">{t.form.step1}</p>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">{t.form.name}</Label>
                    <Input id="name" className={fieldClass} value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} />
                    {errors["name"] && <p className="mt-2 text-xs text-destructive">{errors["name"]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">{t.form.email}</Label>
                    <Input id="email" type="email" className={fieldClass} value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={255} />
                    {errors["email"] && <p className="mt-2 text-xs text-destructive">{errors["email"]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="company">
                      {t.startForm.company}
                    </Label>
                    <Input id="company" className={fieldClass} value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} maxLength={120} />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t.form.phone}</Label>
                    <Input id="phone" className={fieldClass} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} maxLength={40} />
                  </div>
                </div>
                <div className="mt-6">
                  <Label>{t.form.preferredChannel}</Label>
                  <div className="mt-3 flex gap-3">
                    {(["email", "whatsapp"] as const).map((channel) => (
                      <motion.button
                        key={channel}
                        type="button"
                        onClick={() => set("preferredChannel", channel)}
                        whileTap={{ scale: 0.97 }}
                        className={`border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                          form.preferredChannel === channel
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                        }`}
                      >
                        {channel === "email" ? "Email" : "WhatsApp"}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </Reveal>
            </fieldset>

            {/* Step 2 — Scope */}
            <fieldset className="border-t border-border pt-8">
              <legend className="sr-only">{t.form.step2}</legend>
              <Reveal>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">{t.form.step2}</p>
                <div className="mt-8 grid gap-3 md:grid-cols-2">
                  {scopeOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => set("offer", option.value)}
                      whileTap={{ scale: 0.98 }}
                      className={`border p-5 text-left transition-colors ${
                        form.offer === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <span className="font-display text-2xl">{option.label}</span>
                      <span className={`mt-1 block text-xs ${form.offer === option.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {option.detail}
                      </span>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="timeline">{t.form.timelineLabel}</Label>
                    <select
                      id="timeline"
                      value={form.timeline}
                      onChange={(e) => set("timeline", e.target.value)}
                      className="mt-2 h-12 w-full border border-border bg-background px-3 text-base"
                    >
                      {timelines.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="budget">{t.form.budgetLabel}</Label>
                    <select
                      id="budget"
                      value={form.budgetRange}
                      onChange={(e) => set("budgetRange", e.target.value)}
                      className="mt-2 h-12 w-full border border-border bg-background px-3 text-base"
                    >
                      {budgets.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>
              </Reveal>
            </fieldset>

            {/* Step 3 — Your ambition */}
            <fieldset className="border-t border-border pt-8">
              <legend className="sr-only">{t.form.step3}</legend>
              <Reveal>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">{t.form.step3}</p>
                <div className="mt-8 space-y-6">
                  <div>
                    <Label htmlFor="vision">{t.form.visionLabel}</Label>
                    <Textarea id="vision" rows={5} className="mt-2 rounded-none border-border bg-background text-base" value={form.vision} onChange={(e) => set("vision", e.target.value)} maxLength={2000} />
                    {errors["vision"] && <p className="mt-2 text-xs text-destructive">{errors["vision"]}</p>}
                  </div>
                  <div>
                    <Label htmlFor="challenge">{t.form.challengeLabel}</Label>
                    <Textarea id="challenge" rows={4} className="mt-2 rounded-none border-border bg-background text-base" value={form.challenge ?? ""} onChange={(e) => set("challenge", e.target.value)} maxLength={2000} />
                  </div>
                  <div>
                    <Label htmlFor="referral">{t.form.referralLabel}</Label>
                    <Input id="referral" className={fieldClass} value={form.referralSource ?? ""} onChange={(e) => set("referralSource", e.target.value)} maxLength={120} />
                  </div>
                </div>
              </Reveal>
            </fieldset>

            {status === "error" && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
              >
                {errorMessage}
              </motion.p>
            )}

            <div className="flex flex-col gap-5 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                {t.startForm.privacyNote}
              </p>
              <Button
                type="submit"
                variant="volka"
                size="volka"
                disabled={status === "sending"}
                className="shrink-0"
              >
                {status === "sending" ? t.form.submitting : t.form.submit}{" "}
                <ArrowUpRight />
              </Button>
            </div>
          </div>
        </form>
      </section>

      <SiteFooter />
    </main>
  );
}
