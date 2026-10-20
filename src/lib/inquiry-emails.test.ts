import { describe, it, expect } from "vitest";

import { buildAutoReply, buildNotificationEmail, type EmailContext } from "./inquiry-emails";
import type { InquiryInput } from "./inquiry-schema";

const ctx: EmailContext = {
  siteUrl: "https://volka.example/",
  inquiryId: "11111111-2222-3333-4444-555555555555",
  contactEmail: "hello@volka.example",
  whatsappNumber: "22990000000",
};

const base: InquiryInput = {
  name: "Mariam Adjovi",
  email: "mariam@example.com",
  company: "Atelier Noir",
  phone: "+22991000000",
  preferredChannel: "email",
  offer: "Autorité",
  timeline: "Within a month",
  budgetRange: "1 000 000 – 2 000 000 FCFA",
  vision: "A brand and website that can compete with imported labels.",
  challenge: "",
  referralSource: "Instagram",
  locale: "en",
};

describe("buildNotificationEmail", () => {
  it("builds the subject from company and offer", () => {
    expect(buildNotificationEmail(base, ctx).subject).toBe("New brief — Atelier Noir — Autorité");
  });

  it("falls back to the visitor's name when there is no company", () => {
    const { subject } = buildNotificationEmail({ ...base, company: "" }, ctx);
    expect(subject).toBe("New brief — Mariam Adjovi — Autorité");
  });

  it("strips CR/LF from the subject (header injection)", () => {
    const { subject } = buildNotificationEmail({ ...base, company: "Evil\r\nBcc: x@y.z" }, ctx);
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("HTML-escapes every visitor-supplied value", () => {
    const hostile = `<img src=x onerror="alert(1)">`;
    const { html } = buildNotificationEmail(
      { ...base, name: hostile, company: hostile, vision: hostile, referralSource: hostile },
      ctx,
    );
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("omits empty fields", () => {
    const { text } = buildNotificationEmail(base, ctx);
    expect(text).not.toContain("What is not working");
    expect(text).toContain("Heard about us: Instagram");
  });

  it("links to the inbox row without a double slash", () => {
    const { text, html } = buildNotificationEmail(base, ctx);
    const url = "https://volka.example/admin/inquiries/11111111-2222-3333-4444-555555555555";
    expect(text).toContain(url);
    expect(html).toContain(url);
  });
});

describe("buildAutoReply", () => {
  it("replies in French for the fr locale", () => {
    const reply = buildAutoReply({ ...base, locale: "fr" }, ctx);
    expect(reply.subject).toContain("bien reçu");
    expect(reply.text).toContain("Bonjour Mariam,");
    expect(reply.text).toContain("sous un jour ouvré");
  });

  it("replies in English for the en locale and when locale is missing", () => {
    const { locale: _locale, ...noLocale } = base;
    expect(buildAutoReply(base, ctx).text).toContain("Hello Mariam,");
    expect(buildAutoReply(noLocale, ctx).text).toContain("Hello Mariam,");
  });

  it("mentions WhatsApp as the reply channel when chosen", () => {
    const reply = buildAutoReply({ ...base, preferredChannel: "whatsapp" }, ctx);
    expect(reply.text).toContain("by WhatsApp");
  });

  it("repeats the visitor's scope", () => {
    const reply = buildAutoReply(base, ctx);
    expect(reply.text).toContain("Autorité");
    expect(reply.text).toContain("Within a month");
  });

  it("hides the WhatsApp line when no number is configured", () => {
    const reply = buildAutoReply(base, { ...ctx, whatsappNumber: undefined });
    expect(reply.text).not.toContain("WhatsApp:");
    expect(reply.html).not.toContain("WhatsApp:");
  });

  it("shows the WhatsApp number when configured", () => {
    expect(buildAutoReply(base, ctx).text).toContain("+22990000000");
  });

  it("HTML-escapes the visitor's name and scope", () => {
    const hostile = `<b>"x"</b>`;
    const { html } = buildAutoReply({ ...base, name: hostile, offer: hostile }, ctx);
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;");
  });
});
