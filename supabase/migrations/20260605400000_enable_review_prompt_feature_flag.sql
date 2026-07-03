-- Re-enable iOS App Store in-app review prompt (server-controlled via feature_flags).
UPDATE public.feature_flags
SET is_enabled = true
WHERE feature_name = 'review_prompt';
