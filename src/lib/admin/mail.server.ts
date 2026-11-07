// Server-only IMAP reader for the studio mailbox (hello@...). Never import this from a route or a
// component: load it with `await import("@/lib/admin/mail.server")` inside a server function.
//
// The mailbox stays the single source of truth. Nothing is copied to the database: every request
// opens a short-lived IMAP connection, does its work and logs out. That suits serverless hosting
// (Vercel) and stays under the provider's connection limit.
import { ImapFlow } from "imapflow";
import MailComposer from "nodemailer/lib/mail-composer";
import { simpleParser } from "mailparser";

import { getTransporter } from "@/lib/mailer.server";

export type MailAddress = { name: string; address: string };

export type MailListItem = {
  uid: number;
  subject: string;
  from: MailAddress;
  /**
   * Who the conversation is really with. Notifications sent by the website come from the studio
   * itself with the prospect in Reply-To, so this is the Reply-To in that case, the sender otherwise.
   */
  contact: MailAddress;
  date: string | null;
  seen: boolean;
  flagged: boolean;
};

export type MailAttachment = { filename: string; contentType: string; size: number };

export type MailDetail = {
  uid: number;
  subject: string;
  from: MailAddress;
  contact: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  replyTo: MailAddress | null;
  date: string | null;
  messageId: string | null;
  references: string[];
  /** HTML body with inline (cid:) images already embedded. Render it in a sandboxed frame only. */
  html: string | null;
  text: string;
  attachments: MailAttachment[];
};

const MAX_MESSAGE_BYTES = 15 * 1024 * 1024;
const MAX_INLINE_IMAGE_BYTES = 400 * 1024;

export function isMailboxConfigured(): boolean {
  return Boolean(imapUser() && imapPass());
}

export function mailboxAddress(): string {
  return imapUser();
}

function imapUser(): string {
  return process.env["IMAP_USER"] || process.env["SMTP_USER"] || "";
}

function imapPass(): string {
  return process.env["IMAP_PASS"] || process.env["SMTP_PASS"] || "";
}

function createClient(): ImapFlow {
  const client = new ImapFlow({
    host: process.env["IMAP_HOST"] || "imap.hostinger.com",
    port: Number(process.env["IMAP_PORT"] || 993),
    secure: process.env["IMAP_SECURE"] !== "false",
    auth: { user: imapUser(), pass: imapPass() },
    logger: false,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 25_000,
  });
  // Without a listener, a dropped socket would crash the process.
  client.on("error", (err: Error) => console.warn("[mail] IMAP error:", err.message));
  return client;
}

/** A readable message for the admin screen. Never includes credentials. */
export function describeMailError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("auth") || lower.includes("credentials") || lower.includes("login")) {
    return "La boîte mail a refusé la connexion. Vérifiez IMAP_USER et IMAP_PASS (ou SMTP_USER et SMTP_PASS).";
  }
  if (lower.includes("timeout") || lower.includes("econn") || lower.includes("enotfound")) {
    return "Impossible de joindre le serveur mail pour le moment. Réessayez dans un instant.";
  }
  return `Erreur de messagerie : ${message.slice(0, 200)}`;
}

async function withMailbox<T>(work: (client: ImapFlow) => Promise<T>, mailbox = "INBOX"): Promise<T> {
  const client = createClient();
  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);
    try {
      return await work(client);
    } finally {
      lock.release();
    }
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
}

type EnvelopeAddress = { name?: string | undefined; address?: string | undefined };

const toAddress = (a: EnvelopeAddress | undefined): MailAddress => ({
  name: (a?.name ?? "").trim(),
  address: (a?.address ?? "").trim().toLowerCase(),
});

/** True when the address belongs to the studio itself (mailbox or configured sender). */
function isOwnAddress(address: string): boolean {
  if (!address) return false;
  const own = new Set([imapUser().toLowerCase(), senderAddress().toLowerCase()]);
  return own.has(address.toLowerCase());
}

export function pickContact(from: MailAddress, replyTo: MailAddress | null): MailAddress {
  if (replyTo?.address && isOwnAddress(from.address) && !isOwnAddress(replyTo.address)) {
    return replyTo;
  }
  return from;
}

/** Number of unread messages in the inbox, without opening a message list. */
export async function countUnread(): Promise<number> {
  const client = createClient();
  try {
    await client.connect();
    const status = await client.status("INBOX", { unseen: true });
    return status.unseen ?? 0;
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }
}

// ─── List ───────────────────────────────────────────────────────────────────

