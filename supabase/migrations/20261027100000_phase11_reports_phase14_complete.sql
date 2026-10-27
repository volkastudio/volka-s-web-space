-- Phase 11.1: Audit Workbench & Private Report Page
-- Phase 14 Complete: import_batches, email sequences, webhooks
-- Extends earlier Phase 11 & Phase 14 migrations

-- ──────────────────────────────────────────
-- Phase 11.1: Findings library + reports
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_findings_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track text NOT NULL CHECK (track IN ('website', 'marketing', 'sales', 'general')),
  pillar text,
  title_fr text NOT NULL,
  title_en text NOT NULL DEFAULT '',
  why_fr text NOT NULL DEFAULT '',
  why_en text NOT NULL DEFAULT '',
  fix_fr text NOT NULL DEFAULT '',
  fix_en text NOT NULL DEFAULT '',
  impact smallint NOT NULL DEFAULT 3 CHECK (impact BETWEEN 1 AND 5),
  effort smallint NOT NULL DEFAULT 3 CHECK (effort BETWEEN 1 AND 5),
  suggested_offer text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_findings_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manages findings library" ON public.audit_findings_library;
CREATE POLICY "admin manages findings library"
  ON public.audit_findings_library
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_request_id uuid NOT NULL REFERENCES public.audit_requests(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,  -- sha256 of the raw token; raw token never stored
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '90 days'),
  revoked_at timestamptz,
  locale text NOT NULL DEFAULT 'fr',
  scorecard jsonb NOT NULL DEFAULT '{}'::jsonb,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  quick_wins jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendation jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  first_viewed_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_reports_token_hash ON public.audit_reports (token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_reports_audit_request ON public.audit_reports (audit_request_id);

ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manages audit reports" ON public.audit_reports;
CREATE POLICY "admin manages audit reports"
  ON public.audit_reports
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Add minutes_spent and assigned_to to audit_requests if not present
ALTER TABLE public.audit_requests
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS minutes_spent integer,
  ADD COLUMN IF NOT EXISTS locale text DEFAULT 'fr';

-- Seed ~10 findings library entries (FR, covering website track)
INSERT INTO public.audit_findings_library (track, pillar, title_fr, why_fr, fix_fr, impact, effort, suggested_offer)
VALUES
  ('website', 'conversion', 'Bouton WhatsApp sans message pré-rempli', 'Le prospect doit inventer sa question, ce qui crée de la friction et réduit les prises de contact de 30 à 40 %.', 'Remplacez le lien wa.me/ par un lien avec le paramètre ?text= pré-rempli décrivant l''offre choisie.', 5, 1, 'offer-1'),
  ('website', 'perception', 'Titre principal trop générique — ne répond pas à « C''est pour moi ? »', 'Un visiteur qui ne se reconnaît pas dans les 5 premières secondes quitte sans interagir. Le taux de rebond dépasse alors 70 %.', 'Reformulez le titre pour nommer explicitement la problématique du client cible : « Tu vends X mais Y te bloque — voici comment corriger ça. »', 4, 2, 'offer-2'),
  ('website', 'conversion', 'Absence de badge de confiance ou de preuve sociale visible au-dessus du pli', 'Les visiteurs cherchent des signaux de légitimité avant d''agir. Leur absence retarde ou annule le clic sur le CTA.', 'Ajoutez un logo ou chiffre-clé résultat client (ex. « +23 marques accompagnées », « 4,9/5 ») dans les 200 premiers pixels visibles.', 4, 1, 'offer-1'),
  ('website', 'performance', 'Score de performance mobile inférieur à 60 (PageSpeed)', 'Un score mobile bas allonge le temps de chargement perçu. Au-delà de 3 secondes, 53 % des visiteurs mobiles abandonnent.', 'Compressez les images (WebP ≤ 150 KB pour le hero), différez le JavaScript non critique et activez un CDN pour les assets statiques.', 5, 3, 'offer-2'),
  ('website', 'acquisition', 'Balise meta description absente ou dupliquée', 'Google génère une description aléatoire peu engageante, réduisant le taux de clic depuis les résultats de recherche (CTR -15 à -25 %).', 'Rédigez une meta description unique par page (155 caractères max) incluant le bénéfice principal et un appel à l''action implicite.', 3, 1, 'offer-1'),
  ('marketing', 'acquisition', 'Biographie Instagram ne mentionne pas le problème résolu', 'Les visiteurs du profil ne comprennent pas immédiatement ce que vous leur apportez, réduisant les abonnements et les clics en lien bio.', 'Reformulez la bio selon la structure : [Pour qui] + [Quel problème vous résolvez] + [Appel à l''action clair vers le lien bio].', 4, 1, 'offer-1'),
  ('marketing', 'perception', 'Incohérence visuelle entre les différents canaux de communication', 'Un visiteur qui passe d''Instagram à votre site ou LinkedIn doit reconnaître la même marque. L''incohérence crée de la méfiance.', 'Définissez un kit visuel minimal (3 couleurs, 1 à 2 polices, 1 format de vignette) appliqué systématiquement sur tous les supports.', 3, 2, 'offer-2'),
  ('sales', 'automation', 'Absence de message de suivi automatique après un premier contact', 'Plus de 80 % des ventes nécessitent 5 points de contact. Sans suivi automatisé, la plupart des prospects sont perdus après 2 jours.', 'Mettez en place un séquençage simple : message de bienvenue immédiat, puis 3 relances à J+1, J+4 et J+10, avec un vrai appel à l''action à chaque étape.', 5, 2, 'offer-3'),
  ('sales', 'conversion', 'Aucun formulaire ou questionnaire de qualification en amont', 'Traiter chaque demande sans filtre préalable consomme du temps sur des prospects non qualifiés et dilue la valeur perçue du service.', 'Créez un court formulaire de pré-qualification (budget indicatif, objectif, délai) accessible depuis vos profils. Répondez uniquement aux dossiers qualifiés.', 4, 2, 'offer-2'),
  ('general', 'conversion', 'Parcours client non défini : de la découverte à la vente', 'Sans parcours clairement défini, chaque prospect vit une expérience différente et les points de friction ne sont jamais identifiés ni corrigés.', 'Cartographiez les 5 étapes clés de votre parcours actuel (découverte, intérêt, considération, décision, achat) et identifiez les étapes sans action prévue.', 5, 3, 'offer-1')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────
-- Phase 14 Complete: import batches, email sequences, suppressions update
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  platform text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  undone_at timestamptz
);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manages import batches" ON public.import_batches;
CREATE POLICY "admin manages import batches"
  ON public.import_batches
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Add import_batch_id to buyers if not present
ALTER TABLE public.buyers
  ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS purchased_at timestamptz,
  ADD COLUMN IF NOT EXISTS region_key text;

