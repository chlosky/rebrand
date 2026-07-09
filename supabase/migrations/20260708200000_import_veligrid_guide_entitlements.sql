-- Import existing palette plotting Guide customers from veligrid (production digital_entitlements).
-- Idempotent: only inserts an email/product if there is no active entitlement already.
-- The two manual grants (susiebonner + support) are seeded separately; skipped here.

INSERT INTO public.digital_entitlements (email, product_slug, source, granted_at, notes)
SELECT
  lower(v.email),
  v.product_slug,
  v.source,
  v.granted_at::timestamptz,
  'Migrated from veligrid'
FROM (
  VALUES
    ('manonfoubert9@gmail.com',      'palette-plotting-guide', 'shopify_order', '2026-07-01 19:11:21.421+00'),
    ('tsfouse@gmail.com',            'palette-plotting-guide', 'shopify_order', '2026-07-05 15:06:40.146+00'),
    ('rcbankey@gmail.com',           'palette-plotting-guide', 'shopify_order', '2026-07-02 02:09:21.685+00'),
    ('ashn0504@gmail.com',           'palette-plotting-guide', 'shopify_order', '2026-07-01 01:04:17.414+00'),
    ('christen.watson@gmail.com',    'palette-plotting-guide', 'shopify_order', '2026-06-30 23:23:30.313+00'),
    ('mannyquantumleap@gmail.com',   'palette-plotting-guide', 'shopify_order', '2026-06-30 15:39:55.207+00'),
    ('spiceshew@googlemail.com',     'palette-plotting-guide', 'shopify_order', '2026-07-06 17:24:24.824+00'),
    ('lefawnbarefoot@gmail.com',     'palette-plotting-guide', 'shopify_order', '2026-07-08 03:02:34.504+00'),
    ('mimithemanifestor@gmail.com',  'palette-plotting-guide', 'shopify_order', '2026-06-30 15:48:30.897+00'),
    ('soporte@brillologia.com',      'palette-plotting-guide', 'shopify_order', '2026-07-05 10:20:08.438+00'),
    ('guziakjustyna2006@icloud.com', 'palette-plotting-guide', 'shopify_order', '2026-07-01 14:35:53.302+00'),
    ('avschenck@icloud.com',         'palette-plotting-guide', 'shopify_order', '2026-06-30 21:51:26.502+00')
) AS v(email, product_slug, source, granted_at)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.digital_entitlements e
  WHERE lower(e.email) = lower(v.email)
    AND e.product_slug = v.product_slug
    AND e.revoked_at IS NULL
);
