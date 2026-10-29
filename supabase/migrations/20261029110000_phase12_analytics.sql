-- ==============================================================================
-- Migration: 20261029110000_phase12_analytics.sql
-- Description: Phase 12 — First-party traffic, content reading and funnel metrics
-- Decisions: D16 (First-party analytics in Supabase), D17 (Read qualification), D18 (Privacy & 30-day raw retention)
-- ==============================================================================

-- 1. Raw events table (retention: 30 days)
CREATE TABLE IF NOT EXISTS public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  path text NOT NULL,
  entity_type text,
  entity_id text,
  visitor_hash text NOT NULL,
  session_id text,
  source text,
  referrer text,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  country text,
  device_class text,
  browser_family text,
  locale text,
  duration_seconds integer NOT NULL DEFAULT 0,
  scroll_depth integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for lightning-fast queries and rollups
CREATE INDEX IF NOT EXISTS idx_site_events_created_at ON public.site_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_event_name ON public.site_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_path ON public.site_events (path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_visitor ON public.site_events (visitor_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_entity ON public.site_events (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_source ON public.site_events (source, created_at DESC);

-- Enable RLS
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

-- Allow public inserts via anon role (or service role) for validated events
DROP POLICY IF EXISTS "Public can record site events" ON public.site_events;
CREATE POLICY "Public can record site events"
  ON public.site_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(path) <= 256
    AND char_length(visitor_hash) >= 16
    AND event_name IN (
      'pageview', 'read', 'engagement',
      'cta_start_click', 'pricing_view', 'start_step_view', 'start_submit',
      'audit_start', 'audit_submit', 'whatsapp_click', 'report_view',
      'sales_view', 'sales_cta_click', 'sales_region_pick', 'sales_outbound',
      'post_cta_click', 'post_social_click'
    )
  );

-- Admins can query raw events
DROP POLICY IF EXISTS "Admins can read site events" ON public.site_events;
CREATE POLICY "Admins can read site events"
  ON public.site_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 2. Daily aggregated metrics (retained indefinitely for historical trends)
CREATE TABLE IF NOT EXISTS public.daily_stats (
  date date PRIMARY KEY,
  views integer NOT NULL DEFAULT 0,
  visitors integer NOT NULL DEFAULT 0,
  reads integer NOT NULL DEFAULT 0,
  bounces integer NOT NULL DEFAULT 0,
  avg_duration_seconds numeric(8, 2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read daily stats" ON public.daily_stats;
CREATE POLICY "Admins can read daily stats"
  ON public.daily_stats
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can modify daily stats" ON public.daily_stats;
CREATE POLICY "Admins can modify daily stats"
  ON public.daily_stats
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Daily sources aggregated breakdown
CREATE TABLE IF NOT EXISTS public.daily_sources (
  id bigserial PRIMARY KEY,
  date date NOT NULL,
  source text NOT NULL,
  referrer_host text NOT NULL DEFAULT '',
  utm_campaign text NOT NULL DEFAULT '',
  views integer NOT NULL DEFAULT 0,
  visitors integer NOT NULL DEFAULT 0,
  reads integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_daily_sources UNIQUE (date, source, referrer_host, utm_campaign)
);

CREATE INDEX IF NOT EXISTS idx_daily_sources_date ON public.daily_sources (date DESC);

ALTER TABLE public.daily_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read daily sources" ON public.daily_sources;
CREATE POLICY "Admins can read daily sources"
  ON public.daily_sources
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can modify daily sources" ON public.daily_sources;
CREATE POLICY "Admins can modify daily sources"
  ON public.daily_sources
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Daily entity statistics (blog posts, cases, sales pages)
CREATE TABLE IF NOT EXISTS public.daily_entity_stats (
  id bigserial PRIMARY KEY,
  date date NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  visitors integer NOT NULL DEFAULT 0,
  reads integer NOT NULL DEFAULT 0,
  total_reading_time_seconds integer NOT NULL DEFAULT 0,
  cta_clicks integer NOT NULL DEFAULT 0,
  social_clicks integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_daily_entity_stats UNIQUE (date, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_entity_stats_date ON public.daily_entity_stats (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_entity_lookup ON public.daily_entity_stats (entity_type, entity_id);

ALTER TABLE public.daily_entity_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read daily entity stats" ON public.daily_entity_stats;
CREATE POLICY "Admins can read daily entity stats"
  ON public.daily_entity_stats
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can modify daily entity stats" ON public.daily_entity_stats;
CREATE POLICY "Admins can modify daily entity stats"
  ON public.daily_entity_stats
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- Aggregation and Rollup Stored Procedures
-- ==============================================================================

-- 5. Rollup daily analytics for a specific date (idempotent)
CREATE OR REPLACE FUNCTION public.rollup_daily_analytics(target_date date DEFAULT (current_date - interval '1 day')::date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz := target_date::timestamptz;
  v_end timestamptz := (target_date + interval '1 day')::timestamptz;
BEGIN
  -- Rollup daily_stats
  INSERT INTO public.daily_stats (date, views, visitors, reads, bounces, avg_duration_seconds, updated_at)
  SELECT
    target_date,
    COUNT(*) FILTER (WHERE event_name = 'pageview') AS views,
    COUNT(DISTINCT visitor_hash) AS visitors,
    COUNT(*) FILTER (WHERE event_name = 'read') AS reads,
    0 AS bounces,
    COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0), 0) AS avg_duration_seconds,
    now()
  FROM public.site_events
  WHERE created_at >= v_start AND created_at < v_end
  ON CONFLICT (date) DO UPDATE SET
    views = EXCLUDED.views,
    visitors = EXCLUDED.visitors,
    reads = EXCLUDED.reads,
    avg_duration_seconds = EXCLUDED.avg_duration_seconds,
    updated_at = now();

  -- Rollup daily_sources
  INSERT INTO public.daily_sources (date, source, referrer_host, utm_campaign, views, visitors, reads, updated_at)
  SELECT
    target_date,
    COALESCE(source, 'direct') AS source,
    COALESCE(referrer_host, '') AS referrer_host,
    COALESCE(utm_campaign, '') AS utm_campaign,
    COUNT(*) FILTER (WHERE event_name = 'pageview') AS views,
    COUNT(DISTINCT visitor_hash) AS visitors,
    COUNT(*) FILTER (WHERE event_name = 'read') AS reads,
    now()
  FROM public.site_events
  WHERE created_at >= v_start AND created_at < v_end
  GROUP BY COALESCE(source, 'direct'), COALESCE(referrer_host, ''), COALESCE(utm_campaign, '')
  ON CONFLICT (date, source, referrer_host, utm_campaign) DO UPDATE SET
    views = EXCLUDED.views,
    visitors = EXCLUDED.visitors,
    reads = EXCLUDED.reads,
    updated_at = now();

  -- Rollup daily_entity_stats (posts, cases, sales pages)
  INSERT INTO public.daily_entity_stats (
    date, entity_type, entity_id, views, visitors, reads,
    total_reading_time_seconds, cta_clicks, social_clicks, updated_at
  )
  SELECT
    target_date,
    entity_type,
    entity_id,
    COUNT(*) FILTER (WHERE event_name = 'pageview') AS views,
    COUNT(DISTINCT visitor_hash) AS visitors,
    COUNT(*) FILTER (WHERE event_name = 'read') AS reads,
    COALESCE(SUM(duration_seconds), 0)::integer AS total_reading_time_seconds,
    COUNT(*) FILTER (WHERE event_name IN ('cta_start_click', 'post_cta_click', 'sales_cta_click')) AS cta_clicks,
    COUNT(*) FILTER (WHERE event_name = 'post_social_click') AS social_clicks,
    now()
  FROM public.site_events
  WHERE created_at >= v_start AND created_at < v_end
    AND entity_type IS NOT NULL AND entity_id IS NOT NULL
  GROUP BY entity_type, entity_id
  ON CONFLICT (date, entity_type, entity_id) DO UPDATE SET
    views = EXCLUDED.views,
    visitors = EXCLUDED.visitors,
    reads = EXCLUDED.reads,
    total_reading_time_seconds = EXCLUDED.total_reading_time_seconds,
    cta_clicks = EXCLUDED.cta_clicks,
    social_clicks = EXCLUDED.social_clicks,
    updated_at = now();
END;
$$;

-- 6. Purge raw site_events older than retention threshold (D18: 30 days)
CREATE OR REPLACE FUNCTION public.purge_old_site_events(older_than_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.site_events
  WHERE created_at < (now() - (older_than_days || ' days')::interval);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON TABLE public.site_events IS 'First-party anonymized raw analytics events. Strictly retained 30 days per D18.';
COMMENT ON TABLE public.daily_stats IS 'Aggregated daily traffic totals for long-term historical trends.';
COMMENT ON TABLE public.daily_sources IS 'Aggregated daily traffic breakdown by acquisition channel and UTM campaign.';
COMMENT ON TABLE public.daily_entity_stats IS 'Aggregated daily performance per blog post, case study, and sales product.';

