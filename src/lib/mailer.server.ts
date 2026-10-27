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

function getEmailContext(inquiryId: string): EmailContext {
  return {
    siteUrl: process.env["SITE_URL"] ?? "",
    inquiryId,
    contactEmail: process.env["CONTACT_EMAIL"] || "hello@volkastudio.com",
    whatsappNumber: process.env["WHATSAPP_NUMBER"]?.replace(/\D/g, "") || undefined,
  };
}

/**
 * Sends the internal notification to the studio inbox. Never throws.
 */
export async function sendInternalNotification(
  data: InquiryInput,
  inquiryId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const from = process.env["MAIL_FROM"] ?? "";
    const notifyTo = (process.env["MAIL_NOTIFY_TO"] ?? "")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean);

    const ctx = getEmailContext(inquiryId);
    const notification = buildNotificationEmail(data, ctx);
    const mailer = getTransporter();

    await mailer.sendMail({
      from,
      to: notifyTo,
      replyTo: data.email,
      subject: notification.subject,
      text: notification.text,
      html: notification.html,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: `notification: ${describe(error)}` };
  }
}

/**
 * Sends the confirmation auto-reply to the visitor. Never throws.
 */
export async function sendAutoReply(
  data: InquiryInput,
  inquiryId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const from = process.env["MAIL_FROM"] ?? "";
    const ctx = getEmailContext(inquiryId);
    const autoReply = buildAutoReply(data, ctx);
    const mailer = getTransporter();

    await mailer.sendMail({
      from,
      to: data.email,
      subject: autoReply.subject,
      text: autoReply.text,
      html: autoReply.html,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: `auto-reply: ${describe(error)}` };
  }
}

/**
 * Sends both the internal notification and the visitor auto-reply in parallel.
 * Never throws: failures come back in `errors` so the caller can record them on the row.
 */
export async function sendInquiryEmails(data: InquiryInput, inquiryId: string): Promise<MailResult> {
  const [internal, visitor] = await Promise.all([
    sendInternalNotification(data, inquiryId),
    sendAutoReply(data, inquiryId),
  ]);

  const errors: string[] = [];
  if (!internal.success && internal.error) errors.push(internal.error);
  if (!visitor.success && visitor.error) errors.push(visitor.error);

  return { notified: internal.success, errors };
}

/**
 * Sends a high-priority security alert to the studio owner.
 * Never throws.
 */
