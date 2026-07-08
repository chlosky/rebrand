-- Parity with veligrid: align the guide product row and seed the manual entitlements
-- that live in code (susiebonner + support). Runtime customer entitlements are NOT here —
-- they live in the source project's production DB and must be exported/imported separately.

-- Match veligrid's final product title/description for the guide.
UPDATE public.digital_products
SET
  title = 'Palette Plotting Guide: The 4-Board Rebrand & Vision Board Method',
  description = 'A mobile-first digital guide for setting up a color-coded vision board wall with three focus boards and one plan board.'
WHERE slug = 'palette-plotting-guide';

-- Manual Palette Plotting Guide access for susiebonner23@gmail.com
INSERT INTO public.digital_entitlements (email, product_slug, source, notes)
SELECT
  'susiebonner23@gmail.com',
  'palette-plotting-guide',
  'manual_grant',
  'Manual digital product access'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.digital_entitlements
  WHERE lower(email) = 'susiebonner23@gmail.com'
    AND product_slug = 'palette-plotting-guide'
    AND revoked_at IS NULL
);

-- Manual support access for digital product testing (palette-plotting-guide).
INSERT INTO public.digital_entitlements (email, product_slug, source, notes)
SELECT
  'support@paletteplot.com',
  'palette-plotting-guide',
  'manual_support',
  'Digital product support access'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.digital_entitlements
  WHERE lower(email) = 'support@paletteplot.com'
    AND product_slug = 'palette-plotting-guide'
    AND revoked_at IS NULL
);
