import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdminAuth, logAdminAction } from "@/integrations/supabase/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  testMetaConnection,
  fetchAccountMedia,
  fetchLiveStories,
} from "./graph.server";
import { processIgEvent } from "./webhook.server";
import { simulateMatch } from "./matcher";
import type {
  IgConnectionPublic,
  IgAutomationWithTargets,
  IgEventRow,
  IgContactRow,
  SimulationResult,
  MetaMediaItem,
} from "./types";

/**
 * 1. Get Instagram Connection Status (Safe for client, never exposes access_token).
 */
export const getIgConnectionStatus = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async (): Promise<IgConnectionPublic | null> => {
    const { data: conn } = await supabaseAdmin
      .from("ig_connection")
      .select("id, ig_user_id, page_id, username, access_token, token_expires_at, scopes, webhook_last_received_at, is_paused, daily_cap")
      .maybeSingle();

    if (!conn) {
      return null;
    }

    const hasToken = Boolean(conn.access_token && conn.access_token.length > 10);
    let isExpired = false;
    let daysUntilExpiry: number | null = null;

    if (conn.token_expires_at) {
      const exp = new Date(conn.token_expires_at).getTime();
      const diffMs = exp - Date.now();
      daysUntilExpiry = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      isExpired = diffMs <= 0;
    }

    return {
      id: conn.id,
      igUserId: conn.ig_user_id,
      pageId: conn.page_id,
      username: conn.username,
      tokenExpiresAt: conn.token_expires_at,
      scopes: conn.scopes || [],
      webhookLastReceivedAt: conn.webhook_last_received_at,
      isPaused: conn.is_paused,
      dailyCap: conn.daily_cap,
      hasToken,
      isExpired,
      daysUntilExpiry,
    };
  });

/**
 * 2. Save Instagram Connection Settings (Owner / Admin).
 */
export const saveIgConnection = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z
      .object({
        igUserId: z.string().optional().nullable(),
        pageId: z.string().optional().nullable(),
        username: z.string().optional().nullable(),
        accessToken: z.string().optional().nullable(),
        tokenExpiresAt: z.string().optional().nullable(),
        dailyCap: z.number().int().min(1).max(5000).default(200),
        isPaused: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data: input, context }) => {
    // Check if an existing row exists
    const { data: existing } = await supabaseAdmin
      .from("ig_connection")
      .select("id, access_token")
      .maybeSingle();

    const updatePayload: Record<string, unknown> = {
      ig_user_id: input.igUserId?.trim() || null,
      page_id: input.pageId?.trim() || null,
      username: input.username?.replace(/^@/, "").trim() || null,
      daily_cap: input.dailyCap,
      is_paused: input.isPaused,
      updated_at: new Date().toISOString(),
    };

    if (input.tokenExpiresAt !== undefined) {
      updatePayload["token_expires_at"] = input.tokenExpiresAt || null;
    }

    // Only update access_token if a new one was provided
    if (input.accessToken && input.accessToken.trim().length > 0) {
      updatePayload["access_token"] = input.accessToken.trim();
    }

    let connectionId = existing?.id;

    if (existing) {
      await supabaseAdmin
        .from("ig_connection")
        .update(updatePayload)
        .eq("id", existing.id);
    } else {
      const { data: inserted } = await supabaseAdmin
        .from("ig_connection")
        .insert({
          ...updatePayload,
          access_token: input.accessToken?.trim() || null,
        })
        .select("id")
        .single();
      connectionId = inserted?.id;
    }

    await logAdminAction({
      actorId: context.userId,
      action: "update_ig_connection",
      entity: "ig_connection",
      entityId: connectionId || "settings",
      diff: {
        username: input.username,
        dailyCap: input.dailyCap,
        isPaused: input.isPaused,
        tokenUpdated: Boolean(input.accessToken),
      },
    });

    return { success: true };
  });

/**
 * 3. Toggle Global Instagram Automation Pause.
 */
