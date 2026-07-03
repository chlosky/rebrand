-- Create app_support_reports rows for support_cases that have no linked report
-- (e.g. inbox/case mirror succeeded before report was visible to admins, or report_id was cleared).

DO $$
DECLARE
  c RECORD;
  new_id uuid;
  st text;
BEGIN
  FOR c IN
    SELECT sc.*
    FROM public.support_cases sc
    LEFT JOIN public.app_support_reports ar ON ar.id = sc.report_id
    WHERE sc.report_id IS NULL OR ar.id IS NULL
    ORDER BY sc.created_at ASC
  LOOP
    st := COALESCE(NULLIF(trim(c.submission_type), ''), '');
    IF st NOT IN ('report', 'ai_flag', 'feature_request', 'help_me_create') THEN
      st := CASE
        WHEN c.message_type = 'help_me_create' THEN 'help_me_create'
        ELSE 'feature_request'
      END;
    END IF;

    INSERT INTO public.app_support_reports (
      user_id,
      user_email,
      submission_type,
      tool_value,
      tool_label,
      description,
      attachment_storage_paths,
      created_at
    )
    VALUES (
      c.user_id,
      COALESCE(NULLIF(trim(c.user_email), ''), '(unknown)'),
      st,
      COALESCE(NULLIF(trim(c.tool_or_area), ''), 'unknown'),
      COALESCE(NULLIF(trim(c.tool_label), ''), 'Unknown'),
      COALESCE(c.original_submission_text, ''),
      COALESCE(c.attachment_storage_paths, '{}'::text[]),
      c.created_at
    )
    RETURNING id INTO new_id;

    UPDATE public.support_cases
    SET report_id = new_id
    WHERE id = c.id;
  END LOOP;
END $$;
