-- Phase 5b: Harden and fix (Findings F1, F2, F7)
-- 1. Create site_settings table for studio socials, contacts, and operational settings (F1)
-- 2. Revoke direct anon insert on public.project_inquiries (F2)
-- 3. Add roles to admin_users and create admin_audit_log (F7)

-- 1. site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read whitelisted non-sensitive settings (socials, contact, audit capacity)
DROP POLICY IF EXISTS "public reads whitelisted settings" ON public.site_settings;
CREATE POLICY "public reads whitelisted settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (key IN ('socials', 'contact', 'audit', 'general'));

-- Admins have full access to manage settings
DROP POLICY IF EXISTS "admin manages settings" ON public.site_settings;
CREATE POLICY "admin manages settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed default socials if not already present
INSERT INTO public.site_settings (key, value)
VALUES (
  'socials',
  '{
    "instagram": "https://www.instagram.com/volkastudio",
    "linkedin": "https://www.linkedin.com/company/volka-studio",
    "tiktok": "https://www.tiktok.com/@volkastudio",
    "youtube": "https://www.youtube.com/@volkastudio",
    "twitter": "https://x.com/volkastudio",
    "facebook": "",
    "whatsapp": "",
    "email": "hello@volkastudio.com"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 2. Revoke direct anon/authenticated insert on project_inquiries (F2)
-- Submissions must exclusively pass through the submitInquiry server function (service_role).
REVOKE INSERT ON public.project_inquiries FROM anon, authenticated;
DROP POLICY IF EXISTS "Anyone can submit a project inquiry" ON public.project_inquiries;

-- 3. Admin roles (F7)
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'owner'
  CHECK (role IN ('owner', 'sales', 'editor'));

-- Helper to check specific admin roles
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND (
        role = required_role
        OR (required_role = 'editor' AND role IN ('owner', 'editor'))
        OR (required_role = 'sales' AND role IN ('owner', 'sales'))
        OR role = 'owner'
      )
  );
$$;

-- 4. admin_audit_log table (F7)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin reads audit log" ON public.admin_audit_log;
CREATE POLICY "admin reads audit log"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin inserts audit log" ON public.admin_audit_log;
CREATE POLICY "admin inserts audit log"
  ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
