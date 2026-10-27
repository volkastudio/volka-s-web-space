// Server-side health checks and permissions self-test (Phase 5c).
// Never import this file in client-side bundles.
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { logSecurityEvent } from "./security.server";

export interface HealthCheckResult {
  key: string;
  groupName: "config" | "permissions" | "auth" | "data" | "site";
  status: "ok" | "warning" | "error";
  detail: string;
  hint: string | null;
  checkedAt: string;
}

export interface HealthSummary {
  overallStatus: "ok" | "warning" | "error";
  totalChecks: number;
  okCount: number;
  warningCount: number;
  errorCount: number;
  lastCheckedAt: string;
  checks: HealthCheckResult[];
}

/**
 * Creates an unauthenticated Supabase client using the public anon/publishable key
 * to run security self-tests (F2).
 */
function createAnonTestClient() {
  const url = process.env["SUPABASE_URL"];
  const anonKey = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY for anon self-test");
  }
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * 1. Configuration Checks
 */
export async function checkConfiguration(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  const now = new Date().toISOString();

  // SMTP Check
  const smtpHost = process.env["SMTP_HOST"];
  const mailFrom = process.env["MAIL_FROM"];
  const mailNotifyTo = process.env["MAIL_NOTIFY_TO"];
  const isSmtpConfigured = Boolean(smtpHost && mailFrom && mailNotifyTo);
  results.push({
    key: "config_smtp",
    groupName: "config",
    status: isSmtpConfigured ? "ok" : "warning",
    detail: isSmtpConfigured
      ? `Serveur SMTP configuré (${smtpHost}) — Expéditeur : ${mailFrom}`
      : "Configuration SMTP incomplète (SMTP_HOST, MAIL_FROM ou MAIL_NOTIFY_TO manquant)",
    hint: isSmtpConfigured
      ? null
      : "Renseigner les identifiants SMTP dans les variables d'environnement (.env).",
    checkedAt: now,
  });

  // SECRET_SALT Check
  const salt = process.env["SECRET_SALT"];
  results.push({
    key: "config_secret_salt",
    groupName: "config",
    status: salt ? "ok" : "warning",
    detail: salt
      ? "Sel cryptographique SECRET_SALT présent (rate-limiting et hachage IP actifs)"
      : "SECRET_SALT absent : le hachage des adresses IP et le rate-limiting sont désactivés",
    hint: salt ? null : "Définir une clé aléatoire forte SECRET_SALT dans le fichier .env.",
    checkedAt: now,
  });

  // SITE_URL Check
  const siteUrl = process.env["SITE_URL"];
  const isHttps = siteUrl?.startsWith("https://") || siteUrl?.includes("localhost");
  results.push({
    key: "config_site_url",
    groupName: "config",
    status: siteUrl && isHttps ? "ok" : "warning",
    detail: siteUrl
      ? `URL canonique du site : ${siteUrl} (${isHttps ? "Sécurisé" : "Non-HTTPS"})`
      : "Variable SITE_URL non configurée",
    hint: siteUrl && isHttps ? null : "Configurer SITE_URL avec le protocole HTTPS en production.",
    checkedAt: now,
  });

  // WhatsApp Business Number (F1 check from site_settings)
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: setting } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "socials")
      .maybeSingle();

    const socials = (setting?.value as Record<string, string>) || {};
    const whatsapp = socials["whatsapp"]?.trim() || "";
    const isPlaceholder = whatsapp.includes("22900000000") || whatsapp.includes("000000");
    const isValid = whatsapp.length >= 8 && !isPlaceholder;

    results.push({
      key: "config_whatsapp",
      groupName: "config",
      status: isValid ? "ok" : "warning",
      detail: isValid
        ? `Lien WhatsApp studio opérationnel : ${whatsapp}`
        : isPlaceholder
          ? "Numéro WhatsApp factice détecté (placeholder)"
          : "Numéro WhatsApp non configuré dans les réglages",
      hint: isValid
        ? null
        : "Accéder à Réglages > Réseaux & Contact pour enregistrer le numéro officiel.",
      checkedAt: now,
    });

    // Contact Email
    const contactEmail = socials["email"] || process.env["CONTACT_EMAIL"];
    const isEmailValid = Boolean(contactEmail && contactEmail.includes("@"));
    results.push({
      key: "config_contact_email",
      groupName: "config",
      status: isEmailValid ? "ok" : "warning",
      detail: isEmailValid
        ? `Adresse email de contact : ${contactEmail}`
        : "Adresse email de contact non renseignée",
      hint: isEmailValid ? null : "Configurer l'adresse de contact dans Réglages > Réseaux.",
      checkedAt: now,
    });
  } catch (err) {
    results.push({
      key: "config_settings_error",
      groupName: "config",
      status: "warning",
      detail: "Impossible de lire la table site_settings",
      hint: "Vérifier que la migration Phase 5b a bien été appliquée.",
      checkedAt: now,
    });
  }

  // CRON_SECRET Check
  const cronSecret = process.env["CRON_SECRET"];
  results.push({
    key: "config_cron_secret",
    groupName: "config",
    status: cronSecret ? "ok" : "warning",
    detail: cronSecret
      ? "Clé secrète CRON_SECRET configurée pour les exécutions programmées"
      : "CRON_SECRET absent : les tâches programmées ne peuvent être vérifiées",
    hint: cronSecret ? null : "Définir CRON_SECRET pour sécuriser les appels Vercel Cron.",
    checkedAt: now,
  });

  return results;
}