export async function sendSecurityAlertEmail(params: {
  rule: string;
  title: string;
  message: string;
  details?: Record<string, unknown> | undefined;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isMailConfigured()) {
      return { success: false, error: "SMTP not configured" };
    }

    const from = process.env["MAIL_FROM"] ?? "";
    const notifyTo = (process.env["MAIL_NOTIFY_TO"] ?? "")
      .split(",")
      .map((addr) => addr.trim())
      .filter(Boolean);

    if (notifyTo.length === 0) {
      return { success: false, error: "No recipient in MAIL_NOTIFY_TO" };
    }

    const mailer = getTransporter();
    const siteUrl = process.env["SITE_URL"] || "https://volkastudio.com";
    const healthUrl = `${siteUrl.replace(/\/$/, "")}/admin/health`;
    const timestamp = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" });

    const subject = `[ALERTE SÉCURITÉ VOLKA] ${params.title}`;
    const textBody = `ALERTE SÉCURITÉ STUDIO VOLKA
Règle : ${params.rule}
Date : ${timestamp} (Porto-Novo)

${params.message}

${params.details ? `Détails techniques :\n${JSON.stringify(params.details, null, 2)}` : ""}

Accéder au tableau de bord Santé & Sécurité :
${healthUrl}
`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0E1C12; color: #FEFFF1; margin: 0; padding: 32px; }
    .card { background: #01322D; border: 1px solid #A45727; border-radius: 6px; padding: 24px; max-width: 580px; margin: 0 auto; }
    .badge { display: inline-block; background: #A45727; color: #FEFFF1; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.1em; }
    h1 { font-size: 20px; margin: 16px 0 8px 0; color: #FEFFF1; font-weight: 600; }
    p { font-size: 14px; line-height: 1.6; color: #AAD4C6; }
    pre { background: #0E1C12; padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto; color: #FCF5EB; border: 1px solid #0E1C12; }
    a.button { display: inline-block; background: #C8853A; color: #0E1C12; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 4px; font-size: 13px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Alerte Sécurité — Règle : ${params.rule}</span>
    <h1>${params.title}</h1>
    <p>${params.message}</p>
    <p style="font-size: 12px; color: #AAD4C6/80;">Horodatage : ${timestamp} (Porto-Novo)</p>
    ${
      params.details
        ? `<pre>${JSON.stringify(params.details, null, 2)}</pre>`
        : ""
    }
    <p>
      <a href="${healthUrl}" class="button">Ouvrir le panneau Santé & Sécurité</a>
    </p>
  </div>
</body>
</html>
`;

    await mailer.sendMail({
      from,
      to: notifyTo,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: describe(err) };
  }
}

const AUDIT_TRACK_NAMES: Record<string, string> = {
  website: "Site web (Conversion & Perception)",
  marketing: "Marketing & visibilité (Acquisition & Perception)",
  sales: "Ventes & suivi (Sales & Automation)",
  general: "Diagnostic transversal (Je ne sais pas)",
};

/**
 * Sends double opt-in email to the audit requester with unique token link.
 * Never throws.
 */
export async function sendAuditVerificationEmail(params: {
  email: string;
  name: string;
  company: string;
  track: string;
  token: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isMailConfigured()) {
      return { success: false, error: "SMTP not configured" };
    }

    const mailer = getTransporter();
    const from = process.env["MAIL_FROM"] ?? "";
    const siteUrl = (process.env["SITE_URL"] || "https://volkastudio.com").replace(/\/$/, "");
    const verifyUrl = `${siteUrl}/audit/verifier?token=${encodeURIComponent(params.token)}`;
    const trackLabel = AUDIT_TRACK_NAMES[params.track] ?? params.track;

    const subject = `[Volka Studio] Confirmez votre demande d'audit croissance — ${params.company}`;
    const textBody = `Bonjour ${params.name},

Nous avons bien reçu votre demande d'audit croissance pour l'entreprise "${params.company}" (Parcours : ${trackLabel}).

Pour activer votre demande et sécuriser votre place dans la file d'attente, veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous (valable 48h) :
${verifyUrl}

Une fois votre email confirmé :
- Si la capacité du mois est disponible, votre audit est placé en file de traitement prioritaire (délai indicatif de 5 jours ouvrés).
- Si la capacité maximale est atteinte, vous êtes inscrit sur liste d'attente prioritaire pour le cycle suivant.

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.

L'équipe Volka Studio
${siteUrl}
`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0E1C12; color: #FEFFF1; margin: 0; padding: 32px 16px; }
    .card { background: #01322D; border: 1px solid #AAD4C6; border-radius: 6px; padding: 32px; max-width: 560px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .badge { display: inline-block; background: #AAD4C6; color: #0E1C12; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.1em; }
    h1 { font-size: 22px; margin: 16px 0 12px 0; color: #FEFFF1; font-weight: 500; font-family: Georgia, serif; }
    p { font-size: 14px; line-height: 1.6; color: #FCF5EB; margin: 12px 0; }
    .track-info { background: #0E1C12; border-left: 3px solid #C8853A; padding: 12px 16px; border-radius: 0 4px 4px 0; margin: 20px 0; }
    .track-info span { display: block; font-size: 12px; color: #AAD4C6; }
    .track-info strong { font-size: 14px; color: #FEFFF1; }
    a.button { display: inline-block; background: #C8853A; color: #0E1C12; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 14px; margin: 20px 0; text-align: center; }
    .footer { font-size: 12px; color: #AAD4C6; opacity: 0.8; margin-top: 24px; border-top: 1px solid rgba(170, 212, 198, 0.2); padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Diagnostic de croissance gratuit</span>
    <h1>Confirmez votre demande d'audit</h1>
    <p>Bonjour ${params.name},</p>
    <p>Nous avons bien reçu votre demande d'audit croissance pour <strong>${params.company}</strong>.</p>
    
    <div class="track-info">
      <span>Parcours sélectionné :</span>
      <strong>${trackLabel}</strong>
    </div>

    <p>Afin de valider votre demande et réserver votre créneau dans notre calendrier de diagnostic, veuillez confirmer votre adresse email :</p>
    
    <p style="text-align: center;">
      <a href="${verifyUrl}" class="button">Confirmer mon adresse email</a>
    </p>

    <p style="font-size: 12px; color: #AAD4C6;">Ce lien de sécurité est actif pendant 48 heures. Dès confirmation, votre diagnostic sera pris en charge dans la limite des places disponibles ce mois-ci.</p>

    <div class="footer">
      Volka Studio — Systèmes de croissance & Brand Platforms<br>
      Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
    </div>
  </div>
</body>
</html>
`;

    await mailer.sendMail({
      from,
      to: params.email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: describe(err) };
  }
}

/**
 * Alerts the studio team when an audit email has been verified.
 * Never throws.
 */
export async function sendAuditTeamAlertEmail(params: {
  auditId: string;
  name: string;
  company: string;
  track: string;
  status: "queued" | "waitlist";
  country: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isMailConfigured()) {
      return { success: false, error: "SMTP not configured" };
    }

    const mailer = getTransporter();
    const from = process.env["MAIL_FROM"] ?? "";
    const notifyTo = (process.env["MAIL_NOTIFY_TO"] ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    if (notifyTo.length === 0) {
      return { success: false, error: "No recipient configured" };
    }

    const siteUrl = (process.env["SITE_URL"] || "https://volkastudio.com").replace(/\/$/, "");
    const adminUrl = `${siteUrl}/admin/audits`;
    const trackLabel = AUDIT_TRACK_NAMES[params.track] ?? params.track;
    const isQueued = params.status === "queued";

    const subject = `[AUDIT CROISSANCE ${isQueued ? "EN FILE" : "LISTE D'ATTENTE"}] ${params.company} (${params.name})`;
    const textBody = `NOUVEL AUDIT CROISSANCE VALIDÉ

Entreprise : ${params.company}
Contact : ${params.name}
Pays : ${params.country}
Parcours : ${trackLabel}
Statut : ${isQueued ? "En file de traitement (Capacité mensuelle disponible)" : "Liste d'attente (Capacité atteinte)"}

Consulter et traiter la demande dans le back-office :
${adminUrl}
`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0E1C12; color: #FEFFF1; margin: 0; padding: 24px; }
    .card { background: #01322D; border: 1px solid ${isQueued ? "#AAD4C6" : "#A45727"}; border-radius: 6px; padding: 24px; max-width: 560px; margin: 0 auto; }
    .badge { display: inline-block; background: ${isQueued ? "#AAD4C6" : "#A45727"}; color: ${isQueued ? "#0E1C12" : "#FEFFF1"}; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
    h1 { font-size: 18px; margin: 16px 0 8px 0; color: #FEFFF1; }
    ul { list-style: none; padding: 0; margin: 16px 0; }
    li { padding: 6px 0; border-bottom: 1px solid rgba(170, 212, 198, 0.1); font-size: 13px; }
    li strong { color: #AAD4C6; }
    a.button { display: inline-block; background: #C8853A; color: #0E1C12; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 4px; font-size: 13px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">${isQueued ? "Demande en file" : "Liste d'attente"}</span>
    <h1>Nouvel audit validé : ${params.company}</h1>
    <ul>
      <li><strong>Contact :</strong> ${params.name}</li>
      <li><strong>Entreprise :</strong> ${params.company} (${params.country})</li>
      <li><strong>Parcours :</strong> ${trackLabel}</li>
      <li><strong>Statut assigné :</strong> ${params.status}</li>
    </ul>
    <a href="${adminUrl}" class="button">Ouvrir la file des audits</a>
  </div>
</body>
</html>
`;

    await mailer.sendMail({
      from,
      to: notifyTo,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: describe(err) };
  }
}

/**
 * Sends the private audit report link to the client.
 * Phase 11.1
 */
export async function sendAuditReportEmail(params: {
  email: string;
  name: string;
  company: string;
  track: string;
  reportUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isMailConfigured()) {
      return { success: false, error: "SMTP not configured" };
    }

    const mailer = getTransporter();
    const from = process.env["MAIL_FROM"] ?? "";
    const siteUrl = (process.env["SITE_URL"] || "https://volkastudio.com").replace(/\/$/, "");
    const trackLabel = AUDIT_TRACK_NAMES[params.track] ?? params.track;

    const subject = `[Volka Studio] Votre diagnostic de croissance est prêt — ${params.company}`;
    const textBody = `Bonjour ${params.name},

Notre diagnostic de croissance pour l'entreprise "${params.company}" est désormais finalisé.

Vous pouvez accéder à votre rapport confidentiel complet en suivant ce lien sécurisé :
${params.reportUrl}

Ce que vous y trouverez :
- La scorecard détaillée sur vos 5 piliers clés
- Les 3 constats prioritaires et leurs actions correctives
- Les 3 gains rapides (« quick wins ») activables immédiatement
- Notre recommandation stratégique personnalisée

Note importante : ce lien est strictement privé, sans indexation moteur, et restera accessible pendant 90 jours.

Si vous souhaitez échanger sur ces conclusions, vous pourrez réserver un point d'échange directement depuis votre rapport.

L'équipe Volka Studio
${siteUrl}
`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0E1C12; color: #FEFFF1; margin: 0; padding: 32px 16px; }
    .card { background: #01322D; border: 1px solid #AAD4C6; border-radius: 6px; padding: 32px; max-width: 560px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .badge { display: inline-block; background: #AAD4C6; color: #0E1C12; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.1em; }
    h1 { font-size: 22px; margin: 16px 0 12px 0; color: #FEFFF1; font-weight: 500; font-family: Georgia, serif; }
    p { font-size: 14px; line-height: 1.6; color: #FCF5EB; margin: 12px 0; }
    .highlight-box { background: #0E1C12; border-left: 3px solid #AAD4C6; padding: 14px 18px; border-radius: 0 4px 4px 0; margin: 20px 0; }
    .highlight-box ul { margin: 8px 0 0 0; padding-left: 18px; font-size: 13px; color: #FCF5EB; }
    .highlight-box li { margin-bottom: 4px; }
    a.button { display: inline-block; background: #C8853A; color: #0E1C12; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-size: 14px; margin: 20px 0; text-align: center; }
    .note { font-size: 12px; color: #AAD4C6; opacity: 0.85; line-height: 1.5; margin-top: 16px; }
    .footer { font-size: 11px; color: #AAD4C6; opacity: 0.7; margin-top: 24px; border-top: 1px solid rgba(170, 212, 198, 0.2); padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Diagnostic stratégique finalisé</span>
    <h1>Votre rapport d'audit est disponible</h1>
    <p>Bonjour ${params.name},</p>
    <p>L'équipe Volka Studio a terminé l'analyse stratégique de votre écosystème pour <strong>${params.company}</strong> (Parcours : ${trackLabel}).</p>

    <div class="highlight-box">
      <strong style="color: #AAD4C6; font-size: 13px;">Contenu de votre diagnostic :</strong>
      <ul>
        <li>Scorecard d'évaluation sur 5 piliers de croissance</li>
        <li>Top 3 des constats majeurs et correctifs d'ingénierie</li>
        <li>Top 3 des quick wins immédiatement applicables</li>
        <li>Recommandation d'architecture de croissance personnalisée</li>
      </ul>
    </div>

    <p style="text-align: center;">
      <a href="${params.reportUrl}" class="button">Consulter mon rapport confidentiel</a>
    </p>

    <p class="note">
      🔒 <strong>Accès sécurisé :</strong> Ce rapport est hébergé sur une URL privée chiffrée, protégée contre l'indexation moteur, et valide 90 jours.
    </p>

    <div class="footer">
      Volka Studio — Brand Platforms & Growth Systems<br>
      Besoin d'approfondir ? Vous pouvez réserver un temps d'échange directement depuis le rapport.
    </div>
  </div>
</body>
</html>
`;

    await mailer.sendMail({
      from,
      to: params.email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: describe(err) };
  }
}



