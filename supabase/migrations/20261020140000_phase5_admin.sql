-- Phase 5: Data layer and admin back office
-- Defines admin allowlist, is_admin() function, case_studies table,
-- RLS policies for admin & public, and storage policies for media bucket.

-- 1. Admin allowlist table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin reads admin_users" ON public.admin_users;
CREATE POLICY "admin reads admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper function to check admin rights
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

-- 2. Case studies table
CREATE TABLE IF NOT EXISTS public.case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'concept' CHECK (kind IN ('concept', 'client')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  client text NOT NULL,
  year text NOT NULL,
  location text NOT NULL,
  offer text,
  cover_path text,
  gallery jsonb NOT NULL DEFAULT '[]',
  translations jsonb NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_studies_status_sort_idx
  ON public.case_studies (status, sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS case_studies_slug_idx
  ON public.case_studies (slug);

ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

-- Public can read published case studies
DROP POLICY IF EXISTS "public reads published" ON public.case_studies;
CREATE POLICY "public reads published" ON public.case_studies
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admins have full CRUD on case studies
DROP POLICY IF EXISTS "admin all" ON public.case_studies;
CREATE POLICY "admin all" ON public.case_studies
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Project inquiries: admin read and update policies
DROP POLICY IF EXISTS "admin reads inquiries" ON public.project_inquiries;
CREATE POLICY "admin reads inquiries" ON public.project_inquiries
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin updates inquiries" ON public.project_inquiries;
CREATE POLICY "admin updates inquiries" ON public.project_inquiries
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Storage bucket "media" (public read, admin write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public reads media" ON storage.objects;
CREATE POLICY "public reads media" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "admin writes media" ON storage.objects;
CREATE POLICY "admin writes media" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'media' AND public.is_admin())
  WITH CHECK (bucket_id = 'media' AND public.is_admin());
