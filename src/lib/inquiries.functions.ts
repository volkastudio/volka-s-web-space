import { createServerFn } from "@tanstack/react-start";

import {
  DUPLICATE_WINDOW_MS,
  RATE_LIMIT_WINDOW_MS,
  getClientIp,
  hashIp,
  isHoneypotFilled,
  isRateLimited,
  isTooFast,
} from "./inquiry-guards";
import { inquirySchema, type InquiryInput } from "./inquiry-schema";

/**
 * Save first, notify second: a lead is never lost because mail failed.
 *
 *  1. Validate (Zod).
 *  2. Silently drop bots (honeypot filled, or submitted faster than a human could).
 *  3. Rate-limit by hashed IP and ignore double-submits.
 *  4. Insert the row.
 *  5. Send the emails; record the outcome on the row. SMTP errors never reach the visitor.
 */
export const submitInquiry = createServerFn({ method: "POST" })
  .validator((data: InquiryInput) => inquirySchema.parse(data))
  .handler(async (ctx) => {
    const data = ctx.data as InquiryInput;

    // Bots get a fake success and nothing is stored.
    if (isHoneypotFilled(data.website)) {
      try {
        const { logSecurityEvent } = await import("@/lib/admin/security.server");
        await logSecurityEvent({
          type: "honeypot_hit",
          severity: "info",
          path: "/start",
          details: { email: data.email },
        });
      } catch (err) {
        console.error("Failed to log honeypot hit:", err);
      }
      return { ok: true as const };
    }

    if (isTooFast(data.elapsedMs)) {
      try {
        const { logSecurityEvent } = await import("@/lib/admin/security.server");
        await logSecurityEvent({
          type: "too_fast",
          severity: "info",
          path: "/start",
          details: { elapsedMs: data.elapsedMs, email: data.email },
        });
      } catch (err) {
        console.error("Failed to log too_fast hit:", err);
      }
      return { ok: true as const };
    }

    const [{ supabaseAdmin }, { getRequest }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@tanstack/react-start/server"),
    ]);

    const request = getRequest();
    const salt = process.env["SECRET_SALT"];
    const ip = getClientIp(request.headers);
    // Without a salt the hash would be trivially reversible, so skip IP tracking entirely.
    const ipHash = salt && ip !== "unknown" ? await hashIp(ip, salt) : null;
    if (!salt) {
      console.warn("[inquiries] SECRET_SALT is not set: IP rate limiting is disabled.");
      try {
        const { logSecurityEvent } = await import("@/lib/admin/security.server");
        await logSecurityEvent({
          type: "salt_missing",
          severity: "warning",
          path: "/start",
          details: { note: "SECRET_SALT missing in environment" },
        });
      } catch (err) {
        console.error("Failed to log salt_missing:", err);
      }
    }
    const userAgent = request.headers.get("user-agent")?.slice(0, 255) ?? null;
    const now = Date.now();

    if (ipHash) {
      const { count, error } = await supabaseAdmin
        .from("project_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", new Date(now - RATE_LIMIT_WINDOW_MS).toISOString());

      if (error) {
        // Fail open: a broken rate-limit query must not block real leads.
        console.error("Inquiry rate-limit check failed", error.message);
      } else if (isRateLimited(count ?? 0)) {
        try {
          const { logSecurityEvent } = await import("@/lib/admin/security.server");
          await logSecurityEvent({
            type: "rate_limited",
            severity: "warning",
            ipHash,
            path: "/start",
            details: { count, threshold: RATE_LIMIT_WINDOW_MS },
          });
        } catch (err) {
          console.error("Failed to log rate_limited:", err);
        }
        throw new Error("Too many briefs from this connection. Please try again later or write to us by email.");
      }
    }

    // Same email + same vision within a few minutes is a double click: acknowledge, don't re-store or re-send.
    const { data: duplicates, error: duplicateError } = await supabaseAdmin
      .from("project_inquiries")
      .select("id")
      .eq("email", data.email)
      .eq("vision", data.vision)
      .gte("created_at", new Date(now - DUPLICATE_WINDOW_MS).toISOString())
      .limit(1);
    if (duplicateError) {
      console.error("Inquiry duplicate check failed", duplicateError.message);
    } else if (duplicates && duplicates.length > 0) {
      try {
        const { logSecurityEvent } = await import("@/lib/admin/security.server");
        await logSecurityEvent({
          type: "duplicate_submit",
          severity: "info",
          ipHash,
          path: "/start",
          details: { email: data.email },
        });
      } catch (err) {
        console.error("Failed to log duplicate_submit:", err);
      }
      return { ok: true as const };
    }

    const { data: row, error } = await supabaseAdmin
      .from("project_inquiries")
      .insert({
        name: data.name,
        email: data.email,
        company: data.company || null,
        phone: data.phone || null,
        preferred_channel: data.preferredChannel,
        offer: data.offer,
        timeline: data.timeline,
        budget_range: data.budgetRange,
        vision: data.vision,
        challenge: data.challenge || null,
        referral_source: data.referralSource || null,
        locale: data.locale ?? "fr",
        ip_hash: ipHash,
        user_agent: userAgent,
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("Failed to store project inquiry", error?.message);
      throw new Error("We could not send your brief. Please try again in a moment.");
    }

    // The lead is safe. From here on nothing may throw to the visitor.
    const record = async (update: { notified_at?: string; notify_error?: string }) => {
      const { error: updateError } = await supabaseAdmin
        .from("project_inquiries")
        .update(update)
        .eq("id", row.id);
      if (updateError) console.error("Failed to record notification outcome", updateError.message);
    };

    try {
      const { isMailConfigured, sendInquiryEmails } = await import("@/lib/mailer.server");

      if (!isMailConfigured()) {
        console.warn("[inquiries] SMTP is not configured: brief stored, no email sent.");
        await record({ notify_error: "SMTP not configured" });
      } else {
        const result = await sendInquiryEmails(data, row.id);
        if (result.errors.length > 0) {
          console.error("Inquiry email failure", result.errors.join(" | "));
          try {
            const { logSecurityEvent } = await import("@/lib/admin/security.server");
            await logSecurityEvent({
              type: "mail_failed",
              severity: "warning",
              path: "/start",
              details: { inquiryId: row.id, errors: result.errors },
            });
          } catch (logErr) {
            console.error("Failed to log mail_failed:", logErr);
          }
        }
        await record({
          ...(result.notified ? { notified_at: new Date().toISOString() } : {}),
          ...(result.errors.length > 0 ? { notify_error: result.errors.join(" | ").slice(0, 600) } : {}),
        });
      }
    } catch (mailError) {
      console.error("Inquiry notification crashed", mailError);
      await record({
        notify_error: (mailError instanceof Error ? mailError.message : String(mailError)).slice(0, 600),
      });
      try {
        const { logSecurityEvent } = await import("@/lib/admin/security.server");
        await logSecurityEvent({
          type: "mail_failed",
          severity: "warning",
          path: "/start",
          details: { inquiryId: row.id, error: String(mailError) },
        });
      } catch (logErr) {
        console.error("Failed to log mail_failed crash:", logErr);
      }
    }

    return { ok: true as const };
  });
