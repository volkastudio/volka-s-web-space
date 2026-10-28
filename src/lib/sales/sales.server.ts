// Server-side logic for Phase 14: Digital Sales Pages, Regions & Buyers
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export interface DigitalProductWithRegions {
  id: string;
  slug: string;
  title: string;
  headline: string;
  cover_image: string | null;
  description: string;
  features: string[];
  faq: { q: string; a: string }[];
  status: "draft" | "published" | "archived";
  trigger_keyword: string | null;
  views_count: number;
  cta_clicks_count: number;
  outbound_clicks_count: number;
  regions: {
    id: string;
    region_key: string;
    label_fr: string;
    label_en: string;
    checkout_url: string;
    platform_name: string;
    sort_order: number;
  }[];
}

/**
 * Public: fetches published product and its active regions by slug.
 */
export async function getProductBySlug(slug: string): Promise<DigitalProductWithRegions | null> {
  const { data: product, error } = await supabaseAdmin
    .from("digital_products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !product) {
    return null;
  }

  // Fetch active regions
  const { data: regions } = await supabaseAdmin
    .from("product_regions")
    .select("id, region_key, label_fr, label_en, checkout_url, platform_name, sort_order")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Increment views_count asynchronously (fire & forget)
  void (async () => {
    try {
      await supabaseAdmin
        .from("digital_products")
        .update({ views_count: (product.views_count || 0) + 1 })
        .eq("id", product.id);
    } catch (err) {
      console.warn("Failed to increment views_count:", err);
    }
  })();

  return {
    ...product,
    features: (product.features as unknown as string[]) || [],
    faq: (product.faq as unknown as { q: string; a: string }[]) || [],
    regions: regions || [],
  };
}

/**
 * Increments CTA click count for a product page.
 */
export async function recordCtaClick(slug: string): Promise<void> {
  const { data: product } = await supabaseAdmin
    .from("digital_products")
    .select("id, cta_clicks_count")
    .eq("slug", slug)
    .maybeSingle();

  if (product) {
    await supabaseAdmin
      .from("digital_products")
      .update({ cta_clicks_count: (product.cta_clicks_count || 0) + 1 })
      .eq("id", product.id);
  }
}

/**
 * Resolves destination checkout URL for a chosen region and increments outbound clicks.
 */
export async function resolveRegionRedirect(
  slug: string,
  regionKey: string,
  sourceTag?: string
): Promise<string | null> {
  const { data: product } = await supabaseAdmin
    .from("digital_products")
    .select("id, outbound_clicks_count")
    .eq("slug", slug)
    .maybeSingle();

  if (!product) return null;

  const { data: region } = await supabaseAdmin
    .from("product_regions")
    .select("checkout_url")
    .eq("product_id", product.id)
    .eq("region_key", regionKey)
    .maybeSingle();

  if (!region) return null;

  // Increment outbound click
  await supabaseAdmin
    .from("digital_products")
    .update({ outbound_clicks_count: (product.outbound_clicks_count || 0) + 1 })
    .eq("id", product.id);

  // Append UTM tracking
  try {
    const url = new URL(region.checkout_url);
    url.searchParams.set("utm_source", "volka");
    url.searchParams.set("utm_campaign", slug);
    if (sourceTag) {
      url.searchParams.set("utm_content", sourceTag);
    }
    return url.toString();
  } catch {
    const separator = region.checkout_url.includes("?") ? "&" : "?";
    return `${region.checkout_url}${separator}utm_source=volka&utm_campaign=${slug}`;
  }
}

/**
 * Admin: List all digital products.
 */
