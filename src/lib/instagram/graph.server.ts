// Server-only Meta Graph API client for Instagram & Facebook Page (Phase IG-1/IG-2).
// Never import this file into browser/client code.

import type { MetaMediaItem } from "./types";

const GRAPH_BASE_URL = "https://graph.facebook.com";
const DEFAULT_GRAPH_VERSION = "v22.0";
const REQUEST_TIMEOUT_MS = 10_000;

function getGraphVersion(): string {
  return process.env["IG_GRAPH_VERSION"]?.trim() || DEFAULT_GRAPH_VERSION;
}

export interface GraphApiErrorResponse {
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface SendPrivateReplyResult {
  success: boolean;
  messageId?: string;
  alreadyReplied?: boolean;
  error?: string;
  statusCode?: number;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

export interface PublicReplyResult {
  success: boolean;
  replyId?: string;
  error?: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  igUserId?: string;
  username?: string;
  pageId?: string;
  error?: string;
}

export interface TokenDebugInfo {
  isValid: boolean;
  expiresAt: string | null;
  scopes: string[];
  userId?: string;
  appId?: string;
}

/**
 * Executes a fetch request against Meta Graph API with timeout and JSON parsing.
 */
async function graphFetch<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string;
  } = {},
): Promise<{ ok: boolean; status: number; data?: T; error?: GraphApiErrorResponse["error"] }> {
  const version = getGraphVersion();
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `${GRAPH_BASE_URL}/${version}/${endpoint.replace(/^\/+/, "")}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`;
  }

  let bodyStr: string | undefined = undefined;
  if (options.body) {
    headers["Content-Type"] = "application/json";
    bodyStr = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: options.method || (options.body ? "POST" : "GET"),
      headers,
      body: bodyStr,
      signal: controller.signal,
    });

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      const err = (json as GraphApiErrorResponse).error || {
        message: `Graph API returned status ${res.status}`,
        type: "GraphApiException",
        code: res.status,
      };
      return { ok: false, status: res.status, error: err };
    }

    return { ok: true, status: res.status, data: json as T };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const msg = isAbort
      ? `Graph API request timed out after ${REQUEST_TIMEOUT_MS}ms`
      : err instanceof Error
        ? err.message
        : String(err);

    return {
      ok: false,
      status: 0,
      error: {
        message: msg,
        type: isAbort ? "TimeoutError" : "NetworkError",
        code: 0,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends an automated private reply to a specific Instagram comment.
 * Per Meta rules:
 * - 1 private reply per comment.
 * - 7-day window.
 * - If already replied, Meta returns 409 or error code 10900 / 100 with subcode.
 */
export async function sendPrivateReply(params: {
  pageIdOrIgUserId: string;
  commentId: string;
  text: string;
  accessToken: string;
}): Promise<SendPrivateReplyResult> {
  const endpoint = `${params.pageIdOrIgUserId}/messages`;
  const body = {
    recipient: {
      comment_id: params.commentId,
    },
    message: {
      text: params.text,
    },
  };

  const res = await graphFetch<{ message_id?: string; recipient_id?: string }>(
    endpoint,
    {
      method: "POST",
      body,
      accessToken: params.accessToken,
    },
  );

  if (res.ok && res.data) {
    return {
      success: true,
      messageId: res.data.message_id,
      statusCode: res.status,
    };
  }

  // Detect 409 or "already replied" error signatures from Meta
  const errCode = res.error?.code;
  const errMsg = res.error?.message?.toLowerCase() || "";
  const isAlreadyReplied =
    res.status === 409 ||
    errCode === 10900 ||
    errMsg.includes("already replied") ||
    errMsg.includes("has already been replied");

  return {
    success: false,
    alreadyReplied: isAlreadyReplied,
    error: res.error?.message || "Erreur inconnue lors de l'envoi du message privé",
    statusCode: res.status,
  };
}

/**
 * Sends a message in an existing Instagram thread (e.g. story reply or follow-up).
 */
export async function sendDirectMessage(params: {
  igUserId: string;
  recipientId: string; // IGSID
  text: string;
  accessToken: string;
}): Promise<SendMessageResult> {
  const endpoint = `${params.igUserId}/messages`;
  const body = {
    recipient: {
      id: params.recipientId,
    },
    message: {
      text: params.text,
    },
  };

  const res = await graphFetch<{ message_id?: string }>(endpoint, {
    method: "POST",
    body,
    accessToken: params.accessToken,
  });

  if (res.ok && res.data) {
    return {
      success: true,
      messageId: res.data.message_id,
      statusCode: res.status,
    };
  }

  return {
    success: false,
    error: res.error?.message || "Erreur lors de l'envoi du message direct",
    statusCode: res.status,
  };
}

/**
 * Posts an optional public reply to an Instagram comment (e.g. "Regarde tes DMs 📩").
 */
export async function postPublicCommentReply(params: {
  commentId: string;
  message: string;
  accessToken: string;
}): Promise<PublicReplyResult> {
  const endpoint = `${params.commentId}/replies`;
  const body = {
    message: params.message,
  };

  const res = await graphFetch<{ id?: string }>(endpoint, {
    method: "POST",
    body,
    accessToken: params.accessToken,
  });

  if (res.ok && res.data) {
    return {
      success: true,
      replyId: res.data.id,
    };
  }

  return {
    success: false,
    error: res.error?.message || "Erreur lors de la réponse publique",
  };
}

/**
 * Fetches recent media posts/reels for the post picker in the backoffice.
 */
export async function fetchAccountMedia(params: {
  igUserId: string;
  accessToken: string;
  limit?: number;
}): Promise<{ media: MetaMediaItem[]; error?: string }> {
  const limit = Math.min(params.limit || 25, 50);
  const endpoint = `${params.igUserId}/media?fields=id,caption,media_type,permalink,thumbnail_url,media_url,timestamp&limit=${limit}`;

  const res = await graphFetch<{ data?: MetaMediaItem[] }>(endpoint, {
    method: "GET",
    accessToken: params.accessToken,
  });

  if (res.ok && res.data?.data) {
    return { media: res.data.data };
  }

  return {
    media: [],
    error: res.error?.message || "Impossible de récupérer les publications Instagram",
  };
}

/**
 * Fetches active stories (within 24 hours).
 */
export async function fetchLiveStories(params: {
  igUserId: string;
  accessToken: string;
}): Promise<{ stories: MetaMediaItem[]; error?: string }> {
  const endpoint = `${params.igUserId}/stories?fields=id,caption,media_type,permalink,media_url,timestamp`;

  const res = await graphFetch<{ data?: MetaMediaItem[] }>(endpoint, {
    method: "GET",
    accessToken: params.accessToken,
  });

  if (res.ok && res.data?.data) {
    return { stories: res.data.data };
  }

  return {
    stories: [],
    error: res.error?.message || "Impossible de récupérer les stories actives",
  };
}

/**
 * Tests the connection to Instagram Graph API and verifies account details.
 */
export async function testMetaConnection(params: {
  accessToken: string;
  igUserId?: string | null;
  pageId?: string | null;
}): Promise<ConnectionTestResult> {
  // 1. Try checking the IG user ID directly if available
  if (params.igUserId) {
    const res = await graphFetch<{ id: string; username?: string; name?: string }>(
      `${params.igUserId}?fields=id,username,name`,
      {
        method: "GET",
        accessToken: params.accessToken,
      },
    );

    if (res.ok && res.data) {
      return {
        ok: true,
        igUserId: res.data.id,
        username: res.data.username || res.data.name,
      };
    }
  }

  // 2. Fall back to /me with accounts lookup
  const meRes = await graphFetch<{
    id: string;
    name?: string;
    instagram_business_account?: { id: string; username?: string };
  }>(`me?fields=id,name,instagram_business_account{id,username}`, {
    method: "GET",
    accessToken: params.accessToken,
  });

  if (meRes.ok && meRes.data) {
    const igAccount = meRes.data.instagram_business_account;
    return {
      ok: true,
      pageId: meRes.data.id,
      igUserId: igAccount?.id,
      username: igAccount?.username || meRes.data.name,
    };
  }

  return {
    ok: false,
    error: meRes.error?.message || "Échec de validation du jeton Meta",
  };
}

/**
 * Inspects a Meta token using the debug_token endpoint (if App ID & Secret are set).
 */
export async function debugMetaToken(
  token: string,
): Promise<TokenDebugInfo | null> {
  const appId = process.env["IG_APP_ID"];
  const appSecret = process.env["IG_APP_SECRET"];
  if (!appId || !appSecret) {
    return null;
  }

  const endpoint = `debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`;

  const res = await graphFetch<{
    data?: {
      is_valid: boolean;
      expires_at?: number;
      scopes?: string[];
      user_id?: string;
      app_id?: string;
    };
  }>(endpoint, { method: "GET" });

  if (res.ok && res.data?.data) {
    const d = res.data.data;
    const expiresAt = d.expires_at && d.expires_at > 0
      ? new Date(d.expires_at * 1000).toISOString()
      : null;

    return {
      isValid: d.is_valid,
      expiresAt,
      scopes: d.scopes || [],
      userId: d.user_id,
      appId: d.app_id,
    };
  }

  return null;
}

