// Phase 11.1: Audit report generation and token-based access
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendAuditReportEmail } from "@/lib/mailer.server";
import crypto from "node:crypto";

export interface AuditScorecardItem {
  pillar: string;
  score: number;   // 0–5
  label: string;   // e.g. "Solide, optimisation requise"
}

export interface AuditFinding {
  id?: string;
  title: string;
  why: string;
  fix: string;
  impact: number;  // 1–5
  effort: number;  // 1–5
  type: "finding" | "quick_win";
}

export interface AuditRecommendation {
  offer: "offer-1" | "offer-2" | "offer-3" | string;
  offer_label: string;
  rationale: string;
}

export interface AuditReportData {
  id: string;
  audit_request_id: string;
  token_hash: string;
  locale: string;
  scorecard: AuditScorecardItem[];
  findings: AuditFinding[];
  quick_wins: AuditFinding[];
  recommendation: AuditRecommendation;
  sent_at: string | null;
  first_viewed_at: string | null;
  view_count: number;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  // joined from audit_requests:
  company_name: string;
  contact_name: string;
  contact_email: string;
  track: string;
  diagnosis_date: string;
}

/**
 * Generate a new audit report token and persist it (hash stored, raw token returned once).
 */
export async function createAuditReport(params: {
  auditRequestId: string;
  locale?: string;
  scorecard: AuditScorecardItem[];
  findings: AuditFinding[];
  quickWins: AuditFinding[];
  recommendation: AuditRecommendation;
  minutesSpent?: number;
  sendEmail?: boolean;
}): Promise<{ success: boolean; token?: string; reportId?: string; reportUrl?: string; emailSent?: boolean; error?: string }> {
  // 1. Load the audit request to validate it exists
  const { data: audit, error: auditErr } = await supabaseAdmin
    .from("audit_requests")
    .select("id, status, contact_email, contact_name, company_name, track")
    .eq("id", params.auditRequestId)
    .maybeSingle();

  if (auditErr || !audit) {
    return { success: false, error: "Demande d'audit introuvable." };
  }

  // 2. Generate high-entropy token (64 hex chars = 32 bytes)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // 3. Expire old reports for this audit (revoke them)
  await supabaseAdmin
    .from("audit_reports")
    .update({ revoked_at: new Date().toISOString() })
    .eq("audit_request_id", params.auditRequestId)
    .is("revoked_at", null);

  // 4. Insert new report
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: report, error: insertErr } = await supabaseAdmin
    .from("audit_reports")
    .insert({
      audit_request_id: params.auditRequestId,
      token_hash: tokenHash,
      locale: params.locale ?? "fr",
      scorecard: params.scorecard as any,
      findings: params.findings as any,
      quick_wins: params.quickWins as any,
      recommendation: params.recommendation as any,
      sent_at: now,
      expires_at: expiresAt,
      updated_at: now,
    })
    .select("id")
    .single();

  if (insertErr || !report) {
    return { success: false, error: "Impossible de créer le rapport." };
  }

  // 5. Update audit status to completed, set sent_at and minutes_spent
  type AuditPatch = {
    status: "completed";
    sent_at: string;
    updated_at: string;
    minutes_spent?: number;
  };
  const auditPatch: AuditPatch = {
    status: "completed",
    sent_at: now,
    updated_at: now,
  };
  if (typeof params.minutesSpent === "number" && params.minutesSpent > 0) {
    auditPatch.minutes_spent = params.minutesSpent;
  }

  await supabaseAdmin
    .from("audit_requests")
    .update(auditPatch)
    .eq("id", params.auditRequestId);

  const siteUrl = (process.env["SITE_URL"] || "https://volkastudio.com").replace(/\/$/, "");
  const reportUrl = `${siteUrl}/audit/rapport?token=${rawToken}`;
  let emailSent = false;

  // 6. Optionally send the report email directly to the client
  if (params.sendEmail !== false && audit.contact_email) {
    const mailResult = await sendAuditReportEmail({
      email: audit.contact_email,
      name: audit.contact_name || "Client",
      company: audit.company_name || "Votre entreprise",
      track: audit.track || "general",
      reportUrl,
    });
    emailSent = mailResult.success;
  }

  return {
    success: true,
    token: rawToken,
    reportId: report.id,
    reportUrl,
    emailSent,
  };
}

