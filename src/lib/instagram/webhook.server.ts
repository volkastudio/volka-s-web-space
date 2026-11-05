// Server-only Instagram Webhook handler and event processor (Phase IG-1/IG-2).
// Never import this file in client-side bundles.

import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { evaluateRules } from "./matcher";
import {
  sendPrivateReply,
  sendDirectMessage,
  postPublicCommentReply,
} from "./graph.server";
import type {
  IgAutomationWithTargets,
  MetaWebhookPayload,
  SkipReason,
} from "./types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Validates the X-Hub-Signature-256 header using constant-time comparison.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret?: string,
): boolean {
  const secret = appSecret || process.env["IG_APP_SECRET"];
  if (!secret || !signatureHeader) {
    return false;
  }

  const cleanSignature = signatureHeader.replace(/^sha256=/i, "").trim();
  if (!cleanSignature) {
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody, "utf8");
    const expectedSignature = hmac.digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(cleanSignature, "hex");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/**
 * Handles Meta Webhook verification handshake (GET /api/ig/webhook).
 */
export function handleWebhookChallenge(url: URL): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expectedToken = process.env["IG_WEBHOOK_VERIFY_TOKEN"];

  if (mode === "subscribe" && token && expectedToken && token === expectedToken) {
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden: Invalid verification token", { status: 403 });
}

/**
 * Main Webhook POST handler:
 * 1. Checks X-Hub-Signature-256.
 * 2. Parses and extracts events (comments, messages).
 * 3. Saves them to `ig_events` (deduplication on external_id).
 * 4. Responds 200 OK immediately.
 * 5. Processes each event asynchronously.
 */
export async function handleWebhookPost(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  // In production, signature verification is mandatory.
  // In development, if IG_APP_SECRET is not configured yet, log a warning but proceed.
  const appSecret = process.env["IG_APP_SECRET"];
  if (appSecret) {
    const isValid = verifyWebhookSignature(rawBody, signature, appSecret);
    if (!isValid) {
      console.warn("[IG Webhook] Invalid signature rejected");
      return new Response("Invalid signature", { status: 401 });
    }
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch (err) {
    console.error("[IG Webhook] Failed to parse JSON body:", err);
    return new Response("Bad Request: Invalid JSON", { status: 400 });
  }

  // Update webhook last received timestamp in connection table
  await supabaseAdmin
    .from("ig_connection")
    .update({ webhook_last_received_at: new Date().toISOString() })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const eventIdsToProcess: string[] = [];

  for (const entry of payload.entry || []) {
    // 1. Process Instagram Comments
    for (const change of entry.changes || []) {
      if (change.field === "comments" && change.value) {
        const val = change.value;
        const commentId = val.id;
        const text = val.text || "";
        const igUserId = val.from?.id;
        const username = val.from?.username;
        const mediaId = val.media?.id;
        const parentId = val.parent_id;

        // Upsert into ig_events
        const { data: inserted } = await supabaseAdmin
          .from("ig_events")
          .insert({
            kind: "comment",
            external_id: commentId,
            ig_user_id: igUserId || null,
            username: username || null,
            text,
            media_id: mediaId || null,
            parent_comment_id: parentId || null,
            payload: val as unknown as Record<string, unknown>,
            status: "received",
            attempts: 0,
          })
          .select("id")
          .maybeSingle();

        if (inserted) {
          eventIdsToProcess.push(inserted.id);
        }
      }
    }

    // 2. Process Instagram Direct Messages / Story Replies
    for (const messaging of entry.messaging || []) {
      const message = messaging.message;
      if (!message || !message.mid) continue;

      const mid = message.mid;
      const text = message.text || "";
      const senderId = messaging.sender?.id;
      const storyId = message.reply_to?.story?.id;

      const kind = storyId ? "story_reply" : "comment";

      const { data: inserted } = await supabaseAdmin
        .from("ig_events")
        .insert({
          kind,
          external_id: mid,
          ig_user_id: senderId || null,
          text,
          media_id: storyId || null,
          payload: messaging as unknown as Record<string, unknown>,
          status: "received",
          attempts: 0,
        })
        .select("id")
        .maybeSingle();

      if (inserted) {
        eventIdsToProcess.push(inserted.id);
      }
    }
  }

  // Process queued events asynchronously in background
  if (eventIdsToProcess.length > 0) {
    // Launch non-blocking processing
    Promise.allSettled(eventIdsToProcess.map((id) => processIgEvent(id))).catch((err) => {
      console.error("[IG Webhook] Background event processing error:", err);
    });
  }

  // Immediate 200 response to Meta
  return new Response(JSON.stringify({ status: "ok", received: eventIdsToProcess.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Core event processing pipeline:
 * Matches event against rules and sends private reply via Meta Graph API.
 */
export async function processIgEvent(eventId: string): Promise<void> {
  // 1. Load the event
  const { data: event, error: eventErr } = await supabaseAdmin
    .from("ig_events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventErr || !event) {
    console.error(`[IG Process] Event ${eventId} not found`);
    return;
  }

  // Already processed or terminal state
  if (event.status === "sent" || event.status === "skipped") {
    return;
  }

  // 2. Load Instagram Connection
  const { data: connection } = await supabaseAdmin
    .from("ig_connection")
    .select("*")
    .maybeSingle();

  if (!connection || !connection.access_token) {
    await markEventStatus(eventId, "failed", {
      error: "Compte Instagram non connecté ou jeton manquant",
    });
    return;
  }

  // Check Master Pause Switch
  if (connection.is_paused) {
    await markEventStatus(eventId, "skipped", { skipReason: "paused" });
    return;
  }

  // 3. Check Daily Cap (default 200)
  const sinceYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: sentTodayCount } = await supabaseAdmin
    .from("ig_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", sinceYesterday);

  if ((sentTodayCount || 0) >= connection.daily_cap) {
    await markEventStatus(eventId, "skipped", { skipReason: "daily_cap" });
    return;
  }

  // 4. STOP / Opt-Out Handling
  const normalizedComment = (event.text || "").trim().toLowerCase();
  if (normalizedComment === "stop") {
    if (event.ig_user_id) {
      await supabaseAdmin.from("ig_contacts").upsert(
        {
          ig_user_id: event.ig_user_id,
          username: event.username,
          blocked: true,
          last_event_at: new Date().toISOString(),
        },
        { onConflict: "ig_user_id" },
      );
    }
    await markEventStatus(eventId, "skipped", { skipReason: "blocked" });
    return;
  }

  // 5. Check if contact is blocked
  if (event.ig_user_id) {
    const { data: contact } = await supabaseAdmin
      .from("ig_contacts")
      .select("blocked")
      .eq("ig_user_id", event.ig_user_id)
      .maybeSingle();

    if (contact?.blocked) {
      await markEventStatus(eventId, "skipped", { skipReason: "blocked" });
      return;
    }
  }

  // 6. Check 7-day expiration window for comments
  const eventAge = Date.now() - new Date(event.received_at).getTime();
  if (eventAge > SEVEN_DAYS_MS) {
    await markEventStatus(eventId, "skipped", { skipReason: "window_expired" });
    return;
  }

  // 7. Load active automations with targets and products
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
  if (activeRules.length === 0) {
    await markEventStatus(eventId, "skipped", { skipReason: "rule_inactive" });
    return;
  }

  // 8. Match against rules
  const siteUrl = process.env["SITE_URL"] || "https://volkastudio.com";
  const matchResult = evaluateRules(activeRules, {
    commentText: event.text || "",
    mediaId: event.media_id,
    username: event.username,
    ownUsername: connection.username,
    siteUrl,
  });

  if (!matchResult.matched || !matchResult.automation) {
    await markEventStatus(eventId, "skipped", {
      skipReason: matchResult.skipReason || "no_keyword",
    });
    return;
  }

  const rule = matchResult.automation;

  // 9. Deduplication checks
  if (event.ig_user_id) {
    // One per user rule
    if (rule.one_per_user) {
      const { data: previousSend } = await supabaseAdmin
        .from("ig_events")
        .select("id")
        .eq("ig_user_id", event.ig_user_id)
        .eq("automation_id", rule.id)
        .eq("status", "sent")
        .maybeSingle();

      if (previousSend) {
        await markEventStatus(eventId, "skipped", {
          automationId: rule.id,
          skipReason: "already_sent",
        });
        return;
      }
    }

    // Cooldown window rule
    if (rule.cooldown_hours > 0) {
      const cooldownThreshold = new Date(
        Date.now() - rule.cooldown_hours * 60 * 60 * 1000,
      ).toISOString();

      const { data: recentSend } = await supabaseAdmin
        .from("ig_events")
        .select("id")
        .eq("ig_user_id", event.ig_user_id)
        .eq("automation_id", rule.id)
        .eq("status", "sent")
        .gte("sent_at", cooldownThreshold)
        .maybeSingle();

      if (recentSend) {
        await markEventStatus(eventId, "skipped", {
          automationId: rule.id,
          skipReason: "cooldown",
        });
        return;
      }
    }
  }

  // 10. Send reply via Meta Graph API
  const dmText = matchResult.interpolatedDm || rule.dm_text;
  const targetId = connection.page_id || connection.ig_user_id;

  if (!targetId) {
    await markEventStatus(eventId, "failed", {
      automationId: rule.id,
      error: "Identifiant de compte Page / Instagram manquant",
    });
    return;
  }

  let sendResult: { success: boolean; alreadyReplied?: boolean; error?: string };

  if (event.kind === "story_reply" && event.ig_user_id) {
    // Send as direct message reply
    sendResult = await sendDirectMessage({
      igUserId: connection.ig_user_id || targetId,
      recipientId: event.ig_user_id,
      text: dmText,
      accessToken: connection.access_token,
    });
  } else {
    // Send private reply to comment
    sendResult = await sendPrivateReply({
      pageIdOrIgUserId: targetId,
      commentId: event.external_id,
      text: dmText,
      accessToken: connection.access_token,
    });
  }

  if (sendResult.alreadyReplied) {
    await markEventStatus(eventId, "skipped", {
      automationId: rule.id,
      skipReason: "already_replied",
    });
    return;
  }

  if (sendResult.success) {
    // Mark as sent
    await markEventStatus(eventId, "sent", {
      automationId: rule.id,
      sentAt: new Date().toISOString(),
    });

    // Upsert contact
    if (event.ig_user_id) {
      await supabaseAdmin.from("ig_contacts").upsert(
        {
          ig_user_id: event.ig_user_id,
          username: event.username,
          last_event_at: new Date().toISOString(),
        },
        { onConflict: "ig_user_id" },
      );
    }

    // Optional public reply
    if (matchResult.publicReply && event.kind === "comment") {
      try {
        await postPublicCommentReply({
          commentId: event.external_id,
          message: matchResult.publicReply,
          accessToken: connection.access_token,
        });
      } catch (pubErr) {
        // Public reply failures never mark the DM as failed
        console.warn("[IG Process] Public reply failed non-fatally:", pubErr);
      }
    }
  } else {
    // Failed
    await markEventStatus(eventId, "failed", {
      automationId: rule.id,
      error: sendResult.error,
      incrementAttempts: true,
    });
  }
}

/**
 * Helper to update event status and metadata in Supabase.
 */
async function markEventStatus(
  eventId: string,
  status: "matched" | "sent" | "skipped" | "failed",
  options: {
    automationId?: string;
    skipReason?: SkipReason;
    error?: string;
    sentAt?: string;
    incrementAttempts?: boolean;
  } = {},
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    ...(options.automationId && { automation_id: options.automationId }),
    ...(options.skipReason && { skip_reason: options.skipReason }),
    ...(options.error !== undefined && { error: options.error }),
    ...(options.sentAt && { sent_at: options.sentAt }),
  };

  if (options.incrementAttempts) {
    // Fetch current attempts to increment
    const { data } = await supabaseAdmin
      .from("ig_events")
      .select("attempts")
      .eq("id", eventId)
      .single();

    updateData["attempts"] = (data?.attempts || 0) + 1;
  }

  await supabaseAdmin.from("ig_events").update(updateData).eq("id", eventId);
}