export const toggleIgPause = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z.object({ paused: z.boolean() }).parse(data),
  )
  .handler(async ({ data: input, context }) => {
    const { data: conn } = await supabaseAdmin
      .from("ig_connection")
      .select("id")
      .maybeSingle();

    if (conn) {
      await supabaseAdmin
        .from("ig_connection")
        .update({ is_paused: input.paused, updated_at: new Date().toISOString() })
        .eq("id", conn.id);
    }

    await logAdminAction({
      actorId: context.userId,
      action: input.paused ? "pause_ig_automations" : "resume_ig_automations",
      entity: "ig_connection",
      entityId: conn?.id || "global",
    });

    return { success: true, isPaused: input.paused };
  });

/**
 * 4. Test Meta Instagram API Connection Live.
 */
export const testIgConnection = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const { data: conn } = await supabaseAdmin
      .from("ig_connection")
      .select("access_token, ig_user_id, page_id")
      .maybeSingle();

    if (!conn || !conn.access_token) {
      return { ok: false, error: "Aucun jeton d'accès enregistré dans la base de données" };
    }

    return await testMetaConnection({
      accessToken: conn.access_token,
      igUserId: conn.ig_user_id,
      pageId: conn.page_id,
    });
  });

/**
 * 5. List Automations with Targets, Products, and Execution Stats.
 */
export const listIgAutomations = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async (): Promise<IgAutomationWithTargets[]> => {
    const { data: automations, error } = await supabaseAdmin
      .from("ig_automations")
      .select(`
        *,
        targets:ig_automation_targets(*),
        product:digital_products(id, slug, title)
      `)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[listIgAutomations] Error:", error);
      return [];
    }

    // Fetch stats for each automation
    const automationsWithStats = await Promise.all(
      (automations || []).map(async (auto) => {
        const { data: stats } = await supabaseAdmin
          .from("ig_events")
          .select("status")
          .eq("automation_id", auto.id);

        const triggersCount = stats?.length || 0;
        const sentCount = stats?.filter((s) => s.status === "sent").length || 0;
        const skippedCount = stats?.filter((s) => s.status === "skipped").length || 0;
        const failedCount = stats?.filter((s) => s.status === "failed").length || 0;

        return {
          ...auto,
          stats: {
            triggersCount,
            sentCount,
            skippedCount,
            failedCount,
          },
        } as unknown as IgAutomationWithTargets;
      }),
    );

    return automationsWithStats;
  });

/**
 * 6. Save (Create or Update) an Automation Rule.
 */
