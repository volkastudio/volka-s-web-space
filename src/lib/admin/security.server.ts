// Server-side security event logging, login throttling, and owner alerts (Phase 5c).
// Never import this file directly in client-side bundles.
import type { Json } from "@/integrations/supabase/types";

export type SecurityEventType =
  | "login_failed"
  | "login_success"
  | "admin_forbidden"
  | "role_denied"
  | "rate_limited"
  | "honeypot_hit"
  | "too_fast"
  | "duplicate_submit"
  | "mail_failed"
  | "scan_failed"
  | "cron_failed"
  | "report_token_invalid"
  | "security_alert_sent"
  | "salt_missing"
  | "health_check_failed";

export type SecuritySeverity = "info" | "warning" | "critical";

export interface LogSecurityEventParams {
  type: SecurityEventType | string;
  severity: SecuritySeverity;
  actorId?: string | null;
  ipHash?: string | null;
  path?: string | null;
  details?: Record<string, unknown> | null;
}

export const LOGIN_LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_ALERT_THRESHOLD = 10;
export const LOGIN_ALERT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const ALERT_DEBOUNCE_WINDOW_MS = 60 * 60 * 1000; // 1 hour per rule

/**
 * Computes a standard SHA-256 hash of an identifier with a secret salt.
 */
export async function hashIdentifier(value: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${value.trim().toLowerCase()}:${salt}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Logs a security event into the `security_events` table and evaluates alerting rules.
 * Never throws to the caller.
 */
export async function logSecurityEvent(params: LogSecurityEventParams): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("security_events").insert({
      type: params.type,
      severity: params.severity,
      actor_id: params.actorId ?? null,
      ip_hash: params.ipHash ?? null,
      path: params.path ?? null,
      details: (params.details as unknown as Json) ?? null,
    });

    // Evaluate alerting triggers asynchronously
    await evaluateAlertTriggers(params);
  } catch (err) {
    console.error("[Security] Failed to record security event:", err);
  }
}

/**
 * Evaluates whether an alert to the owner should be fired, de-duplicated to 1/hour per rule.
 */
async function evaluateAlertTriggers(event: LogSecurityEventParams): Promise<void> {
  // 1. Valid non-admin user hitting admin functions
  if (event.type === "admin_forbidden" || event.type === "role_denied") {
    await sendDebouncedAlert({
      rule: "unauthorized_admin_access",
      title: "Tentative d'accès non autorisé à l'administration",
      message: `Un utilisateur authentifié a tenté d'accéder à une ressource restreinte sans les privilèges requis (${event.type}).`,
      details: {
        actorId: event.actorId,
        path: event.path,
        details: event.details,
      },
    });
  }

  // 2. SECRET_SALT missing
  if (event.type === "salt_missing") {
    await sendDebouncedAlert({
      rule: "salt_missing",
      title: "Variable SECRET_SALT manquante",
      message: "La variable SECRET_SALT n'est pas définie dans l'environnement. Le hachage des adresses IP et le rate limiting sont inactifs.",
      details: event.details ?? undefined,
    });
  }

  // 3. Mail failure streak (check recent 3 mail failures)
  if (event.type === "mail_failed") {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("security_events")
      .select("id", { count: "exact", head: true })
      .eq("type", "mail_failed")
      .gte("ts", new Date(Date.now() - 30 * 60 * 1000).toISOString());

    if ((count ?? 0) >= 3) {
      await sendDebouncedAlert({
        rule: "mail_failure_streak",
        title: "Échecs répétés d'envoi d'emails (SMTP)",
        message: "Au moins 3 échecs consécutifs d'envoi d'emails ont été enregistrés au cours des 30 dernières minutes.",
        details: { recentFailures: count, latestError: event.details },
      });
    }
  }

  // 4. Critical health check turning red
  if (event.type === "health_check_failed" && event.severity === "critical") {
    await sendDebouncedAlert({
      rule: "health_check_critical",
      title: "Échec critique d'un contrôle de santé",
      message: `Un contrôle système de haute criticité est passé en erreur : ${event.details?.["key"] ?? "Inconnu"}.`,
      details: event.details ?? undefined,
    });
  }
}

