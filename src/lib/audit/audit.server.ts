// Server-side business logic for Phase 11 (/audit)
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { hashIdentifier, logSecurityEvent } from "@/lib/admin/security.server";
import { sendAuditVerificationEmail, sendAuditTeamAlertEmail } from "@/lib/mailer.server";
import { z } from "zod";
import crypto from "node:crypto";

export const AuditTrackEnum = z.enum(["website", "marketing", "sales", "general"]);
export type AuditTrack = z.infer<typeof AuditTrackEnum>;

export const AuditStatusEnum = z.enum([
  "pending_verification",
  "queued",
  "waitlist",
  "reviewing",
  "completed",
  "rejected",
]);
export type AuditStatus = z.infer<typeof AuditStatusEnum>;

export const AuditSubmissionSchema = z.object({
  contactName: z.string().trim().min(2, "Le nom est requis (au moins 2 caractères)."),
  contactEmail: z.string().trim().email("Adresse email invalide."),
  contactPhone: z.string().trim().min(6, "Numéro WhatsApp valide requis."),
  companyName: z.string().trim().min(2, "Le nom de l'entreprise est requis."),
  activitySector: z.string().trim().min(2, "Le secteur d'activité est requis."),
  country: z.string().trim().min(2, "Le pays est requis."),
  teamSize: z.string().trim().min(1, "La taille de l'équipe est requise."),
  track: AuditTrackEnum,
  websiteUrl: z.string().trim().optional(),
  specificAnswers: z.record(z.unknown()).default({}),
  isEntitled: z.boolean().refine((val) => val === true, {
    message: "Vous devez confirmer être habilité(e) à demander cet audit.",
  }),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "Le consentement à la politique de confidentialité est requis.",
  }),
  gotcha: z.string().optional(),
  elapsedMs: z.number().optional(),
});

export type AuditSubmissionInput = z.infer<typeof AuditSubmissionSchema>;

export interface AuditCapacityStatus {
  capacity: number;
  used: number;
  remaining: number;
  isOpen: boolean;
  deliveryDays: number;
  monthName: string;
}

/**
 * Calculates real capacity status for the current calendar month.
 */
export async function getAuditCapacityStatus(): Promise<AuditCapacityStatus> {
  // 1. Read settings from site_settings (key: 'audit')
  const { data: settingRow } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "audit")
    .maybeSingle();

  const val = (settingRow?.value as Record<string, unknown>) ?? {};
  const capacity = typeof val["capacity_per_month"] === "number" ? val["capacity_per_month"] : 15;
  const deliveryDays = typeof val["delivery_working_days"] === "number" ? val["delivery_working_days"] : 5;
  const isOpen = val["is_open"] !== false;

  // 2. Compute first day of current month in UTC
  const now = new Date();
  const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  // 3. Count verified audits in this month
  const { count } = await supabaseAdmin
    .from("audit_requests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", firstDayOfMonth)
    .neq("status", "pending_verification")
    .neq("status", "rejected");

  const used = count ?? 0;
  const remaining = Math.max(0, capacity - used);

  const monthNames = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  const monthName = monthNames[now.getUTCMonth()] ?? "ce mois";

  return {
    capacity,
    used,
    remaining,
    isOpen: isOpen && remaining > 0,
    deliveryDays,
    monthName,
  };
}

/**
 * Handles initial submission of an audit request.
 * Sets status to 'pending_verification' and sends verification link.
 */
