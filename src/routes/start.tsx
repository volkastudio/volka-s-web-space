import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Check } from "lucide-react";
import { useState } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inquirySchema, submitInquiry, type InquiryInput } from "@/lib/inquiries.functions";

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

const offers = [
  { value: "Présence", label: "Présence", detail: "400 000 FCFA / 950 € · 10 days" },
  { value: "Autorité", label: "Autorité", detail: "From 1 000 000 FCFA / 2 200 € · 18 days" },
  { value: "Expansion", label: "Expansion", detail: "From 1 850 000 FCFA / 4 500 € · scoped" },
  { value: "Accompagnement continu", label: "Ongoing partnership", detail: "Monthly retainer" },
  { value: "Not sure yet", label: "Not sure yet", detail: "Help me choose" },
];

const timelines = ["As soon as possible", "Within a month", "In two to three months", "Later this year", "Still exploring"];
const budgets = [
  "Under 500 000 FCFA / 800 €",
  "500 000 – 1 000 000 FCFA / 800 – 1 500 €",
  "1 000 000 – 2 000 000 FCFA / 1 500 – 3 000 €",
  "2 000 000 – 5 000 000 FCFA / 3 000 – 7 500 €",
  "Above 5 000 000 FCFA / 7 500 €",
];

const emptyForm: InquiryInput = {
  name: "",
  email: "",
  company: "",
  phone: "",
  preferredChannel: "email",
  offer: "Présence",
  timeline: "As soon as possible",
  budgetRange: budgets[1]!,
  vision: "",
  challenge: "",
  referralSource: "",
};

const fieldClass = "mt-2 h-12 rounded-none border-border bg-background text-base";

function StartProject() {
  const send = useServerFn(submitInquiry);
  const [form, setForm] = useState<InquiryInput>(emptyForm);
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
      await send({ data: parsed.data });
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
          <span className="flex size-14 items-center justify-center border border-gold text-gold">
            <Check className="size-6" />
          </span>
          <h1 className="mt-10 font-display text-6xl leading-[0.95] md:text-7xl">Your brief is with us.</h1>
          <p className="mt-8 text-lg font-light leading-relaxed text-muted-foreground">
            Thank you, {form.name.split(" ")[0]}. We read every brief ourselves and reply within one working day —
            {form.preferredChannel === "whatsapp" ? " by WhatsApp" : " by email"} to {form.preferredChannel === "whatsapp" && form.phone ? form.phone : form.email}.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            If it is urgent, write to us directly at{" "}
            <a className="underline hover:text-foreground" href="mailto:hello@volkastudio.com">hello@volkastudio.com</a>.
          </p>
          <Button asChild variant="volka" size="volka" className="mt-12">
            <a href="/cases">See our case studies <ArrowUpRight /></a>
          </Button>
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
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Start a project</p>
          <h1 className="mt-6 max-w-4xl font-display text-6xl font-medium leading-[0.92] md:text-8xl">
            Tell us what you are building.
          </h1>
          <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
            No calendar links, no discovery call before we understand you. Send a short brief and we reply within one
            working day with a considered answer.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <form onSubmit={handleSubmit} className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.55fr_1.45fr]">
          <aside className="space-y-8 text-sm leading-relaxed text-muted-foreground">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground">How this works</p>
              <p className="mt-3">You send a brief. We read it, then reply with our honest read of the work, a scope and a price.</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground">Response time</p>
              <p className="mt-3">One working day, Monday to Friday, Cotonou time.</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground">Prefer to write directly?</p>
              <p className="mt-3">
                <a className="underline hover:text-foreground" href="mailto:hello@volkastudio.com">hello@volkastudio.com</a>
              </p>
            </div>
          </aside>

          <div className="space-y-12">
            <fieldset className="border-t border-border pt-8">
              <legend className="sr-only">About you</legend>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">01 — About you</p>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" className={fieldClass} value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} />
                  {errors["name"] && <p className="mt-2 text-xs text-destructive">{errors["name"]}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" className={fieldClass} value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={255} />
                  {errors["email"] && <p className="mt-2 text-xs text-destructive">{errors["email"]}</p>}
                </div>
                <div>
                  <Label htmlFor="company">Business or project name</Label>
                  <Input id="company" className={fieldClass} value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} maxLength={120} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone or WhatsApp (optional)</Label>
                  <Input id="phone" className={fieldClass} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} maxLength={40} />
                </div>
              </div>
              <div className="mt-6">
                <Label>Preferred reply</Label>
                <div className="mt-3 flex gap-3">
                  {(["email", "whatsapp"] as const).map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => set("preferredChannel", channel)}
                      className={`border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors ${
                        form.preferredChannel === channel
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                      }`}
                    >
                      {channel === "email" ? "Email" : "WhatsApp"}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>

            <fieldset className="border-t border-border pt-8">
              <legend className="sr-only">Scope</legend>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">02 — Scope</p>
              <div className="mt-8 grid gap-3 md:grid-cols-2">
                {offers.map((offer) => (
                  <button
                    key={offer.value}
                    type="button"
                    onClick={() => set("offer", offer.value)}
                    className={`border p-5 text-left transition-colors ${
                      form.offer === offer.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
                    }`}
                  >
                    <span className="font-display text-2xl">{offer.label}</span>
                    <span className={`mt-1 block text-xs ${form.offer === offer.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {offer.detail}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="timeline">When would you like to launch?</Label>
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
                  <Label htmlFor="budget">Budget range</Label>
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
            </fieldset>

            <fieldset className="border-t border-border pt-8">
              <legend className="sr-only">Your ambition</legend>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">03 — Your ambition</p>
              <div className="mt-8 space-y-6">
                <div>
                  <Label htmlFor="vision">What are you building, and where do you want it to be in a year?</Label>
                  <Textarea id="vision" rows={5} className="mt-2 rounded-none border-border bg-background text-base" value={form.vision} onChange={(e) => set("vision", e.target.value)} maxLength={2000} />
                  {errors["vision"] && <p className="mt-2 text-xs text-destructive">{errors["vision"]}</p>}
                </div>
                <div>
                  <Label htmlFor="challenge">What is not working today? (optional)</Label>
                  <Textarea id="challenge" rows={4} className="mt-2 rounded-none border-border bg-background text-base" value={form.challenge ?? ""} onChange={(e) => set("challenge", e.target.value)} maxLength={2000} />
                </div>
                <div>
                  <Label htmlFor="referral">How did you hear about Volka? (optional)</Label>
                  <Input id="referral" className={fieldClass} value={form.referralSource ?? ""} onChange={(e) => set("referralSource", e.target.value)} maxLength={120} />
                </div>
              </div>
            </fieldset>

            {status === "error" && (
              <p className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{errorMessage}</p>
            )}

            <div className="flex flex-col gap-5 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                We only use what you send here to reply to your enquiry.
              </p>
              <Button type="submit" variant="volka" size="volka" disabled={status === "sending"} className="shrink-0">
                {status === "sending" ? "Sending…" : "Send my brief"} <ArrowUpRight />
              </Button>
            </div>
          </div>
        </form>
      </section>

      <SiteFooter />
    </main>
  );
}
