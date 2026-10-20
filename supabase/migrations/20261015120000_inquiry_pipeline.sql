-- Phase 2: inquiry pipeline.
-- Adds triage status, notification tracking and anti-spam metadata to
-- project_inquiries. RLS is unchanged: the table is still written only by the
-- server (service role). Admin read/update policies arrive in Phase 5.

ALTER TABLE public.project_inquiries
  ADD COLUMN status text NOT NULL DEFAULT 'new'
    CONSTRAINT project_inquiries_status_check
    CHECK (status IN ('new', 'read', 'replied', 'won', 'lost', 'spam')),
  ADD COLUMN notified_at timestamptz,
  ADD COLUMN notify_error text,
  ADD COLUMN locale text,
  ADD COLUMN ip_hash text,
  ADD COLUMN user_agent text,
  ADD COLUMN internal_notes text;

CREATE INDEX project_inquiries_status_created_idx
  ON public.project_inquiries (status, created_at DESC);

CREATE INDEX project_inquiries_ip_hash_created_idx
  ON public.project_inquiries (ip_hash, created_at DESC);
