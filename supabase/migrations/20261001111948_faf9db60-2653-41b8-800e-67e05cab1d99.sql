DROP POLICY IF EXISTS "Anyone can submit a project inquiry" ON public.project_inquiries;
REVOKE INSERT ON public.project_inquiries FROM anon, authenticated;