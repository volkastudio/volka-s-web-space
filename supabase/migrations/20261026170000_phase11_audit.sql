-- Phase 11: Free Growth Audit (/audit)
-- 1. Create audit_requests table
-- 2. Seed default audit settings in site_settings (capacity, delivery days)

CREATE TABLE IF NOT EXISTS public.audit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending_verification' 
    CHECK (status IN ('pending_verification', 'queued', 'waitlist', 'reviewing', 'completed', 'rejected')),
  track text NOT NULL 
    CHECK (track IN ('website', 'marketing', 'sales', 'general')),
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  company_name text NOT NULL,
  activity_sector text NOT NULL,
  country text NOT NULL,
  team_size text NOT NULL,
  website_url text,
  specific_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  verification_token text NOT NULL UNIQUE,
  verification_token_expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  is_entitled boolean NOT NULL DEFAULT true,
  privacy_consent boolean NOT NULL DEFAULT true,
  admin_notes text,
  sent_at timestamptz,
  due_at timestamptz,
  hashed_ip text
);

CREATE INDEX IF NOT EXISTS idx_audit_requests_created_at ON public.audit_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_requests_status ON public.audit_requests (status);
CREATE INDEX IF NOT EXISTS idx_audit_requests_track ON public.audit_requests (track);
CREATE INDEX IF NOT EXISTS idx_audit_requests_email ON public.audit_requests (lower(contact_email));
CREATE INDEX IF NOT EXISTS idx_audit_requests_token ON public.audit_requests (verification_token);

ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;

-- Service role has full access by default.
-- Admins can read and update audit requests.
DROP POLICY IF EXISTS "admin reads audit requests" ON public.audit_requests;
CREATE POLICY "admin reads audit requests"
  ON public.audit_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin manages audit requests" ON public.audit_requests;
CREATE POLICY "admin manages audit requests"
  ON public.audit_requests
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed default audit settings into site_settings (F1 / D8)
-- 10 audits per month, 5 working days delivery time, open state
INSERT INTO public.site_settings (key, value)
VALUES (
  'audit',
  '{
    "capacity_per_month": 10,
    "delivery_working_days": 5,
    "is_open": true
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