-- Update email_suppressions reason check to include 'manual'
ALTER TABLE public.email_suppressions
  DROP CONSTRAINT IF EXISTS email_suppressions_reason_check;
ALTER TABLE public.email_suppressions
  ADD CONSTRAINT email_suppressions_reason_check
    CHECK (reason IN ('unsubscribe', 'bounce', 'complaint', 'manual'));

-- Email sequences for follow-up automation (Phase 14.2)
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  position smallint NOT NULL DEFAULT 1,
  delay_days smallint NOT NULL DEFAULT 3,
  subject_fr text NOT NULL,
  subject_en text NOT NULL DEFAULT '',
  body_fr text NOT NULL,
  body_en text NOT NULL DEFAULT '',
  stop_on_reply boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_step_id uuid NOT NULL REFERENCES public.email_sequence_steps(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'skipped', 'cancelled')),
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  error text,
  message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_sends_status ON public.email_sends (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_sends_buyer ON public.email_sends (buyer_id);

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manages email sequences" ON public.email_sequences;
CREATE POLICY "admin manages email sequences" ON public.email_sequences FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin manages sequence steps" ON public.email_sequence_steps;
CREATE POLICY "admin manages sequence steps" ON public.email_sequence_steps FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin manages email sends" ON public.email_sends;
CREATE POLICY "admin manages email sends" ON public.email_sends FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Webhook deduplication table (Phase 14.3)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,
  platform text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  signature_ok boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin manages webhook events" ON public.webhook_events;
CREATE POLICY "admin manages webhook events" ON public.webhook_events FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed default follow-up sequence (D24 — Day 3, Day 10, Day 21)
INSERT INTO public.email_sequences (key, name, scope, active)
VALUES (
  'buyer-followup-default',
  'Suivi acheteur standard',
  '{"all_products": true}'::jsonb,
  false  -- inactive by default; owner activates after testing
)
ON CONFLICT (key) DO NOTHING;
