-- Phase 5 fixes:
-- 1. Change is_admin() from STABLE to VOLATILE (safer, prevents wrong caching of auth.uid())
-- 2. Add updated_at auto-trigger on case_studies

-- 1. Recreate is_admin() as VOLATILE
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

-- 2. Trigger helper function (create only if not exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Apply trigger to case_studies
DROP TRIGGER IF EXISTS case_studies_set_updated_at ON public.case_studies;
CREATE TRIGGER case_studies_set_updated_at
  BEFORE UPDATE ON public.case_studies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
