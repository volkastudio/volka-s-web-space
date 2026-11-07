import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { logAdminAction, requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import type { MailDetail, MailListItem } from "@/lib/admin/mail.server";

/** The studio mailbox holds client conversations: owner and sales only, never the editor role. */
const requireMailAccess = createMiddleware({ type: "function" })
  .middleware([requireAdminAuth])
  .server(async ({ next, context }) => {
    if (context.adminRole === "editor") {
      throw new Error("Forbidden: la messagerie est réservée aux rôles Propriétaire et Commercial.");
    }
    return next({ context });
  });

/** The brief (project_inquiries row) that belongs to the person writing. Only what the inbox needs. */
export type LinkedBrief = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  offer: string;
  budget_range: string;
  timeline: string;
  status: string;
  vision: string;
  created_at: string;
};

export type MailListEntry = MailListItem & { brief: Pick<LinkedBrief, "id" | "name" | "status" | "offer"> | null };

export type MailListResult =
  | { ok: true; mailbox: string; items: MailListEntry[]; total: number; page: number; pageSize: number }
  | { ok: false; configured: boolean; error: string };

const BRIEF_COLUMNS = "id,name,email,company,offer,budget_range,timeline,status,vision,created_at";

/** Escapes what PostgREST's `or()` filter and ILIKE treat as syntax. */
const safeEmail = (value: string) => value.replace(/[,()%:*\\"]/g, "").trim();

async function findBriefsByEmail(emails: string[]): Promise<Map<string, LinkedBrief[]>> {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))].slice(0, 60);
  const byEmail = new Map<string, LinkedBrief[]>();
  if (unique.length === 0) return byEmail;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const filter = unique
    .map(safeEmail)
    .filter(Boolean)
    .map((e) => `email.ilike.${e}`)
    .join(",");
  if (!filter) return byEmail;

  const { data, error } = await supabaseAdmin
    .from("project_inquiries")
    .select(BRIEF_COLUMNS)
    .or(filter)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.warn("[mail] Could not look up briefs:", error.message);
    return byEmail;
  }

  const wanted = new Set(unique);
  for (const row of (data ?? []) as LinkedBrief[]) {
    const key = row.email.trim().toLowerCase();
    // ILIKE treats "_" as a wildcard, so confirm the exact address here.
    if (!wanted.has(key)) continue;
    byEmail.set(key, [...(byEmail.get(key) ?? []), row]);
  }
  return byEmail;
}

// ─── Inbox list ─────────────────────────────────────────────────────────────

export const listMailInbox = createServerFn({ method: "GET" })
  .middleware([requireMailAccess])
  .validator((data?: { page?: number; search?: string; unreadOnly?: boolean }) =>
    z
      .object({
        page: z.number().int().min(1).max(500).default(1),
        search: z.string().max(120).default(""),
        unreadOnly: z.boolean().default(false),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<MailListResult> => {
    const mail = await import("@/lib/admin/mail.server");
    if (!mail.isMailboxConfigured()) {
      return {
        ok: false,
        configured: false,
        error: "La messagerie n'est pas encore connectée.",
      };
    }

    const pageSize = 25;
    try {
      const { items, total } = await mail.listInbox({
        page: data.page,
        pageSize,
        search: data.search.trim(),
        unreadOnly: data.unreadOnly,
      });

      const briefs = await findBriefsByEmail(items.map((i) => i.contact.address));
      const entries: MailListEntry[] = items.map((item) => {
        const match = briefs.get(item.contact.address)?.[0];
        return {
          ...item,
          brief: match ? { id: match.id, name: match.name, status: match.status, offer: match.offer } : null,
        };
      });

      return { ok: true, mailbox: mail.mailboxAddress(), items: entries, total, page: data.page, pageSize };
    } catch (error) {
      console.error("[listMailInbox]", error instanceof Error ? error.message : error);
      return { ok: false, configured: true, error: mail.describeMailError(error) };
    }
  });

// ─── Unread badge ───────────────────────────────────────────────────────────

export const getMailUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireMailAccess])
  .handler(async (): Promise<{ configured: boolean; unread: number }> => {
    const mail = await import("@/lib/admin/mail.server");
    if (!mail.isMailboxConfigured()) return { configured: false, unread: 0 };
    try {
      return { configured: true, unread: await mail.countUnread() };
    } catch (error) {
      console.warn("[getMailUnreadCount]", error instanceof Error ? error.message : error);
      return { configured: true, unread: 0 };
    }
  });

