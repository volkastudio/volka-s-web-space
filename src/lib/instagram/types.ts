import type { Database } from "@/integrations/supabase/types";

export type IgConnectionRow = Database["public"]["Tables"]["ig_connection"]["Row"];
export type IgAutomationRow = Database["public"]["Tables"]["ig_automations"]["Row"];
export type IgAutomationTargetRow = Database["public"]["Tables"]["ig_automation_targets"]["Row"];
export type IgEventRow = Database["public"]["Tables"]["ig_events"]["Row"];
export type IgContactRow = Database["public"]["Tables"]["ig_contacts"]["Row"];

export type TriggerType = "comment" | "story_reply";
export type TargetMode = "any" | "selected";
export type MatchMode = "word" | "contains" | "exact" | "starts_with";
export type EventKind = "comment" | "story_reply" | "story_mention";
export type EventStatus = "received" | "matched" | "sent" | "skipped" | "failed";

export type SkipReason =
  | "own_comment"
  | "no_keyword"
  | "excluded_word"
  | "no_rule_for_post"
  | "already_sent"
  | "cooldown"
  | "blocked"
  | "paused"
  | "daily_cap"
  | "outside_dates"
  | "window_expired"
  | "already_replied"
  | "rule_inactive";

/** Public connection info safely rendered in the backoffice (access_token is NEVER exposed to client) */
export interface IgConnectionPublic {
  id: string;
  igUserId: string | null;
  pageId: string | null;
  username: string | null;
  tokenExpiresAt: string | null;
  scopes: string[];
  webhookLastReceivedAt: string | null;
  isPaused: boolean;
  dailyCap: number;
  hasToken: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
}

export interface IgAutomationWithTargets extends IgAutomationRow {
  targets?: IgAutomationTargetRow[];
  product?: {
    id: string;
    slug: string;
    title: string;
  } | null;
  stats?: {
    triggersCount: number;
    sentCount: number;
    skippedCount: number;
    failedCount: number;
  };
}

export interface MatchResult {
  matched: boolean;
  automation?: IgAutomationWithTargets;
  skipReason?: SkipReason;
  interpolatedDm?: string;
  publicReply?: string;
}

export interface SimulationResult {
  matched: boolean;
  ruleName?: string;
  ruleId?: string;
  skipReason?: SkipReason;
  interpolatedDm?: string;
  publicReply?: string;
  normalizedComment: string;
  matchedKeyword?: string;
}

/** Media item fetched from Meta Graph API for post/story picker */
export interface MetaMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "STORY";
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
  timestamp: string;
}

/** Meta Webhook incoming payload formats */
export interface MetaWebhookCommentChange {
  field: "comments";
  value: {
    from: {
      id: string;
      username: string;
    };
    media: {
      id: string;
      media_product_type?: string;
    };
    id: string; // comment_id
    text: string;
    created_time?: number;
    parent_id?: string;
  };
}

export interface MetaWebhookMessagingEvent {
  sender: {
    id: string; // IGSID
  };
  recipient: {
    id: string; // Page ID / IG User ID
  };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    reply_to?: {
      mid?: string;
      story?: {
        id: string;
        url?: string;
      };
    };
  };
}

export interface MetaWebhookPayload {
  object: "instagram" | "page";
  entry: Array<{
    id: string;
    time: number;
    changes?: MetaWebhookCommentChange[];
    messaging?: MetaWebhookMessagingEvent[];
  }>;
}

