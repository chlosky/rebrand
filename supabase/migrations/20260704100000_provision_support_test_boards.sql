-- Ensure support@test.com has a demo board workspace (idempotent).

DO $provision$
DECLARE
  v_email text := 'support@test.com';
  v_user_id uuid;
  v_workspace_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'support@test.com not found — run seed migration first';
    RETURN;
  END IF;

  UPDATE public.user_plans
  SET starter_provisioned = true, updated_at = now()
  WHERE user_id = v_user_id;

  IF EXISTS (SELECT 1 FROM public.board_workspaces WHERE user_id = v_user_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.board_workspaces (user_id, name, preset_slug)
  VALUES (v_user_id, 'Three Focus Boards and The Plan', 'four-board-rebrand')
  RETURNING id INTO v_workspace_id;

  INSERT INTO public.boards (workspace_id, user_id, title, role, color_key, sort_order, layout_mode, layout_json)
  VALUES
    (v_workspace_id, v_user_id, 'Focus Board 1', 'focus', 'rose_gold', 0, 'vision', '{}'::jsonb),
    (v_workspace_id, v_user_id, 'Focus Board 2', 'focus', 'blue', 1, 'vision', '{}'::jsonb),
    (v_workspace_id, v_user_id, 'Focus Board 3', 'focus', 'light_pink', 2, 'vision', '{}'::jsonb),
    (v_workspace_id, v_user_id, 'The Plan', 'plan', 'white_opaque', 3, 'vision', '{}'::jsonb);
END
$provision$;