// ─── One message + its brief ────────────────────────────────────────────────

export type MailMessageResult =
  | { ok: true; message: MailDetail; briefs: LinkedBrief[]; mailbox: string }
  | { ok: false; error: string };

export const getMailMessage = createServerFn({ method: "GET" })
  .middleware([requireMailAccess])
  .validator((data: { uid: number }) => z.object({ uid: z.number().int().min(1) }).parse(data))
  .handler(async ({ data }): Promise<MailMessageResult> => {
    const mail = await import("@/lib/admin/mail.server");
    if (!mail.isMailboxConfigured()) return { ok: false, error: "La messagerie n'est pas encore connectée." };

    try {
      const message = await mail.readMessage(data.uid, true);
      if (!message) return { ok: false, error: "Ce message n'existe plus dans la boîte de réception." };

      // Look for the brief under every address the person might have used.
      const candidates = [message.contact.address, message.from.address, message.replyTo?.address ?? ""];
      const byEmail = await findBriefsByEmail(candidates);
      const seen = new Set<string>();
      const briefs: LinkedBrief[] = [];
      for (const address of candidates) {
        for (const brief of byEmail.get(address.toLowerCase()) ?? []) {
          if (seen.has(brief.id)) continue;
          seen.add(brief.id);
          briefs.push(brief);
        }
      }

      return { ok: true, message, briefs, mailbox: mail.mailboxAddress() };
    } catch (error) {
      console.error("[getMailMessage]", error instanceof Error ? error.message : error);
      return { ok: false, error: mail.describeMailError(error) };
    }
  });

export const setMailSeen = createServerFn({ method: "POST" })
  .middleware([requireMailAccess])
  .validator((data: { uid: number; seen: boolean }) =>
    z.object({ uid: z.number().int().min(1), seen: z.boolean() }).parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const mail = await import("@/lib/admin/mail.server");
    try {
      await mail.setSeen(data.uid, data.seen);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mail.describeMailError(error) };
    }
  });

// ─── Reply ──────────────────────────────────────────────────────────────────

export const replyToMail = createServerFn({ method: "POST" })
  .middleware([requireMailAccess])
  .validator(
    (data: {
      to: string;
      subject: string;
      text: string;
      inReplyTo?: string | null;
      references?: string[];
      inquiryId?: string | null;
    }) =>
      z
        .object({
          to: z.string().email().max(254),
          subject: z.string().min(1).max(300),
          text: z.string().min(1).max(20_000),
          inReplyTo: z.string().max(998).nullish(),
          references: z.array(z.string().max(998)).max(50).default([]),
          inquiryId: z.string().uuid().nullish(),
        })
        .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; savedToSent?: boolean; error?: string }> => {
    const mail = await import("@/lib/admin/mail.server");
    if (!mail.isMailboxConfigured()) return { ok: false, error: "La messagerie n'est pas encore connectée." };

    try {
      const { savedToSent } = await mail.sendReply({
        to: data.to,
        subject: data.subject,
        text: data.text,
        inReplyTo: data.inReplyTo ?? null,
        references: data.references,
      });

      // A reply means the brief has been answered, unless it is already closed one way or another.
      if (data.inquiryId) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("project_inquiries")
          .update({ status: "replied" })
          .eq("id", data.inquiryId)
          .in("status", ["new", "read"]);
      }

      await logAdminAction({
        actorId: context.userId,
        action: "mail.reply",
        entity: "mail",
        entityId: data.inquiryId ?? null,
        diff: { to: data.to, subject: data.subject },
      });

      return { ok: true, savedToSent };
    } catch (error) {
      console.error("[replyToMail]", error instanceof Error ? error.message : error);
      return { ok: false, error: "L'envoi a échoué. Vérifiez les réglages SMTP puis réessayez." };
    }
  });