/**
 * Fetch a report by its raw token (checks hash, expiry and revocation).
 * Tracks view count and first_viewed_at.
 */
export async function getAuditReportByToken(rawToken: string): Promise<{
  success: boolean;
  error?: string;
  report?: AuditReportData;
}> {
  if (!rawToken || rawToken.length < 32) {
    return { success: false, error: "Jeton de rapport invalide." };
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const { data: report, error } = await supabaseAdmin
    .from("audit_reports")
    .select("*, audit_requests(company_name, contact_name, contact_email, track, created_at)")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !report) {
    return { success: false, error: "Ce rapport est introuvable ou le lien est invalide." };
  }

  // Check revocation
  if (report.revoked_at) {
    return { success: false, error: "Ce lien de rapport a été révoqué par le studio." };
  }

  // Check expiry
  if (new Date(report.expires_at).getTime() < Date.now()) {
    return { success: false, error: "Ce lien de rapport a expiré (validité 90 jours)." };
  }

  // Update view tracking (fire & forget)
  const now = new Date().toISOString();
  void (async () => {
    try {
      await supabaseAdmin
        .from("audit_reports")
        .update({
          view_count: (report.view_count || 0) + 1,
          first_viewed_at: report.first_viewed_at ?? now,
        })
        .eq("id", report.id);
    } catch (_) {
      // non-critical
    }
  })();

  const auditReq = (report as Record<string, unknown>)["audit_requests"] as {
    company_name: string;
    contact_name: string;
    contact_email: string;
    track: string;
    created_at: string;
  } | null;

  return {
    success: true,
    report: {
      id: report.id as string,
      audit_request_id: report.audit_request_id as string,
      token_hash: report.token_hash as string,
      locale: (report.locale as string) ?? "fr",
      scorecard: ((report.scorecard as unknown) as AuditScorecardItem[]) ?? [],
      findings: ((report.findings as unknown) as AuditFinding[]) ?? [],
      quick_wins: ((report.quick_wins as unknown) as AuditFinding[]) ?? [],
      recommendation: ((report.recommendation as unknown) as AuditRecommendation) ?? {},
      sent_at: report.sent_at as string | null,
      first_viewed_at: report.first_viewed_at as string | null,
      view_count: (report.view_count as number) ?? 0,
      expires_at: report.expires_at as string,
      revoked_at: report.revoked_at as string | null,
      created_at: report.created_at as string,
      company_name: auditReq?.company_name ?? "—",
      contact_name: auditReq?.contact_name ?? "—",
      contact_email: auditReq?.contact_email ?? "—",
      track: auditReq?.track ?? "general",
      diagnosis_date: auditReq?.created_at ?? report.created_at as string,
    },
  };
}

/**
 * Admin: Get all reports for an audit request.
 */
export async function getReportsForAudit(auditRequestId: string) {
  const { data, error } = await supabaseAdmin
    .from("audit_reports")
    .select("id, created_at, sent_at, first_viewed_at, view_count, expires_at, revoked_at, locale")
    .eq("audit_request_id", auditRequestId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Admin: Revoke a report link.
 */
export async function revokeAuditReport(reportId: string): Promise<{ success: boolean }> {
  const { error } = await supabaseAdmin
    .from("audit_reports")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Admin: List findings from library, optionally filtered by track.
 */
export async function getAuditFindingsLibrary(params?: { track?: string; activeOnly?: boolean }) {
  let query = supabaseAdmin
    .from("audit_findings_library")
    .select("*")
    .order("impact", { ascending: false });

  if (params?.track && params.track !== "all") {
    query = query.eq("track", params.track as "website" | "sales" | "marketing" | "general");
  }
  if (params?.activeOnly !== false) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
