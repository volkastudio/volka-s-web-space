-- Free audit: 15 places per month (was seeded at 10).
-- Keeps the other keys (delivery_working_days, is_open) untouched.
INSERT INTO public.site_settings (key, value)
VALUES ('audit', '{"capacity_per_month": 15, "delivery_working_days": 5, "is_open": true}'::jsonb)
ON CONFLICT (key) DO UPDATE
  SET value = public.site_settings.value || '{"capacity_per_month": 15}'::jsonb;