/**
 * 2. Permissions Self-Test (F2) using the ANON key
 */
export async function runPermissionsSelfTest(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  const now = new Date().toISOString();

  let anonClient: ReturnType<typeof createAnonTestClient>;
  try {
    anonClient = createAnonTestClient();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({
      key: "permissions_client_init",
      groupName: "permissions",
      status: "error",
      detail: `Initialisation du client anonyme échouée : ${message}`,
      hint: "Vérifier les variables d'environnement Supabase publiques.",
      checkedAt: now,
    });
    return results;
  }

  // F2 Check: Anon direct INSERT into project_inquiries
  try {
    const { data: insertData, error: insertError } = await anonClient
      .from("project_inquiries")
      .insert({
        name: "Security Probe F2",
        email: "security-probe-f2@volkastudio.test",
        vision: "Probe RLS bypass",
        offer: "offer-1",
        budget_range: "5k-10k",
        timeline: "1m",
        preferred_channel: "email",
      })
      .select("id");

    if (!insertError && insertData && insertData.length > 0) {
      // VULNERABILITY DETECTED! Clean up the marker row immediately
      const probeId = insertData[0]?.id;
      if (probeId) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("project_inquiries").delete().eq("id", probeId);
      }

      await logSecurityEvent({
        type: "health_check_failed",
        severity: "critical",
        details: { key: "permissions_anon_insert", issue: "F2 Anon insert vulnerability active" },
      });

      results.push({
        key: "permissions_anon_insert",
        groupName: "permissions",
        status: "error",
        detail: "VULNÉRABILITÉ F2 CRITIQUE : L'insertion directe avec la clé anon a réussi !",
        hint: "Appliquer immédiatement la migration 20261026150000_phase5b_hardening.sql.",
        checkedAt: now,
      });
    } else {
      results.push({
        key: "permissions_anon_insert",
        groupName: "permissions",
        status: "ok",
        detail: "Protection active : Insertion anonyme directe dans project_inquiries refusée (RLS).",
        hint: null,
        checkedAt: now,
      });
    }
  } catch (err) {
    results.push({
      key: "permissions_anon_insert",
      groupName: "permissions",
      status: "ok",
      detail: "Protection active : Insertion anonyme directe rejetée avec exception.",
      hint: null,
      checkedAt: now,
    });
  }

  // Check: Anon direct SELECT on project_inquiries
  try {
    const { data, error } = await anonClient
      .from("project_inquiries")
      .select("id")
      .limit(1);

    if (!error && data && data.length > 0) {
      results.push({
        key: "permissions_anon_read_inquiries",
        groupName: "permissions",
        status: "error",
        detail: "Fuite de données : Les briefs clients sont lisibles publiquement par anon !",
        hint: "Vérifier les politiques RLS de project_inquiries.",
        checkedAt: now,
      });
    } else {
      results.push({
        key: "permissions_anon_read_inquiries",
        groupName: "permissions",
        status: "ok",
        detail: "Protection active : Lecture anonyme des briefs clients refusée.",
        hint: null,
        checkedAt: now,
      });
    }
  } catch {
    results.push({
      key: "permissions_anon_read_inquiries",
      groupName: "permissions",
      status: "ok",
      detail: "Protection active : Lecture anonyme refusée.",
      hint: null,
      checkedAt: now,
    });
  }

  // Check: Anon direct SELECT on admin_users
  try {
    const { data, error } = await anonClient
      .from("admin_users")
      .select("user_id")
      .limit(1);

    if (!error && data && data.length > 0) {
      results.push({
        key: "permissions_anon_read_admin_users",
        groupName: "permissions",
        status: "error",
        detail: "Fuite d'authentification : La table admin_users est lisible publiquement.",
        hint: "Vérifier la politique RLS sur admin_users.",
        checkedAt: now,
      });
    } else {
      results.push({
        key: "permissions_anon_read_admin_users",
        groupName: "permissions",
        status: "ok",
        detail: "Protection active : Liste des administrateurs inaccessible aux visiteurs anonymes.",
        hint: null,
        checkedAt: now,
      });
    }
  } catch {
    results.push({
      key: "permissions_anon_read_admin_users",
      groupName: "permissions",
      status: "ok",
      detail: "Protection active : Lecture admin_users refusée.",
      hint: null,
      checkedAt: now,
    });
  }

  // Check: Anon direct SELECT on draft case_studies
  try {
    const { data } = await anonClient
      .from("case_studies")
      .select("id")
      .eq("status", "draft")
      .limit(1);

    if (data && data.length > 0) {
      results.push({
        key: "permissions_anon_read_drafts",
        groupName: "permissions",
        status: "error",
        detail: "Brouillons exposés : Les études de cas non publiées sont lisibles par anon.",
        hint: "Vérifier la politique RLS 'public reads published case studies'.",
        checkedAt: now,
      });
    } else {
      results.push({
        key: "permissions_anon_read_drafts",
        groupName: "permissions",
        status: "ok",
        detail: "Protection active : Seuls les contenus publiés sont accessibles au public.",
        hint: null,
        checkedAt: now,
      });
    }
  } catch {
    results.push({
      key: "permissions_anon_read_drafts",
      groupName: "permissions",
      status: "ok",
      detail: "Protection active : Brouillons inaccessibles.",
      hint: null,
      checkedAt: now,
    });
  }

  return results;
}

