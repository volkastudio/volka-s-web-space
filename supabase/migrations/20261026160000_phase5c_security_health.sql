-- Phase 5c: Security and Health Monitoring (Findings F11, F12)
-- 1. Create security_events table with 90 days retention support
-- 2. Create health_checks table
-- 3. Create login_attempts table for server-side rate limiting and brute force protection

-- 1. security_events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id bigserial PRIMARY KEY,
  ts timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash text,
  path text,
  details jsonb
);

CREATE INDEX IF NOT EXISTS idx_security_events_ts ON public.security_events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events (type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events (severity);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin reads security events" ON public.security_events;
CREATE POLICY "admin reads security events"
  ON public.security_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin inserts security events" ON public.security_events;
CREATE POLICY "admin inserts security events"
  ON public.security_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 2. health_checks table
CREATE TABLE IF NOT EXISTS public.health_checks (
  key text PRIMARY KEY,
  group_name text NOT NULL DEFAULT 'config',
  status text NOT NULL CHECK (status IN ('ok', 'warning', 'error')),
  detail text NOT NULL,
  hint text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_status ON public.health_checks (status);
CREATE INDEX IF NOT EXISTS idx_health_checks_group ON public.health_checks (group_name);

ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin reads health checks" ON public.health_checks;
CREATE POLICY "admin reads health checks"
  ON public.health_checks
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin manages health checks" ON public.health_checks;
CREATE POLICY "admin manages health checks"
  ON public.health_checks
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. login_attempts table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id bigserial PRIMARY KEY,
  ts timestamptz NOT NULL DEFAULT now(),
  email_hash text NOT NULL,
  ip_hash text NOT NULL,
  success boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup ON public.login_attempts (ip_hash, email_hash, ts DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ts ON public.login_attempts (ts DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin reads login attempts" ON public.login_attempts;
CREATE POLICY "admin reads login attempts"
  ON public.login_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin inserts login attempts" ON public.login_attempts;
CREATE POLICY "admin inserts login attempts"
  ON public.login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