/**
 * Checks de-duplication window and dispatches security alert email.
 */
export async function sendDebouncedAlert(params: {
  rule: string;
  title: string;
  message: string;
  details?: Record<string, unknown> | undefined;
}): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - ALERT_DEBOUNCE_WINDOW_MS).toISOString();

    // Check if an alert was already sent for this rule within the last hour
    const { data: existing } = await supabaseAdmin
      .from("security_events")
      .select("id")
      .eq("type", "security_alert_sent")
      .contains("details", { rule: params.rule })
      .gte("ts", cutoff)
      .limit(1);

    if (existing && existing.length > 0) {
      // Alert already sent recently for this rule, de-duplicate
      return false;
    }

    // Record the alert event first
    await supabaseAdmin.from("security_events").insert({
      type: "security_alert_sent",
      severity: "warning",
      details: {
        rule: params.rule,
        title: params.title,
        dispatchedAt: new Date().toISOString(),
      } as unknown as Json,
    });

    // Send the email
    const { sendSecurityAlertEmail } = await import("@/lib/mailer.server");
    await sendSecurityAlertEmail({
      rule: params.rule,
      title: params.title,
      message: params.message,
      details: params.details,
    });

    return true;
  } catch (err) {
    console.error(`[SecurityAlert] Failed to dispatch alert for ${params.rule}:`, err);
    return false;
  }
}

/**
 * Checks if admin login is currently throttled for the given email or IP.
 */
export async function checkLoginThrottle(params: {
  emailHash: string;
  ipHash: string;
}): Promise<{ isLocked: boolean; remainingMinutes: number }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - LOGIN_LOCK_WINDOW_MS).toISOString();

    const { count, error } = await supabaseAdmin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .or(`email_hash.eq.${params.emailHash},ip_hash.eq.${params.ipHash}`)
      .eq("success", false)
      .gte("ts", cutoff);

    if (error) {
      console.error("[Security] Throttle check failed:", error.message);
      return { isLocked: false, remainingMinutes: 0 };
    }

    if ((count ?? 0) >= LOGIN_MAX_FAILURES) {
      return { isLocked: true, remainingMinutes: 15 };
    }

    return { isLocked: false, remainingMinutes: 0 };
  } catch (err) {
    console.error("[Security] Unexpected error in throttle check:", err);
    return { isLocked: false, remainingMinutes: 0 };
  }
}

/**
 * Records a login attempt in the database and evaluates brute-force alert threshold.
 */
export async function recordLoginAttempt(params: {
  emailHash: string;
  ipHash: string;
  success: boolean;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("login_attempts").insert({
      email_hash: params.emailHash,
      ip_hash: params.ipHash,
      success: params.success,
    });

    if (!params.success) {
      // Check if 10+ failed logins occurred in the past hour
      const hourCutoff = new Date(Date.now() - LOGIN_ALERT_WINDOW_MS).toISOString();
      const { count } = await supabaseAdmin
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("success", false)
        .gte("ts", hourCutoff);

      if ((count ?? 0) >= LOGIN_ALERT_THRESHOLD) {
        await sendDebouncedAlert({
          rule: "failed_logins_spike",
          title: "Pic de tentatives de connexion échouées (Brute Force)",
          message: `Au moins ${count} échecs de connexion administrateur ont été enregistrés dans la dernière heure.`,
          details: {
            failedAttemptsInPastHour: count,
            latestIpHash: params.ipHash,
          },
        });
      }
    }
  } catch (err) {
    console.error("[Security] Failed to record login attempt:", err);
  }
}

/**
 * Purges raw security events older than retention period (default 90 days).
 */
export async function cleanupSecurityEvents(retentionDays = 90): Promise<number> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const { error, count } = await supabaseAdmin
      .from("security_events")
      .delete({ count: "exact" })
      .lt("ts", cutoff);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("[Security] Failed to clean up security events:", err);
    return 0;
  }
}