export const saveIgAutomation = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1, "Le nom est obligatoire"),
        isActive: z.boolean().default(true),
        trigger: z.enum(["comment", "story_reply"]).default("comment"),
        targetMode: z.enum(["any", "selected"]).default("any"),
        matchMode: z.enum(["word", "contains", "exact", "starts_with"]).default("word"),
        keywords: z.array(z.string()).min(1, "Ajoutez au moins un mot-clé"),
        excludeKeywords: z.array(z.string()).default([]),
        dmText: z.string().min(5, "Le message DM est obligatoire"),
        publicReplyVariants: z.array(z.string()).default([]),
        productId: z.string().uuid().optional().nullable(),
        linkSrcTag: z.string().optional().nullable(),
        onePerUser: z.boolean().default(true),
        cooldownHours: z.number().int().min(0).default(0),
        startsAt: z.string().optional().nullable(),
        endsAt: z.string().optional().nullable(),
        targets: z
          .array(
            z.object({
              mediaId: z.string(),
              mediaType: z.enum(["post", "reel", "story"]).default("post"),
              permalink: z.string().optional().nullable(),
              captionExcerpt: z.string().optional().nullable(),
              thumbnailUrl: z.string().optional().nullable(),
            }),
          )
          .default([]),
      })
      .parse(data),
  )
  .handler(async ({ data: input, context }) => {
    const payload = {
      name: input.name.trim(),
      is_active: input.isActive,
      trigger: input.trigger,
      target_mode: input.targetMode,
      match_mode: input.matchMode,
      keywords: input.keywords.map((k) => k.trim()).filter(Boolean),
      exclude_keywords: input.excludeKeywords.map((k) => k.trim()).filter(Boolean),
      dm_text: input.dmText.trim(),
      public_reply_variants: input.publicReplyVariants.map((v) => v.trim()).filter(Boolean),
      product_id: input.productId || null,
      link_src_tag: input.linkSrcTag?.trim() || null,
      one_per_user: input.onePerUser,
      cooldown_hours: input.cooldownHours,
      starts_at: input.startsAt || null,
      ends_at: input.endsAt || null,
      updated_at: new Date().toISOString(),
    };

    let automationId = input.id;

    if (automationId) {
      // Update
      const { error } = await supabaseAdmin
        .from("ig_automations")
        .update(payload)
        .eq("id", automationId);

      if (error) throw new Error(error.message);
    } else {
      // Get max position
      const { data: maxPos } = await supabaseAdmin
        .from("ig_automations")
        .select("position")
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextPos = (maxPos?.position || 0) + 1;

      const { data: inserted, error } = await supabaseAdmin
        .from("ig_automations")
        .insert({
          ...payload,
          position: nextPos,
        })
        .select("id")
        .single();

      if (error || !inserted) throw new Error(error?.message || "Erreur de création");
      automationId = inserted.id;
    }

    // Sync targets if selected mode
    if (automationId) {
      await supabaseAdmin
        .from("ig_automation_targets")
        .delete()
        .eq("automation_id", automationId);

      if (input.targetMode === "selected" && input.targets.length > 0) {
        const targetInserts = input.targets.map((t) => ({
          automation_id: automationId!,
          media_id: t.mediaId,
          media_type: t.mediaType,
          permalink: t.permalink || null,
          caption_excerpt: t.captionExcerpt || null,
          thumbnail_url: t.thumbnailUrl || null,
        }));

        await supabaseAdmin.from("ig_automation_targets").insert(targetInserts);
      }
    }

    await logAdminAction({
      actorId: context.userId,
      action: input.id ? "update_ig_automation" : "create_ig_automation",
      entity: "ig_automations",
      entityId: automationId || "unknown",
      diff: { name: input.name, keywords: input.keywords },
    });

    return { success: true, id: automationId };
  });

/**
 * 7. Delete an Automation Rule.
 */
export const deleteIgAutomation = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data: input, context }) => {
    await supabaseAdmin.from("ig_automations").delete().eq("id", input.id);

    await logAdminAction({
      actorId: context.userId,
      action: "delete_ig_automation",
      entity: "ig_automations",
      entityId: input.id,
    });

    return { success: true };
  });

/**
 * 8. Reorder Automation Rules.
 */
export const reorderIgAutomations = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z
      .object({
        items: z.array(z.object({ id: z.string().uuid(), position: z.number().int() })),
      })
      .parse(data),
  )
  .handler(async ({ data: input, context }) => {
    for (const item of input.items) {
      await supabaseAdmin
        .from("ig_automations")
        .update({ position: item.position })
        .eq("id", item.id);
    }

    await logAdminAction({
      actorId: context.userId,
      action: "reorder_ig_automations",
      entity: "ig_automations",
      diff: { count: input.items.length },
    });

    return { success: true };
  });

/**
 * 9. List Events Log (Paginated & Filterable).
 */
export const listIgEvents = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z
      .object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
        status: z.enum(["all", "received", "matched", "sent", "skipped", "failed"]).default("all"),
        automationId: z.string().uuid().optional(),
        search: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data: input }): Promise<{ items: IgEventRow[]; total: number }> => {
    let query = supabaseAdmin
      .from("ig_events")
      .select("*", { count: "exact" })
      .order("received_at", { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.status !== "all") {
      query = query.eq("status", input.status);
    }

    if (input.automationId) {
      query = query.eq("automation_id", input.automationId);
    }

    if (input.search && input.search.trim().length > 0) {
      const term = `%${input.search.trim()}%`;
      query = query.or(`username.ilike.${term},text.ilike.${term}`);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error("[listIgEvents] Error:", error);
      return { items: [], total: 0 };
    }

    return {
      items: (data || []) as IgEventRow[],
      total: count || 0,
    };
  });

/**
 * 10. Retry a Failed Event.
 */