export async function submitAuditRequest(
  rawInput: unknown,
  clientIp?: string
): Promise<{ success: boolean; error?: string; auditId?: string }> {
  const parsed = AuditSubmissionSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstErr = parsed.error.issues[0]?.message ?? "Données invalides.";
    return { success: false, error: firstErr };
  }

  const input = parsed.data;

  const salt = process.env["SECRET_SALT"] || "";
  const hashedIp = clientIp && salt ? await hashIdentifier(clientIp, salt) : null;

  // Bot check 1: Honeypot
  if (input.gotcha && input.gotcha.trim().length > 0) {
    await logSecurityEvent({
      type: "honeypot_triggered",
      severity: "warning",
      ipHash: hashedIp ?? null,
      path: "/audit/demande",
      details: { field: "_gotcha", company: input.companyName },
    });
    return { success: false, error: "Validation échouée." };
  }

  // Bot check 2: Timing (< 3000 ms)
  if (input.elapsedMs !== undefined && input.elapsedMs < 3000) {
    await logSecurityEvent({
      type: "form_submitted_too_fast",
      severity: "warning",
      ipHash: hashedIp ?? null,
      path: "/audit/demande",
      details: { elapsedMs: input.elapsedMs, email: input.contactEmail },
    });
    return { success: false, error: "Soumission trop rapide. Veuillez réessayer posément." };
  }

  // Bot check 3: Rate limit by hashed IP (max 3 submissions / 24h)
  if (hashedIp) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("audit_requests")
      .select("id", { count: "exact", head: true })
      .eq("hashed_ip", hashedIp)
      .gte("created_at", cutoff);

    if ((count ?? 0) >= 3) {
      await logSecurityEvent({
        type: "rate_limit_exceeded",
        severity: "warning",
        ipHash: hashedIp ?? undefined,
        path: "/audit/demande",
        details: { count, email: input.contactEmail },
      });
      return {
        success: false,
        error: "Trop de demandes enregistrées pour votre connexion aujourd'hui. Veuillez réessayer demain.",
      };
    }
  }

  // Generate high-entropy verification token (valid 48h)
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("audit_requests")
    .insert({
      status: "pending_verification",
      track: input.track,
      contact_name: input.contactName,
      contact_email: input.contactEmail.toLowerCase(),
      contact_phone: input.contactPhone,
      company_name: input.companyName,
      activity_sector: input.activitySector,
      country: input.country,
      team_size: input.teamSize,
      website_url: input.websiteUrl || null,
      specific_answers: input.specificAnswers as unknown as Json,
      verification_token: verificationToken,
      verification_token_expires_at: expiresAt,
      is_entitled: input.isEntitled,
      privacy_consent: input.privacyConsent,
      hashed_ip: hashedIp,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[Audit] Insert error:", error);
    return { success: false, error: "Impossible d'enregistrer votre demande. Veuillez réessayer." };
  }

  // Send verification email
  const mailRes = await sendAuditVerificationEmail({
    email: input.contactEmail,
    name: input.contactName,
    company: input.companyName,
    track: input.track,
    token: verificationToken,
  });

  if (!mailRes.success) {
    await logSecurityEvent({
      type: "mail_failed",
      severity: "warning",
      path: "/audit/demande",
      details: { auditId: data.id, error: mailRes.error },
    });
  }

  return { success: true, auditId: data.id };
}

/**
 * Validates double opt-in verification token from email.
 * Transitions to 'queued' or 'waitlist' depending on monthly capacity.
 */
