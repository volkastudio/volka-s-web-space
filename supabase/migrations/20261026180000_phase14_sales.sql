-- Phase 14: Sales pages, buyers and follow-up
-- 1. Create digital_products table
-- 2. Create product_regions table (D21)
-- 3. Create buyers table (14.1)
-- 4. Create email_suppressions table (14.2)

-- 1. digital_products
CREATE TABLE IF NOT EXISTS public.digital_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  headline text NOT NULL,
  cover_image text,
  description text NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  trigger_keyword text,
  views_count integer NOT NULL DEFAULT 0,
  cta_clicks_count integer NOT NULL DEFAULT 0,
  outbound_clicks_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_digital_products_slug ON public.digital_products (slug);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON public.digital_products (status);

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

-- Public can view published products
DROP POLICY IF EXISTS "public reads published products" ON public.digital_products;
CREATE POLICY "public reads published products"
  ON public.digital_products
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admins manage all digital products
DROP POLICY IF EXISTS "admin manages products" ON public.digital_products;
CREATE POLICY "admin manages products"
  ON public.digital_products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. product_regions (D21: Europe/Whop, Afrique/Chariow)
CREATE TABLE IF NOT EXISTS public.product_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  region_key text NOT NULL,
  label_fr text NOT NULL,
  label_en text NOT NULL,
  checkout_url text NOT NULL,
  platform_name text NOT NULL DEFAULT 'whop',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (product_id, region_key)
);

CREATE INDEX IF NOT EXISTS idx_product_regions_product ON public.product_regions (product_id);

ALTER TABLE public.product_regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public reads active product regions" ON public.product_regions;
CREATE POLICY "public reads active product regions"
  ON public.product_regions
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.digital_products p
      WHERE p.id = product_regions.product_id AND p.status = 'published'
    )
  );

DROP POLICY IF EXISTS "admin manages product regions" ON public.product_regions;
CREATE POLICY "admin manages product regions"
  ON public.product_regions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. buyers (14.1)
CREATE TABLE IF NOT EXISTS public.buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  name text,
  country text,
  product_id uuid REFERENCES public.digital_products(id) ON DELETE SET NULL,
  product_title text NOT NULL,
  platform text NOT NULL,
  platform_order_ref text,
  amount_cents integer,
  currency text DEFAULT 'EUR',
  marketing_consent text NOT NULL DEFAULT 'unknown' CHECK (marketing_consent IN ('yes', 'no', 'unknown')),
  consent_note text,
  source_tag text,
  lead_id uuid
);

CREATE INDEX IF NOT EXISTS idx_buyers_email ON public.buyers (lower(email));
CREATE INDEX IF NOT EXISTS idx_buyers_product ON public.buyers (product_id);
CREATE INDEX IF NOT EXISTS idx_buyers_created_at ON public.buyers (created_at DESC);

ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manages buyers" ON public.buyers;
CREATE POLICY "admin manages buyers"
  ON public.buyers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. email_suppressions (14.2)
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email text PRIMARY KEY,
  reason text NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  suppressed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manages suppressions" ON public.email_suppressions;
CREATE POLICY "admin manages suppressions"
  ON public.email_suppressions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
