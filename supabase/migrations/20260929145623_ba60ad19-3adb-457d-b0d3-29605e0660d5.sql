CREATE TABLE public.project_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  preferred_channel TEXT NOT NULL DEFAULT 'email',
  offer TEXT NOT NULL,
  timeline TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  vision TEXT NOT NULL,
  challenge TEXT,
  referral_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.project_inquiries TO anon, authenticated;
GRANT ALL ON public.project_inquiries TO service_role;

ALTER TABLE public.project_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a project inquiry"
  ON public.project_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX project_inquiries_created_at_idx ON public.project_inquiries (created_at DESC);