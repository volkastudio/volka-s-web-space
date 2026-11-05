-- ==============================================================================
-- Migration: 20261104150000_instagram_automation.sql
-- Description: Instagram Comment-to-DM & Story-Reply Automation for Volka Studio
-- References: Docs/volka-instagram-automation-plan.md
-- ==============================================================================

-- 1. Instagram Connection (Singleton row for Volka's own account)
CREATE TABLE IF NOT EXISTS public.ig_connection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_user_id text,
  page_id text,
  username text,
  access_token text, -- Meta Page Access Token (server-only via service role)
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  webhook_last_received_at timestamptz,
  is_paused boolean NOT NULL DEFAULT false,
  daily_cap integer NOT NULL DEFAULT 200,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ig_connection ENABLE ROW LEVEL SECURITY;

-- Only authenticated admins can read/modify the connection row.
-- Note: browser client should never receive access_token directly; server functions strip it.
DROP POLICY IF EXISTS "Admins can view ig_connection" ON public.ig_connection;
CREATE POLICY "Admins can view ig_connection"
  ON public.ig_connection
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update ig_connection" ON public.ig_connection;
CREATE POLICY "Admins can update ig_connection"
  ON public.ig_connection
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Automations (Rules)
CREATE TABLE IF NOT EXISTS public.ig_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  trigger text NOT NULL DEFAULT 'comment' CHECK (trigger IN ('comment', 'story_reply')),
  target_mode text NOT NULL DEFAULT 'any' CHECK (target_mode IN ('any', 'selected')),
  match_mode text NOT NULL DEFAULT 'word' CHECK (match_mode IN ('word', 'contains', 'exact', 'starts_with')),
  keywords text[] NOT NULL DEFAULT '{}'::text[],
  exclude_keywords text[] NOT NULL DEFAULT '{}'::text[],
  dm_text text NOT NULL,
  public_reply_variants text[] NOT NULL DEFAULT '{}'::text[],
  product_id uuid REFERENCES public.digital_products(id) ON DELETE SET NULL,
  link_src_tag text,
  one_per_user boolean NOT NULL DEFAULT true,
  cooldown_hours integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ig_automations_active_pos ON public.ig_automations (is_active, position ASC);

ALTER TABLE public.ig_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ig_automations" ON public.ig_automations;
CREATE POLICY "Admins manage ig_automations"
  ON public.ig_automations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Automation Targets (for target_mode = 'selected')
CREATE TABLE IF NOT EXISTS public.ig_automation_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.ig_automations(id) ON DELETE CASCADE,
  media_id text NOT NULL,
  media_type text NOT NULL DEFAULT 'post' CHECK (media_type IN ('post', 'reel', 'story')),
  permalink text,
  caption_excerpt text,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ig_targets_auto ON public.ig_automation_targets (automation_id);
CREATE INDEX IF NOT EXISTS idx_ig_targets_media ON public.ig_automation_targets (media_id);

ALTER TABLE public.ig_automation_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ig_automation_targets" ON public.ig_automation_targets;
CREATE POLICY "Admins manage ig_automation_targets"
  ON public.ig_automation_targets
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Events Log (Raw webhook records, decisions and execution states)
CREATE TABLE IF NOT EXISTS public.ig_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'comment' CHECK (kind IN ('comment', 'story_reply', 'story_mention')),
  external_id text NOT NULL UNIQUE, -- comment_id or message_id for deduplication
  ig_user_id text,                  -- sender Instagram-scoped user ID
  username text,                    -- sender Instagram handle (if available)
  text text,                        -- comment text or message text
  media_id text,                    -- post, reel or story ID
  parent_comment_id text,           -- if reply to a previous comment
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'matched', 'sent', 'skipped', 'failed')),
  automation_id uuid REFERENCES public.ig_automations(id) ON DELETE SET NULL,
  skip_reason text,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ig_events_external_id ON public.ig_events (external_id);
CREATE INDEX IF NOT EXISTS idx_ig_events_status_received ON public.ig_events (status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_events_user_automation ON public.ig_events (ig_user_id, automation_id, status);

ALTER TABLE public.ig_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view ig_events" ON public.ig_events;
CREATE POLICY "Admins can view ig_events"
  ON public.ig_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update ig_events" ON public.ig_events;
CREATE POLICY "Admins can update ig_events"
  ON public.ig_events
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Contacts (People who interacted and opt-out STOP flags)
CREATE TABLE IF NOT EXISTS public.ig_contacts (
  ig_user_id text PRIMARY KEY,
  username text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_event_at timestamptz NOT NULL DEFAULT now(),
  events_count integer NOT NULL DEFAULT 1,
  blocked boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_ig_contacts_blocked ON public.ig_contacts (blocked);

ALTER TABLE public.ig_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view and edit ig_contacts" ON public.ig_contacts;
CREATE POLICY "Admins can view and edit ig_contacts"
  ON public.ig_contacts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

