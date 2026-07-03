-- Allow Help Me Create as its own submission_type (not feature_request).

ALTER TABLE public.app_support_reports
  DROP CONSTRAINT IF EXISTS app_support_reports_submission_type_check;

ALTER TABLE public.app_support_reports
  ADD CONSTRAINT app_support_reports_submission_type_check
  CHECK (submission_type IN ('report', 'ai_flag', 'feature_request', 'help_me_create'));
