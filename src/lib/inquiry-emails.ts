/**
 * Email templates for the inquiry pipeline. Pure functions: input in, subject +
 * plain-text + HTML out. Every visitor-supplied value is HTML-escaped in the
 * HTML part, and anything used in a header (subject) has CR/LF stripped.
 */
import { escapeHtml, stripLineBreaks } from "./inquiry-guards";
import type { InquiryInput } from "./inquiry-schema";

export type EmailMessage = { subject: string; text: string; html: string };

export type EmailContext = {
  /** Public site URL, e.g. https://volkastudio.com (no trailing slash needed). */
  siteUrl: string;
  /** Row id of the stored inquiry, used for the admin inbox link. */
  inquiryId: string;
  /** Address shown to the visitor for urgent matters. */
  contactEmail: string;
  /** Digits only, e.g. 22990000000. Omit to hide the WhatsApp line. */
  whatsappNumber?: string | undefined;
};

const BRAND = { forest: "#14382f", gold: "#b8862b", paper: "#faf8f1", muted: "#5b625e" };

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

// ─── Internal notification ────────────────────────────────────────────────

export function buildNotificationEmail(data: InquiryInput, ctx: EmailContext): EmailMessage {
  const rows: [string, string][] = [
    ["Name", data.name],
    ["Email", data.email],
    ["Company", data.company ?? ""],
    ["Phone / WhatsApp", data.phone ?? ""],
    ["Preferred reply", data.preferredChannel === "whatsapp" ? "WhatsApp" : "Email"],
    ["Scope", data.offer],
    ["Timeline", data.timeline],
    ["Budget", data.budgetRange],
    ["Vision", data.vision],
    ["What is not working", data.challenge ?? ""],
    ["Heard about us", data.referralSource ?? ""],
    ["Language", (data.locale ?? "en").toUpperCase()],
  ];
  const filled = rows.filter(([, value]) => value.trim().length > 0);
  const inboxUrl = `${trimSlash(ctx.siteUrl)}/admin/inquiries/${ctx.inquiryId}`;

  const subject = stripLineBreaks(`New brief — ${data.company?.trim() || data.name} — ${data.offer}`);

  const text = [
    ...filled.map(([label, value]) => (value.includes("\n") ? `${label}:\n${value}` : `${label}: ${value}`)),
    "",
    `Open in the admin inbox: ${inboxUrl}`,
    `Reply directly to this email to answer ${data.name}.`,
  ].join("\n");

  const htmlRows = filled
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 16px 10px 0;vertical-align:top;color:${BRAND.muted};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap">${escapeHtml(label)}</td>
          <td style="padding:10px 0;vertical-align:top;font-size:15px;line-height:1.55;white-space:pre-wrap">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;background:${BRAND.paper};font-family:Arial,Helvetica,sans-serif;color:#1b1f1d">
  <div style="max-width:620px;margin:0 auto;padding:32px 24px">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.gold}">New brief</p>
    <h1 style="margin:0 0 24px;font-size:24px;color:${BRAND.forest}">${escapeHtml(data.company?.trim() || data.name)}</h1>
    <table role="presentation" style="width:100%;border-collapse:collapse;border-top:1px solid #ddd8c8">${htmlRows}
    </table>
    <p style="margin:28px 0 0"><a href="${escapeHtml(inboxUrl)}" style="display:inline-block;background:${BRAND.forest};color:#fff;text-decoration:none;padding:12px 20px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase">Open in inbox</a></p>
    <p style="margin:20px 0 0;font-size:12px;color:${BRAND.muted}">Reply to this email to answer ${escapeHtml(data.name)} directly.</p>
  </div>
