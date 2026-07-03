-- Backfill user_plans.first_name, username, phone from profiles where user_plans is missing them.
-- Idempotent: only fills in NULL/empty; does not overwrite existing values.

UPDATE public.user_plans up
SET
  first_name = COALESCE(NULLIF(TRIM(up.first_name), ''), p.first_name),
  username   = COALESCE(NULLIF(TRIM(up.username), ''), p.username),
  phone      = COALESCE(NULLIF(TRIM(up.phone), ''), p.phone)
FROM public.profiles p
WHERE up.user_id = p.id
  AND (
    (p.first_name IS NOT NULL AND p.first_name <> '')
    OR (p.username IS NOT NULL AND p.username <> '')
    OR (p.phone IS NOT NULL AND p.phone <> '')
  );
