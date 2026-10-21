-- =============================================================================
-- Phase 6 — Blog / Journal table & security
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  cover_path text,
  tags text[] NOT NULL DEFAULT '{}',
  reading_time_minutes int NOT NULL DEFAULT 5,
  social_links jsonb NOT NULL DEFAULT '{"tiktok": "", "youtube": "", "linkedin": ""}',
  translations jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_status_published_idx
  ON public.posts (status, published_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_slug_idx ON public.posts (slug);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public reads published posts" ON public.posts;
CREATE POLICY "public reads published posts" ON public.posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

DROP POLICY IF EXISTS "admin all posts" ON public.posts;
CREATE POLICY "admin all posts" ON public.posts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS posts_set_updated_at ON public.posts;
CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