export async function listInbox(opts: {
  page: number;
  pageSize: number;
  search: string;
  unreadOnly: boolean;
}): Promise<{ items: MailListItem[]; total: number }> {
  return withMailbox(async (client) => {
    const fetchQuery = { uid: true, flags: true, envelope: true, internalDate: true } as const;
    const items: MailListItem[] = [];
    let total = 0;

    const collect = async (range: string, byUid: boolean) => {
      const source = byUid
        ? client.fetch(range, fetchQuery, { uid: true })
        : client.fetch(range, fetchQuery);
      for await (const msg of source) {
        const flags = msg.flags ?? new Set<string>();
        const date = msg.envelope?.date ?? msg.internalDate ?? null;
        const from = toAddress(msg.envelope?.from?.[0]);
        const replyTo = toAddress(msg.envelope?.replyTo?.[0]);
        items.push({
          uid: msg.uid,
          subject: (msg.envelope?.subject ?? "").trim(),
          from,
          contact: pickContact(from, replyTo),
          date: date ? new Date(date).toISOString() : null,
          seen: flags.has("\\Seen"),
          flagged: flags.has("\\Flagged"),
        });
      }
    };

    if (opts.search || opts.unreadOnly) {
      const query: Record<string, unknown> = {};
      if (opts.unreadOnly) query["seen"] = false;
      if (opts.search) {
        query["or"] = [{ from: opts.search }, { to: opts.search }, { subject: opts.search }];
      }
      const found = (await client.search(query as Parameters<ImapFlow["search"]>[0], { uid: true })) || [];
      const uids = [...found].sort((a, b) => b - a);
      total = uids.length;
      const pageUids = uids.slice((opts.page - 1) * opts.pageSize, opts.page * opts.pageSize);
      if (pageUids.length > 0) await collect(pageUids.join(","), true);
    } else {
      const mailbox = client.mailbox;
      const exists = typeof mailbox === "object" ? mailbox.exists : 0;
      total = exists;
      const end = exists - (opts.page - 1) * opts.pageSize;
      if (end >= 1) {
        const start = Math.max(1, end - opts.pageSize + 1);
        await collect(`${start}:${end}`, false);
      }
    }

    items.sort((a, b) => b.uid - a.uid);
    return { items, total };
  });
}

// ─── One message ────────────────────────────────────────────────────────────

const asList = (value: unknown): MailAddress[] => {
  const list = (value as { value?: EnvelopeAddress[] } | undefined)?.value ?? [];
  return list.map(toAddress).filter((a) => a.address);
};

export async function readMessage(uid: number, markSeen: boolean): Promise<MailDetail | null> {
  return withMailbox(async (client) => {
    const msg = await client.fetchOne(String(uid), { source: true, flags: true, uid: true }, { uid: true });
    if (!msg || !msg.source) return null;
    if (msg.source.length > MAX_MESSAGE_BYTES) {
      throw new Error("Ce message est trop volumineux pour être affiché ici.");
    }

    const parsed = await simpleParser(msg.source);

    if (markSeen && !(msg.flags ?? new Set<string>()).has("\\Seen")) {
      await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
    }

    let html = typeof parsed.html === "string" ? parsed.html : null;
    const attachments: MailAttachment[] = [];
    for (const att of parsed.attachments ?? []) {
      const isInlineImage =
        Boolean(att.cid) && att.contentType.startsWith("image/") && att.size <= MAX_INLINE_IMAGE_BYTES;
      if (html && isInlineImage && att.cid) {
        const cid = att.cid.replace(/^<|>$/g, "");
        const dataUri = `data:${att.contentType};base64,${att.content.toString("base64")}`;
        html = html.split(`cid:${cid}`).join(dataUri);
        continue;
      }
      attachments.push({
        filename: att.filename || "pièce jointe",
        contentType: att.contentType,
        size: att.size,
      });
    }

    const references = Array.isArray(parsed.references)
      ? parsed.references
      : parsed.references
        ? [parsed.references]
        : [];

    return {
      uid,
      subject: (parsed.subject ?? "").trim(),
      from: asList(parsed.from)[0] ?? { name: "", address: "" },
      contact: pickContact(
        asList(parsed.from)[0] ?? { name: "", address: "" },
        asList(parsed.replyTo)[0] ?? null,
      ),
      to: asList(parsed.to),
      cc: asList(parsed.cc),
      replyTo: asList(parsed.replyTo)[0] ?? null,
      date: parsed.date ? parsed.date.toISOString() : null,
      messageId: parsed.messageId ?? null,
      references,
      html,
      text: (parsed.text ?? "").trim(),
      attachments,
    } satisfies MailDetail;
  });
}

export async function setSeen(uid: number, seen: boolean): Promise<void> {
  await withMailbox(async (client) => {
    if (seen) await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
    else await client.messageFlagsRemove(String(uid), ["\\Seen"], { uid: true });
  });
}

// ─── Reply ──────────────────────────────────────────────────────────────────

function senderAddress(): string {
  const from = process.env["MAIL_FROM"] ?? "";
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from ?? imapUser()).trim() || imapUser();
}

/**
 * Sends a plain-text reply through the studio SMTP account, keeping the conversation thread,
 * then saves a copy in the mailbox's Sent folder so it also shows up in webmail.
 */
export async function sendReply(input: {
  to: string;
  subject: string;
  text: string;
  inReplyTo: string | null;
  references: string[];
}): Promise<{ savedToSent: boolean }> {
  const from = process.env["MAIL_FROM"] || senderAddress();
  const references = [...input.references, ...(input.inReplyTo ? [input.inReplyTo] : [])];

  const composer = new MailComposer({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    ...(input.inReplyTo ? { inReplyTo: input.inReplyTo } : {}),
    ...(references.length > 0 ? { references } : {}),
  });
  const raw = await composer.compile().build();

  await getTransporter().sendMail({
    envelope: { from: senderAddress(), to: [input.to] },
    raw,
  });

  let savedToSent = false;
  const client = createClient();
  try {
    await client.connect();
    const boxes = await client.list();
    const sent =
      boxes.find((b) => b.specialUse === "\\Sent")?.path ??
      boxes.find((b) => /^(sent|envoy)/i.test(b.name))?.path ??
      "Sent";
    await client.append(sent, raw, ["\\Seen"]);
    savedToSent = true;
  } catch (error) {
    console.warn("[mail] Reply sent but could not be saved to Sent:", describeMailError(error));
  } finally {
    try {
      await client.logout();
    } catch {
      client.close();
    }
  }

  return { savedToSent };
}