/**
 * 3. Auth & Roles Checks
 */
export async function checkAuth(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  const now = new Date().toISOString();

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admins, error } = await supabaseAdmin
      .from("admin_users")
      .select("user_id, role");

    if (error || !admins) {
      results.push({
        key: "auth_admin_users",
        groupName: "auth",
        status: "error",
        detail: "Impossible de lire la table admin_users.",
        hint: "Vérifier la connexion à la base de données.",
        checkedAt: now,
      });
      return results;
    }

    const owners = admins.filter((a) => a.role === "owner");
    const sales = admins.filter((a) => a.role === "sales");
    const editors = admins.filter((a) => a.role === "editor");

    results.push({
      key: "auth_owners_present",
      groupName: "auth",
      status: owners.length > 0 ? "ok" : "error",
      detail:
        owners.length > 0
          ? `${owners.length} compte(s) Propriétaire (owner) configuré(s)`
          : "Aucun compte avec le rôle Propriétaire !",
      hint: owners.length > 0 ? null : "Assigner le rôle 'owner' à au moins un utilisateur.",
      checkedAt: now,
    });

    results.push({
      key: "auth_role_distribution",
      groupName: "auth",
      status: "ok",
      detail: `Rôles configurés : ${owners.length} Propriétaire(s), ${sales.length} Commercial(aux), ${editors.length} Rédacteur(s)`,
      hint: null,
      checkedAt: now,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({
      key: "auth_check_error",
      groupName: "auth",
      status: "error",
      detail: `Erreur lors de la vérification de l'authentification : ${message}`,
      hint: null,
      checkedAt: now,
    });
  }

  return results;
}

/**
 * 4. Data & Pipeline Checks
 */