export async function listAdminProducts() {
  const { data, error } = await supabaseAdmin
    .from("digital_products")
    .select("*, product_regions(id, region_key, label_fr, is_active)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Admin: Upsert product and its regions.
 */
export async function saveAdminProduct(params: {
  id?: string;
  slug: string;
  title: string;
  headline: string;
  cover_image?: string;
  description: string;
  features: string[];
  faq: { q: string; a: string }[];
  status: "draft" | "published" | "archived";
  trigger_keyword?: string;
  regions: {
    region_key: string;
    label_fr: string;
    label_en: string;
    checkout_url: string;
    platform_name: string;
    sort_order: number;
    is_active: boolean;
  }[];
}) {
  const now = new Date().toISOString();

  // 1. Upsert product
  const productPayload = {
    slug: params.slug.toLowerCase().trim(),
    title: params.title.trim(),
    headline: params.headline.trim(),
    cover_image: params.cover_image || null,
    description: params.description.trim(),
    features: params.features,
    faq: params.faq,
    status: params.status,
    trigger_keyword: params.trigger_keyword?.trim() || null,
    updated_at: now,
  };

  let productId = params.id;

  if (productId) {
    const { error } = await supabaseAdmin
      .from("digital_products")
      .update(productPayload)
      .eq("id", productId);
    if (error) throw new Error(error.message);
  } else {
    const { data: newProd, error } = await supabaseAdmin
      .from("digital_products")
      .insert(productPayload)
      .select("id")
      .single();
    if (error || !newProd) throw new Error(error?.message || "Erreur création produit");
    productId = newProd.id;
  }

  // 2. Replace regions
  if (productId && params.regions) {
    await supabaseAdmin.from("product_regions").delete().eq("product_id", productId);

    if (params.regions.length > 0) {
      const regionsToInsert = params.regions.map((r, i) => ({
        product_id: productId,
        region_key: r.region_key,
        label_fr: r.label_fr,
        label_en: r.label_en,
        checkout_url: r.checkout_url,
        platform_name: r.platform_name || "whop",
        sort_order: r.sort_order ?? i,
        is_active: r.is_active ?? true,
      }));

      await supabaseAdmin.from("product_regions").insert(regionsToInsert);
    }
  }

  return { success: true, productId };
}

/**
 * Admin: Clone product to quickly create next offer.
 */
export async function duplicateAdminProduct(id: string) {
  const { data: original, error } = await supabaseAdmin
    .from("digital_products")
    .select("*, product_regions(*)")
    .eq("id", id)
    .single();

  if (error || !original) throw new Error("Produit introuvable");

  const newSlug = `${original.slug}-copie-${Date.now().toString().slice(-4)}`;
  const { data: cloned, error: cloneErr } = await supabaseAdmin
    .from("digital_products")
    .insert({
      slug: newSlug,
      title: `${original.title} (Copie)`,
      headline: original.headline,
      cover_image: original.cover_image,
      description: original.description,
      features: original.features,
      faq: original.faq,
      status: "draft",
      trigger_keyword: original.trigger_keyword,
    })
    .select("id")
    .single();

  if (cloneErr || !cloned) throw new Error(cloneErr?.message || "Erreur duplication");

  // Clone regions
  const regions = (original as unknown as { product_regions: Record<string, unknown>[] }).product_regions || [];
  if (regions.length > 0) {
    const clonedRegions = regions.map((r) => ({
      product_id: cloned.id,
      region_key: r["region_key"] as string,
      label_fr: r["label_fr"] as string,
      label_en: r["label_en"] as string,
      checkout_url: r["checkout_url"] as string,
      platform_name: r["platform_name"] as string,
      sort_order: (r["sort_order"] as number) || 0,
      is_active: r["is_active"] !== false,
    }));
    await supabaseAdmin.from("product_regions").insert(clonedRegions);
  }

  return cloned;
}

/**
 * Admin: List buyers with pagination, search, and consent filters.
 */
export async function listAdminBuyers(params: {
  search?: string;
  consent?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabaseAdmin
    .from("buyers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.consent && params.consent !== "all") {
    query = query.eq("marketing_consent", params.consent as "yes" | "no" | "unknown");
  }

  if (params.platform && params.platform !== "all") {
    query = query.eq("platform", params.platform);
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%,product_title.ilike.%${q}%`);
  }

  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { buyers: data || [], totalCount: count || 0 };
}

/**
 * Admin: Add buyer manually.
 */
export async function createAdminBuyer(params: {
  email: string;
  name?: string;
  country?: string;
  product_id?: string;
  product_title: string;
  platform: string;
  platform_order_ref?: string;
  amount_cents?: number;
  currency?: string;
  marketing_consent: "yes" | "no" | "unknown";
  consent_note?: string;
  source_tag?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("buyers")
    .insert({
      email: params.email.toLowerCase().trim(),
      name: params.name?.trim() || null,
      country: params.country?.trim() || null,
      product_id: params.product_id || null,
      product_title: params.product_title.trim(),
      platform: params.platform,
      platform_order_ref: params.platform_order_ref?.trim() || null,
      amount_cents: params.amount_cents ?? null,
      currency: params.currency || "EUR",
      marketing_consent: params.marketing_consent,
      consent_note: params.consent_note?.trim() || null,
      source_tag: params.source_tag?.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Admin: Bulk import buyers from CSV.
 * Avoids duplicates based on platform_order_ref or email+product_title.
 */
export async function importAdminBuyersBatch(
  rows: {
    email: string;
    name?: string;
    country?: string;
    product_title: string;
    platform: string;
    platform_order_ref?: string;
    amount_cents?: number;
    currency?: string;
    marketing_consent?: "yes" | "no" | "unknown";
    consent_note?: string;
    source_tag?: string;
  }[]
): Promise<{ importedCount: number; skippedCount: number; errors: string[] }> {
  let importedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.email || !row.product_title) {
      skippedCount++;
      continue;
    }

    const email = row.email.toLowerCase().trim();

    // Check duplicate
    let isDuplicate = false;
    if (row.platform_order_ref) {
      const { count } = await supabaseAdmin
        .from("buyers")
        .select("id", { count: "exact", head: true })
        .eq("platform_order_ref", row.platform_order_ref.trim());
      if ((count ?? 0) > 0) isDuplicate = true;
    } else {
      const { count } = await supabaseAdmin
        .from("buyers")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .eq("product_title", row.product_title.trim());
      if ((count ?? 0) > 0) isDuplicate = true;
    }

    if (isDuplicate) {
      skippedCount++;
      continue;
    }

    const { error } = await supabaseAdmin.from("buyers").insert({
      email,
      name: row.name?.trim() || null,
      country: row.country?.trim() || null,
      product_title: row.product_title.trim(),
      platform: row.platform || "manual",
      platform_order_ref: row.platform_order_ref?.trim() || null,
      amount_cents: row.amount_cents ?? null,
      currency: row.currency || "EUR",
      marketing_consent: row.marketing_consent || "unknown",
      consent_note: row.consent_note?.trim() || "Import CSV",
      source_tag: row.source_tag?.trim() || null,
    });

    if (error) {
      errors.push(`Erreur pour ${email}: ${error.message}`);
    } else {
      importedCount++;
    }
  }

  return { importedCount, skippedCount, errors };
}

/**
 * Admin: fetches email sequences with their steps and send counts.
 * Phase 14.2
 */
export async function getAdminEmailSequences() {
  const { data: sequences, error } = await supabaseAdmin
    .from("email_sequences")
    .select("*, email_sequence_steps(*)")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const { count: scheduledCount } = await supabaseAdmin
    .from("email_sends")
    .select("id", { count: "exact", head: true })
    .eq("status", "scheduled");

  const { count: sentCount } = await supabaseAdmin
    .from("email_sends")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent");

  const { count: suppressionsCount } = await supabaseAdmin
    .from("email_suppressions")
    .select("id", { count: "exact", head: true });

  return {
    sequences: sequences || [],
    stats: {
      scheduled: scheduledCount ?? 0,
      sent: sentCount ?? 0,
      suppressed: suppressionsCount ?? 0,
    },
  };
}

/**
 * Admin: toggle sequence active/inactive status.
 */
export async function toggleSequenceActive(sequenceId: string, active: boolean) {
  const { error } = await supabaseAdmin
    .from("email_sequences")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", sequenceId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Admin: update a sequence step (delay_days, subject_fr, body_fr).
 */
export async function updateSequenceStep(
  stepId: string,
  patch: { delay_days?: number; subject_fr?: string; body_fr?: string }
) {
  const { error } = await supabaseAdmin
    .from("email_sequence_steps")
    .update(patch)
    .eq("id", stepId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Admin: send a test email for a sequence step.
 */
export async function sendTestSequenceEmail(stepId: string, recipientEmail: string) {
  const { data: step, error } = await supabaseAdmin
    .from("email_sequence_steps")
    .select("*, email_sequences(name)")
    .eq("id", stepId)
    .maybeSingle();

  if (error || !step) throw new Error("Étape de séquence introuvable.");

  const { isMailConfigured } = await import("@/lib/mailer.server");
  if (!isMailConfigured()) {
    throw new Error("SMTP non configuré dans l'environnement.");
  }

  const { createTransport } = await import("nodemailer");
  const transporter = createTransport({
    host: process.env["SMTP_HOST"],
    port: Number(process.env["SMTP_PORT"] || 587),
    secure: process.env["SMTP_SECURE"] === "true",
    ...(process.env["SMTP_USER"]
      ? { auth: { user: process.env["SMTP_USER"], pass: process.env["SMTP_PASS"] ?? "" } }
      : {}),
  });

  const from = process.env["MAIL_FROM"] ?? "";
  const siteUrl = (process.env["SITE_URL"] || "https://volkastudio.com").replace(/\/$/, "");

  const stepItem = step as unknown as { subject_fr: string; body_fr: string };
  const subject = `[TEST VOLKA] ${(stepItem.subject_fr || "").replace(/\{\{prénom\}\}/g, "Durock").replace(/\{\{produit\}\}/g, "Guide des Systèmes")}`;
  const bodyText = `${(stepItem.body_fr || "")
    .replace(/\{\{prénom\}\}/g, "Durock")
    .replace(/\{\{produit\}\}/g, "Guide des Systèmes")}

---
Ceci est un test de validation de modèle.
Se désabonner : ${siteUrl}/sales/unsubscribe?test=true
`;

  await transporter.sendMail({
    from,
    to: recipientEmail,
    subject,
    text: bodyText,
  });

  return { success: true };
}

/**
 * Public: suppress an email address (one-click unsubscribe per D24).
 */
export async function suppressEmail(email: string, reason = "unsubscribe") {
  const normalized = email.toLowerCase().trim();
  const validReason = (["unsubscribe", "bounce", "complaint", "manual"].includes(reason)
    ? reason
    : "unsubscribe") as "unsubscribe" | "bounce" | "complaint" | "manual";

  const { error } = await supabaseAdmin
    .from("email_suppressions")
    .upsert(
      {
        email: normalized,
        reason: validReason,
        suppressed_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (error) throw new Error(error.message);

  // Cancel any scheduled sends for this email's buyer records
  const { data: buyers } = await supabaseAdmin
    .from("buyers")
    .select("id")
    .eq("email", normalized);

  if (buyers && buyers.length > 0) {
    const buyerIds = buyers.map((b) => b.id);
    await supabaseAdmin
      .from("email_sends")
      .update({ status: "cancelled" })
      .in("buyer_id", buyerIds)
      .eq("status", "scheduled");
  }

  return { success: true };
}

/**
 * Admin: delete product and associated regions.
 */
export async function deleteAdminProduct(id: string) {
  await supabaseAdmin.from("product_regions").delete().eq("product_id", id);
  const { error } = await supabaseAdmin.from("digital_products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