export async function verifyAuditEmail(token: string): Promise<{
  success: boolean;
  error?: string;
  status?: "queued" | "waitlist";
  company?: string;
  track?: string;
  deliveryDays?: number;
}> {
  if (!token || typeof token !== "string" || token.length < 16) {
    return { success: false, error: "Jeton de vérification invalide." };
  }

  const { data: audit, error } = await supabaseAdmin
    .from("audit_requests")
    .select("*")
    .eq("verification_token", token)
    .maybeSingle();

  if (error || !audit) {
    return {
      success: false,
      error: "Ce lien de vérification est introuvable ou a déjà été consommé.",
    };
  }

  // Already verified?
  if (audit.status !== "pending_verification") {
    const current = await getAuditCapacityStatus();
    return {
      success: true,
      status: audit.status === "waitlist" ? "waitlist" : "queued",
      company: audit.company_name,
      track: audit.track,
      deliveryDays: current.deliveryDays,
    };
  }

  // Check expiration (48 hours)
  const isExpired = new Date(audit.verification_token_expires_at).getTime() < Date.now();
  if (isExpired) {
    return {
      success: false,
      error: "Ce lien de confirmation a expiré (validité 48h). Veuillez soumettre une nouvelle demande.",
    };
  }

  // Check monthly capacity
  const capacity = await getAuditCapacityStatus();
  const nextStatus: "queued" | "waitlist" = capacity.isOpen ? "queued" : "waitlist";

  let dueAt: string | null = null;
  if (nextStatus === "queued") {
    // Due date = now + deliveryDays working days (approx 7 days total)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (capacity.deliveryDays > 0 ? capacity.deliveryDays + 2 : 7));
    dueAt = dueDate.toISOString();
  }

  const nowIso = new Date().toISOString();
  const { error: updateErr } = await supabaseAdmin
    .from("audit_requests")
    .update({
      status: nextStatus,
      verified_at: nowIso,
      due_at: dueAt,
      updated_at: nowIso,
    })
    .eq("id", audit.id);

  if (updateErr) {
    console.error("[Audit] Verification update error:", updateErr);
    return { success: false, error: "Erreur lors de la confirmation. Veuillez réessayer." };
  }

  // Dispatched team notification
  await sendAuditTeamAlertEmail({
    auditId: audit.id,
    name: audit.contact_name,
    company: audit.company_name,
    track: audit.track,
    status: nextStatus,
    country: audit.country,
  });

  return {
    success: true,
    status: nextStatus,
    company: audit.company_name,
    track: audit.track,
    deliveryDays: capacity.deliveryDays,
  };
}

/**
 * Lists audit requests for back-office administration.
 */
export async function getAdminAuditsList(params: {
  status?: string | undefined;
  track?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}) {
  let query = supabaseAdmin
    .from("audit_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status as AuditStatus);
  }

  if (params.track && params.track !== "all") {
    query = query.eq("track", params.track as AuditTrack);
  }

  const limit = params.limit ?? 25;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("[Audit] Admin list error:", error);
    throw new Error(error.message);
  }

  return { audits: data ?? [], totalCount: count ?? 0 };
}

/**
 * Updates status or notes for an audit request in back-office.
 */
export async function updateAdminAuditStatus(params: {
  id: string;
  status?: AuditStatus | undefined;
  adminNotes?: string | undefined;
  markSent?: boolean | undefined;
}) {
  const patch: {
    updated_at: string;
    status?: AuditStatus;
    admin_notes?: string;
    sent_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (params.status) patch.status = params.status;
  if (params.adminNotes !== undefined) patch.admin_notes = params.adminNotes;
  if (params.markSent) {
    patch.sent_at = new Date().toISOString();
    patch.status = "completed";
  }

  const { data, error } = await supabaseAdmin
    .from("audit_requests")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Updates site_settings key='audit' (capacity_per_month, delivery_working_days, is_open).
 */
export async function updateAuditSettings(settings: {
  capacity_per_month?: number;
  delivery_working_days?: number;
  is_open?: boolean;
}): Promise<AuditCapacityStatus> {
  const { data: current } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "audit")
    .maybeSingle();

  const currentVal = (current?.value as Record<string, unknown>) ?? {};
  const nextVal = {
    ...currentVal,
    ...(settings.capacity_per_month !== undefined && { capacity_per_month: settings.capacity_per_month }),
    ...(settings.delivery_working_days !== undefined && { delivery_working_days: settings.delivery_working_days }),
    ...(settings.is_open !== undefined && { is_open: settings.is_open }),
  };

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert(
      {
        key: "audit",
        value: nextVal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

  if (error) {
    throw new Error(error.message);
  }

  return await getAuditCapacityStatus();
}

/**
 * Admin: Get a single audit request with its reports and details.
 */
export async function getAdminAuditById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("audit_requests")
    .select("*, audit_reports(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

