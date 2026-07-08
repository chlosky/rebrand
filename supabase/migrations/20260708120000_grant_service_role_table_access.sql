-- 20260704130000 granted PostgREST table privileges to anon/authenticated but omitted service_role.
-- Edge functions (create/update/get/claim-onboarding-session, etc.) connect as service_role, and
-- BYPASSRLS only skips RLS policies -- it does NOT waive table-level GRANTs. Without these grants,
-- service-role writes fail with "permission denied for table onboarding_sessions".

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;