export const retryIgEvent = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data: input, context }) => {
    await processIgEvent(input.id);

    await logAdminAction({
      actorId: context.userId,
      action: "retry_ig_event",
      entity: "ig_events",
      entityId: input.id,
    });

    return { success: true };
  });

/**
 * 11. List Instagram Contacts (Followers / Interactors).
 */
export const listIgContacts = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z
      .object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
        blockedOnly: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data: input }): Promise<{ items: IgContactRow[]; total: number }> => {
    let query = supabaseAdmin
      .from("ig_contacts")
      .select("*", { count: "exact" })
      .order("last_event_at", { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.blockedOnly) {
      query = query.eq("blocked", true);
    }

    const { data, count } = await query;
    return {
      items: (data || []) as IgContactRow[],
      total: count || 0,
    };
  });

/**
 * 12. Toggle Contact Block Status (STOP / Unblock).
 */
export const toggleIgContactBlock = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z
      .object({
        igUserId: z.string(),
        blocked: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data: input, context }) => {
    await supabaseAdmin
      .from("ig_contacts")
      .update({ blocked: input.blocked })
      .eq("ig_user_id", input.igUserId);

    await logAdminAction({
      actorId: context.userId,
      action: input.blocked ? "block_ig_contact" : "unblock_ig_contact",
      entity: "ig_contacts",
      entityId: input.igUserId,
    });

    return { success: true };
  });

/**
 * 13. Simulate Comment Matching (Zero API Calls to Meta).
 */
export const simulateIgComment = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z
      .object({
        commentText: z.string(),
        mediaId: z.string().optional().nullable(),
        username: z.string().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data: input }): Promise<SimulationResult> => {
    const { data: automations } = await supabaseAdmin
      .from("ig_automations")
      .select(`
        *,
        targets:ig_automation_targets(*),
        product:digital_products(id, slug, title)
      `)
      .eq("is_active", true)
      .order("position", { ascending: true });

    const activeRules = (automations || []) as unknown as IgAutomationWithTargets[];
    const siteUrl = process.env["SITE_URL"] || "https://volkastudio.com";

    return simulateMatch(activeRules, {
      commentText: input.commentText,
      mediaId: input.mediaId,
      username: input.username,
      siteUrl,
    });
  });

/**
 * 14. Fetch Live Media / Stories from Meta for the Target Picker.
 */
export const fetchIgMediaForPicker = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .validator((data: unknown) =>
    z.object({ type: z.enum(["posts", "stories"]).default("posts") }).parse(data),
  )
  .handler(async ({ data: input }): Promise<{ items: MetaMediaItem[]; error?: string }> => {
    const { data: conn } = await supabaseAdmin
      .from("ig_connection")
      .select("access_token, ig_user_id")
      .maybeSingle();

    if (!conn || !conn.access_token || !conn.ig_user_id) {
      return {
        items: [],
        error: "Compte Instagram non configuré ou identifiant manquant",
      };
    }

    if (input.type === "stories") {
      const { stories, error } = await fetchLiveStories({
        igUserId: conn.ig_user_id,
        accessToken: conn.access_token,
      });
      return { items: stories, error };
    }

    const { media, error } = await fetchAccountMedia({
      igUserId: conn.ig_user_id,
      accessToken: conn.access_token,
      limit: 30,
    });

    return { items: media, error };
  });

/**
 * 15. Export Events to CSV.
 */
export const exportIgEventsCsv = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async (): Promise<{ csv: string; filename: string }> => {
    const { data: events } = await supabaseAdmin
      .from("ig_events")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(500);

    const headers = [
      "Date",
      "Type",
      "Utilisateur",
      "Statut",
      "Motif ou Erreur",
      "Publication / Média",
      "Texte reçu",
    ];

    const rows = (events || []).map((e) => [
      `"${new Date(e.received_at).toLocaleString("fr-FR")}"`,
      `"${e.kind}"`,
      `"${e.username || e.ig_user_id || ""}"`,
      `"${e.status}"`,
      `"${e.skip_reason || e.error || ""}"`,
      `"${e.media_id || ""}"`,
      `"${(e.text || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const filename = `volka-instagram-events-${new Date().toISOString().slice(0, 10)}.csv`;

    return { csv: csvContent, filename };
  });

