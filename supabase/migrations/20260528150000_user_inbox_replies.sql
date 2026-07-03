-- User-facing inbox: read own cases, reply on existing cases, mark read.

CREATE POLICY "support_cases_select_own"
  ON public.support_cases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "support_cases_update_own_user_unread"
  ON public.support_cases
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "inbox_messages_insert_own"
  ON public.inbox_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender = 'user'
    AND EXISTS (
      SELECT 1 FROM public.inbox_threads t
      WHERE t.id = inbox_messages.thread_id
        AND t.user_id = auth.uid()
    )
    AND (
      inbox_messages.case_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.support_cases c
        WHERE c.id = inbox_messages.case_id
          AND c.user_id = auth.uid()
      )
    )
  );

CREATE OR REPLACE FUNCTION public.bump_support_case_on_user_inbox_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender = 'user' AND NEW.case_id IS NOT NULL THEN
    UPDATE public.support_cases
    SET
      admin_unread = true,
      latest_message_preview = left(NEW.body_text, 240),
      updated_at = now()
    WHERE id = NEW.case_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inbox_messages_user_case_bump ON public.inbox_messages;
CREATE TRIGGER trg_inbox_messages_user_case_bump
  AFTER INSERT ON public.inbox_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_support_case_on_user_inbox_message();
