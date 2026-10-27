import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth } from "@/integrations/supabase/admin-middleware";
import type { Database } from "@/integrations/supabase/types";

type InquiryRow = Database["public"]["Tables"]["project_inquiries"]["Row"];

export const listAdminInquiries = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator(
    (data?: {
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }) =>
      z
        .object({
          status: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().int().min(1).max(100).default(50).optional(),
          offset: z.number().int().min(0).default(0).optional(),
        })
        .optional()
        .parse(data ?? {}),
  )
  .handler(async ({ data: input = {} }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("project_inquiries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (input.status && input.status !== "all") {
      query = query.eq("status", input.status);
    }

    if (input.search && input.search.trim()) {
      // Sanitize search term to prevent PostgREST grammar breakage from commas, parentheses, colons, or percent signs
      const sanitized = input.search.trim().replace(/[,()%:*\\]/g, " ").trim();
      if (sanitized) {
        const term = `%${sanitized}%`;
        query = query.or(`name.ilike.${term},email.ilike.${term},company.ilike.${term},vision.ilike.${term}`);
      }
    }

    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("[listAdminInquiries] Error:", error.message);
      throw new Error(`Failed to list inquiries: ${error.message}`);
    }

    // Count unread / new
    const { count: unreadCount } = await supabaseAdmin
      .from("project_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    return {
      items: (data || []) as InquiryRow[],
      totalCount: count ?? 0,
      unreadCount: unreadCount ?? 0,
    };
  });

export const getAdminInquiry = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("project_inquiries")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();

    if (error) {
      console.error("[getAdminInquiry] Error:", error.message);
      throw new Error(`Failed to get inquiry: ${error.message}`);
    }

    if (!data) {
      throw new Error("Inquiry not found");
    }

    return data as InquiryRow;
  });

export const updateInquiry = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator(
    (data: {
      id: string;
      status?: "new" | "read" | "replied" | "won" | "lost" | "spam";
      internal_notes?: string | null;
    }) =>
      z
        .object({
          id: z.string().uuid(),
          status: z.enum(["new", "read", "replied", "won", "lost", "spam"]).optional(),
          internal_notes: z.string().nullable().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Partial<Database["public"]["Tables"]["project_inquiries"]["Update"]> = {};
    if (input.status !== undefined) patch.status = input.status;
    if (input.internal_notes !== undefined) patch.internal_notes = input.internal_notes;

    const { data, error } = await supabaseAdmin
      .from("project_inquiries")
      .update(patch)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("[updateInquiry] Error:", error.message);
      throw new Error(`Failed to update inquiry: ${error.message}`);
    }

    return data as InquiryRow;
  });

function formatInquiryPayload(inquiry: InquiryRow) {
  return {
    name: inquiry.name,
    email: inquiry.email,
    company: inquiry.company ?? undefined,
    phone: inquiry.phone ?? undefined,
    preferredChannel: (inquiry.preferred_channel === "whatsapp" ? "whatsapp" : "email") as "email" | "whatsapp",
    offer: inquiry.offer as import("@/data/offers").OfferId,
    timeline: inquiry.timeline,
    budgetRange: inquiry.budget_range,
    vision: inquiry.vision,
    challenge: inquiry.challenge ?? undefined,
    referralSource: inquiry.referral_source ?? undefined,
    locale: (inquiry.locale as "fr" | "en") ?? "fr",
    website: "",
    elapsedMs: 10_000,
  };
}

/** Resends ONLY the internal studio notification (Finding F3) */
export const resendInquiryNotification = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: input }) => {
    const [{ supabaseAdmin }, { sendInternalNotification }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@/lib/mailer.server"),
    ]);

    const { data: inquiry, error } = await supabaseAdmin
      .from("project_inquiries")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();

    if (error || !inquiry) {
      throw new Error("Inquiry not found to resend notification");
    }

    const payload = formatInquiryPayload(inquiry);
    const result = await sendInternalNotification(payload, inquiry.id);

    const now = new Date().toISOString();
    await supabaseAdmin
      .from("project_inquiries")
      .update({
        notified_at: result.success ? now : inquiry.notified_at,
        notify_error: result.success ? null : result.error ?? "Failed to send internal notification",
      })
      .eq("id", inquiry.id);

    return {
      notified: result.success,
      errors: result.error ? [result.error] : [],
    };
  });

/** Resends ONLY the prospect auto-reply confirmation email (Finding F3) */
export const resendInquiryAutoReply = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data: input }) => {
    const [{ supabaseAdmin }, { sendAutoReply }] = await Promise.all([
      import("@/integrations/supabase/client.server"),
      import("@/lib/mailer.server"),
    ]);

    const { data: inquiry, error } = await supabaseAdmin
      .from("project_inquiries")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();

    if (error || !inquiry) {
      throw new Error("Inquiry not found to resend auto-reply");
    }

    const payload = formatInquiryPayload(inquiry);
    const result = await sendAutoReply(payload, inquiry.id);

    return {
      success: result.success,
      error: result.error,
    };
  });

