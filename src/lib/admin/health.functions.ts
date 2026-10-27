// Server functions for the Health & Security back-office page and admin authentication (Phase 5c).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerAuth } from "@/integrations/supabase/admin-middleware";
import { getClientIp, hashIp } from "../inquiry-guards";
import type { HealthSummary } from "./health.server";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

/**
 * Server-side Admin Login (Phase 5c.1)
 *
 * Calls Supabase auth on the server, enforces brute-force lockout per hashed IP & email,
 * logs security events (login_failed, login_success, admin_forbidden),
 * and triggers alerts if 10+ failures occur within an hour.
 */
export const adminSignIn = createServerFn({ method: "POST" })
  .validator((data: unknown) => signInSchema.parse(data))
  .handler(async (ctx) => {
    const { email, password } = ctx.data;

    const [{ getRequest }, { supabaseAdmin }, { checkLoginThrottle, recordLoginAttempt, logSecurityEvent, hashIdentifier }] =
      await Promise.all([
        import("@tanstack/react-start/server"),
        import("@/integrations/supabase/client.server"),
        import("./security.server"),
      ]);

    const request = getRequest();
    const salt = process.env["SECRET_SALT"] || "fallback_salt_volka";
    const ip = getClientIp(request.headers);
    const ipHash = await hashIp(ip, salt);
    const emailHash = await hashIdentifier(email, salt);

    // 1. Check if currently throttled/locked
    const throttle = await checkLoginThrottle({ emailHash, ipHash });
    if (throttle.isLocked) {
      await logSecurityEvent({
        type: "rate_limited",
        severity: "warning",
        ipHash,
        path: "/admin/login",
        details: { target: "admin_login", reason: "Max failures reached" },
      });
      return {
        ok: false as const,
        error:
          "Trop de tentatives de connexion échouées. Par mesure de sécurité, ce compte est temporairement verrouillé pour 15 minutes.",
      };
    }

    // 2. Perform authentication with Supabase
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env["SUPABASE_URL"]!;
    const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"]!;

    const authClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      await recordLoginAttempt({ emailHash, ipHash, success: false });
      await logSecurityEvent({
        type: "login_failed",
        severity: "warning",
        ipHash,
        path: "/admin/login",
        details: { emailHash, error: authError?.message },
      });

      return {
        ok: false as const,
        error:
          "Identifiants invalides ou compte temporairement verrouillé. Veuillez vérifier vos accès.",
      };
    }

    // 3. Check if user possesses administrative privileges in admin_users
    const { data: adminRecord, error: adminCheckError } = await supabaseAdmin
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (adminCheckError || !adminRecord) {
      await recordLoginAttempt({ emailHash, ipHash, success: false });
      await logSecurityEvent({
        type: "admin_forbidden",
        severity: "warning",
        actorId: authData.user.id,
        ipHash,
        path: "/admin/login",
        details: { email: authData.user.email, reason: "Authenticated user not in admin_users" },
      });

      return {
        ok: false as const,
        error:
          "Accès refusé. Ce compte ne dispose pas des privilèges administrateur pour le studio.",
      };
    }

    // 4. Successful login
    await recordLoginAttempt({ emailHash, ipHash, success: true });
    await logSecurityEvent({
      type: "login_success",
      severity: "info",
      actorId: authData.user.id,
      ipHash,
      path: "/admin/login",
      details: { role: adminRecord.role },
    });

    return {
      ok: true as const,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      },
      role: adminRecord.role,
    };
  });

/**
 * Retrieves the full health and security status (Owner-only).
 */
export const getHealthDashboardData = createServerFn({ method: "GET" })
  .middleware([requireOwnerAuth])
  .handler(async () => {
    const [{ runAllHealthChecks }, { supabaseAdmin }] = await Promise.all([
      import("./health.server"),
      import("@/integrations/supabase/client.server"),
    ]);

    // Run live health checks
    const healthSummary: HealthSummary = await runAllHealthChecks();

    // Fetch recent security events (latest 50)
    const { data: events } = await supabaseAdmin
      .from("security_events")
      .select("id, ts, type, severity, actor_id, ip_hash, path, details")
      .order("ts", { ascending: false })
      .limit(50);

    return {
      health: healthSummary,
      events: events ?? [],
    };
  });

/**
 * Triggers a live execution of all health checks on demand (Owner-only).
 */
export const triggerHealthChecks = createServerFn({ method: "POST" })
  .middleware([requireOwnerAuth])
  .handler(async () => {
    const { runAllHealthChecks } = await import("./health.server");
    const summary = await runAllHealthChecks();
    return summary;
  });

/**
 * Filter security events with pagination (Owner-only).
 */
const eventsFilterSchema = z.object({
  severity: z.enum(["all", "info", "warning", "critical"]).default("all"),
  type: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

export const getSecurityEvents = createServerFn({ method: "GET" })
  .middleware([requireOwnerAuth])
  .validator((data: unknown) => eventsFilterSchema.parse(data))
  .handler(async (ctx) => {
    const { severity, type, limit } = ctx.data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("security_events")
      .select("id, ts, type, severity, actor_id, ip_hash, path, details")
      .order("ts", { ascending: false })
      .limit(limit);

    if (severity !== "all") {
      query = query.eq("severity", severity);
    }
    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  });