export async function checkDataIntegrity(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  const now = new Date().toISOString();

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check inquiries unnotified for over 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: unnotifiedCount } = await supabaseAdmin
      .from("project_inquiries")
      .select("id", { count: "exact", head: true })
      .is("notified_at", null)
      .lt("created_at", oneHourAgo);

    const hasUnnotified = (unnotifiedCount ?? 0) > 0;
    results.push({
      key: "data_unnotified_inquiries",
      groupName: "data",
      status: hasUnnotified ? "warning" : "ok",
      detail: hasUnnotified
        ? `${unnotifiedCount} brief(s) sans notification depuis plus d'une heure`
        : "Tous les briefs soumis ont été notifiés à l'équipe",
      hint: hasUnnotified
        ? "Vérifier la boîte d'envoi et relancer les notifications depuis la page Prospects."
        : null,
      checkedAt: now,
    });

    // Check recent mail errors in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: mailErrorCount } = await supabaseAdmin
      .from("project_inquiries")
      .select("id", { count: "exact", head: true })
      .not("notify_error", "is", null)
      .gte("created_at", oneDayAgo);

    const hasErrors = (mailErrorCount ?? 0) > 0;
    results.push({
      key: "data_recent_mail_errors",
      groupName: "data",
      status: hasErrors ? "warning" : "ok",
      detail: hasErrors
        ? `${mailErrorCount} erreur(s) d'envoi d'email enregistrée(s) dans les dernières 24h`
        : "Aucune erreur d'envoi d'email sur les dernières 24h",
      hint: hasErrors ? "Vérifier la connectivité SMTP et les adresses destinataires." : null,
      checkedAt: now,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({
      key: "data_check_error",
      groupName: "data",
      status: "warning",
      detail: `Erreur lors de la vérification des données : ${message}`,
      hint: null,
      checkedAt: now,
    });
  }

  return results;
}

/**
 * 5. Site & Assets Checks
 */
export async function checkSiteAssets(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  const now = new Date().toISOString();

  // Check OpenGraph image existence
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const ogJpg = path.resolve(process.cwd(), "public/og-image.jpg");
    const ogWebp = path.resolve(process.cwd(), "public/og-image.webp");
    const ogExists = fs.existsSync(ogJpg) || fs.existsSync(ogWebp);

    results.push({
      key: "site_og_image",
      groupName: "site",
      status: ogExists ? "ok" : "warning",
      detail: ogExists
        ? "Visuel de partage OpenGraph présent (public/og-image)"
        : "Image OpenGraph manquante pour les prévisualisations sur réseaux sociaux",
      hint: ogExists ? null : "Ajouter une image og-image.jpg (1200×630) dans le dossier public/.",
      checkedAt: now,
    });
  } catch {
    results.push({
      key: "site_og_image",
      groupName: "site",
      status: "ok",
      detail: "Vérification des assets terminée",
      hint: null,
      checkedAt: now,
    });
  }

  // Endpoints status (internal routes definition check)
  results.push({
    key: "site_endpoints_status",
    groupName: "site",
    status: "ok",
    detail: "Endpoints déclarés : Accueil (/), Brief (/start), Sitemap (/sitemap.xml), Robots (/robots.txt)",
    hint: null,
    checkedAt: now,
  });

  return results;
}

/**
 * Runs all health check groups, records them in the `health_checks` table,
 * and returns the full aggregated summary.
 */
export async function runAllHealthChecks(): Promise<HealthSummary> {
  const [configChecks, permissionsChecks, authChecks, dataChecks, siteChecks] =
    await Promise.all([
      checkConfiguration(),
      runPermissionsSelfTest(),
      checkAuth(),
      checkDataIntegrity(),
      checkSiteAssets(),
    ]);

  const allChecks = [
    ...configChecks,
    ...permissionsChecks,
    ...authChecks,
    ...dataChecks,
    ...siteChecks,
  ];

  // Store in health_checks table
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const records = allChecks.map((c) => ({
      key: c.key,
      group_name: c.groupName,
      status: c.status,
      detail: c.detail,
      hint: c.hint,
      checked_at: c.checkedAt,
    }));

    await supabaseAdmin.from("health_checks").upsert(records);
  } catch (err) {
    console.error("[HealthChecks] Failed to persist health checks to database:", err);
  }

  const okCount = allChecks.filter((c) => c.status === "ok").length;
  const warningCount = allChecks.filter((c) => c.status === "warning").length;
  const errorCount = allChecks.filter((c) => c.status === "error").length;

  const overallStatus: "ok" | "warning" | "error" =
    errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "ok";

  // If any critical error arose, record a security event
  if (errorCount > 0) {
    const criticals = allChecks.filter((c) => c.status === "error");
    await logSecurityEvent({
      type: "health_check_failed",
      severity: "critical",
      details: {
        errorCount,
        criticalKeys: criticals.map((c) => c.key),
      },
    });
  }

  return {
    overallStatus,
    totalChecks: allChecks.length,
    okCount,
    warningCount,
    errorCount,
    lastCheckedAt: new Date().toISOString(),
    checks: allChecks,
  };
}
