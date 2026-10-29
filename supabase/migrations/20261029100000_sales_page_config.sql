-- Sales pages: editable texts + optional email step (configured per page in the back office)

-- 1. Per-page configuration (button label, region question, optional email step)
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS page_config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Emails collected on a sales page before redirecting to the checkout.
--    These are interested visitors, NOT buyers. marketing_consent is false unless
--    the visitor ticked the (optional) consent checkbox shown on the page.
CREATE TABLE IF NOT EXISTS public.product_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  email text NOT NULL,                       -- stored lower-cased by the server
  name text,
  region_key text,
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_text text,                         -- exact wording the visitor agreed to
  consent_at timestamptz,
  source_tag text,
  hashed_ip text,
  UNIQUE (product_id, email)
);

CREATE INDEX IF NOT EXISTS idx_product_contacts_product ON public.product_contacts (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_contacts_ip ON public.product_contacts (hashed_ip, created_at DESC);

-- No policy for anon: inserts go through a server function (service role) only.
ALTER TABLE public.product_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manages product contacts" ON public.product_contacts;
CREATE POLICY "admin manages product contacts"
  ON public.product_contacts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
