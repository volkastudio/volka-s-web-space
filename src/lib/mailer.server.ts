// Server-only SMTP mailer. Never import this at the top level of a route file or
// a *.functions.ts file — load it with `await import("@/lib/mailer.server")`
// inside the handler so it stays out of the client bundle.
import { createTransport, type Transporter } from "nodemailer";

import { buildAutoReply, buildNotificationEmail, type EmailContext } from "./inquiry-emails";
import type { InquiryInput } from "./inquiry-schema";

export type MailResult = {
  /** True when the internal notification to the studio went out. */
  notified: boolean;
  /** One entry per failed message; empty when everything was sent. */
  errors: string[];
};

let transporter: Transporter | undefined;

/** SMTP is considered configured when host, sender and recipients are all set. */
export function isMailConfigured(): boolean {
  return Boolean(process.env["SMTP_HOST"] && process.env["MAIL_FROM"] && process.env["MAIL_NOTIFY_TO"]);
}

// One pooled transport, reused across requests. 10 s timeouts so a dead SMTP
// server can never hang a visitor's submission.
function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env["SMTP_USER"];
  transporter = createTransport({
    host: process.env["SMTP_HOST"],
    port: Number(process.env["SMTP_PORT"] || 587),
    secure: process.env["SMTP_SECURE"] === "true",
    ...(user ? { auth: { user, pass: process.env["SMTP_PASS"] ?? "" } } : {}),
    pool: true,
    maxConnections: 3,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
  return transporter;
}

function describe(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 300);
}

/**
 * Sends the internal notification and the visitor auto-reply. Never throws:
 * failures come back in `errors` so the caller can record them on the row.
 */
export async function sendInquiryEmails(data: InquiryInput, inquiryId: string): Promise<MailResult> {
  const from = process.env["MAIL_FROM"] ?? "";
  const notifyTo = (process.env["MAIL_NOTIFY_TO"] ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  const ctx: EmailContext = {
    siteUrl: process.env["SITE_URL"] ?? "",
    inquiryId,
    contactEmail: process.env["CONTACT_EMAIL"] || "hello@volkastudio.com",
    whatsappNumber: process.env["WHATSAPP_NUMBER"]?.replace(/\D/g, "") || undefined,
  };

  const mailer = getTransporter();
  const notification = buildNotificationEmail(data, ctx);
  const autoReply = buildAutoReply(data, ctx);

  const [internal, visitor] = await Promise.allSettled([
    mailer.sendMail({
      from,
      to: notifyTo,
      replyTo: data.email,
      subject: notification.subject,
      text: notification.text,
      html: notification.html,
    }),
    mailer.sendMail({
      from,
      to: data.email,
      subject: autoReply.subject,
      text: autoReply.text,
      html: autoReply.html,
    }),
  ]);

  const errors: string[] = [];
  if (internal.status === "rejected") errors.push(`notification: ${describe(internal.reason)}`);
  if (visitor.status === "rejected") errors.push(`auto-reply: ${describe(visitor.reason)}`);

  return { notified: internal.status === "fulfilled", errors };
}