</body></html>`;

  return { subject, text, html };
}

// ─── Visitor auto-reply ───────────────────────────────────────────────────

type Copy = {
  subject: string;
  greeting: (name: string) => string;
  intro: (channel: string) => string;
  channelEmail: string;
  channelWhatsapp: string;
  recapTitle: string;
  labels: { scope: string; timeline: string; budget: string };
  urgent: (email: string) => string;
  whatsapp: (number: string) => string;
  signoff: string;
  location: string;
};

const COPY: Record<"fr" | "en", Copy> = {
  fr: {
    subject: "Votre brief est bien reçu — Volka",
    greeting: (name) => `Bonjour ${name},`,
    intro: (channel) =>
      `Merci d'avoir pris le temps de nous écrire. Nous lisons chaque brief nous-mêmes et nous vous répondons sous un jour ouvré, ${channel}.`,
    channelEmail: "par email",
    channelWhatsapp: "par WhatsApp",
    recapTitle: "Rappel de votre demande",
    labels: { scope: "Offre", timeline: "Délai souhaité", budget: "Budget" },
    urgent: (email) => `Si c'est urgent, écrivez-nous à ${email}.`,
    whatsapp: (number) => `Vous pouvez aussi nous joindre sur WhatsApp : +${number}.`,
    signoff: "L'équipe Volka",
    location: "Cotonou, Bénin",
  },
  en: {
    subject: "We've received your brief — Volka",
    greeting: (name) => `Hello ${name},`,
    intro: (channel) =>
      `Thank you for taking the time to write. We read every brief ourselves and will reply within one working day, ${channel}.`,
    channelEmail: "by email",
    channelWhatsapp: "by WhatsApp",
    recapTitle: "Your request",
    labels: { scope: "Scope", timeline: "Timeline", budget: "Budget" },
    urgent: (email) => `If it is urgent, write to us at ${email}.`,
    whatsapp: (number) => `You can also reach us on WhatsApp: +${number}.`,
    signoff: "The Volka team",
    location: "Cotonou, Bénin",
  },
};

export function buildAutoReply(data: InquiryInput, ctx: EmailContext): EmailMessage {
  const copy = COPY[data.locale ?? "en"];
  const name = firstName(data.name);
  const channel = data.preferredChannel === "whatsapp" ? copy.channelWhatsapp : copy.channelEmail;
  const recap: [string, string][] = [
    [copy.labels.scope, data.offer],
    [copy.labels.timeline, data.timeline],
    [copy.labels.budget, data.budgetRange],
  ];
  const whatsapp = ctx.whatsappNumber ? copy.whatsapp(ctx.whatsappNumber) : "";

  const subject = copy.subject;

  const text = [
    copy.greeting(name),
    "",
    copy.intro(channel),
    "",
    `${copy.recapTitle}:`,
    ...recap.map(([label, value]) => `- ${label}: ${value}`),
    "",
    copy.urgent(ctx.contactEmail),
    ...(whatsapp ? [whatsapp] : []),
    "",
    `— ${copy.signoff}`,
    copy.location,
  ].join("\n");

  const recapHtml = recap
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:${BRAND.muted};font-size:13px">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:15px">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;background:${BRAND.paper};font-family:Arial,Helvetica,sans-serif;color:#1b1f1d">
  <div style="max-width:560px;margin:0 auto;padding:36px 24px">
    <p style="margin:0 0 28px;font-size:20px;font-weight:bold;letter-spacing:0.14em;color:${BRAND.forest}">VOLKA</p>
    <p style="margin:0 0 16px;font-size:16px">${escapeHtml(copy.greeting(name))}</p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6">${escapeHtml(copy.intro(channel))}</p>
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.gold}">${escapeHtml(copy.recapTitle)}</p>
    <table role="presentation" style="border-collapse:collapse;margin:0 0 28px">${recapHtml}</table>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.muted}">${escapeHtml(copy.urgent(ctx.contactEmail))}</p>
    ${whatsapp ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.muted}">${escapeHtml(whatsapp)}</p>` : ""}
    <p style="margin:28px 0 0;font-size:15px">— ${escapeHtml(copy.signoff)}<br><span style="color:${BRAND.muted};font-size:13px">${escapeHtml(copy.location)}</span></p>
  </div>
</body></html>`;

  return { subject, text, html };
}
