-- Dev/staging support login: support@test.com / Test!123
-- Paid (active monthly) with onboarding preferences filled. No starter provisioning.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $seed$
DECLARE
  v_email text := 'support@test.com';
  v_password text := 'Test!123';
  v_user_id uuid;
  v_session_id uuid;
  v_workspace_id uuid;
  v_setup_path jsonb := jsonb_build_object(
    'first_name', 'Support',
    'email', v_email,
    'desire_category', 'Self & Direction',
    'desire_text', null,
    'why_it_matters', null,
    'current_friction', 'I keep restarting instead of finishing one board system.',
    'desired_identity', null,
    'tool_preferences', jsonb_build_array('daily_wins_progress'),
    'conditional_specificity', jsonb_build_object(
      'schema_version', 1,
      'category', 'Self & Direction',
      'branch', 'step7_options',
      'step7', jsonb_build_object(
        'selection', 'Confidence',
        'customText', null
      )
    ),
    'shell_appearance', 'light',
    'embody_active_practices', jsonb_build_array(
      'glam-up', 'work', 'self-care', 'drink-water', 'rest'
    ),
    'board_starter_template_slug', 'four-board-rebrand',
    'starting_system', 'life_rebranding',
    'home_focus_key', null,
    'office_planning_system', null,
    'moodboard_focus_key', null
  );
  v_onboarding_answers jsonb := jsonb_build_object(
    'setup_path_v1', v_setup_path,
    'setup_journey_v1', jsonb_build_object(
      'schema_version', 1,
      'updated_at', now(),
      'desire_category', 'Self & Direction',
      'desire_categories', jsonb_build_array('Self & Direction', 'Career & Money', 'Home & Space'),
      'first_name', 'Support',
      'email', v_email,
      'current_friction', 'I keep restarting instead of finishing one board system.',
      'tool_preferences', jsonb_build_array('daily_wins_progress'),
      'shell_appearance', 'light',
      'embody_active_practices', jsonb_build_array(
        'glam-up', 'work', 'self-care', 'drink-water', 'rest'
      ),
      'conditional_specificity', v_setup_path->'conditional_specificity',
      'routine_intensity', 'consistent',
      'routine_items', jsonb_build_array(
        jsonb_build_object('slug', 'boards_review', 'label', 'Board review', 'cadence', 'daily', 'target_per_week', 7),
        jsonb_build_object('slug', 'journal_entry', 'label', 'Journal check-in', 'cadence', 'daily', 'target_per_week', 5)
      ),
      'routine_notification_times', jsonb_build_array('09:00', '20:00'),
      'notification_permission_status', 'granted',
      'starting_system', 'life_rebranding',
      'board_starter_template_slug', 'four-board-rebrand',
      'attribution_source', 'instagram'
    )
  );
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(v_email) LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name', 'Support'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    username,
    first_name,
    preferred_locale,
    routine_intensity,
    routine_items,
    routine_notification_times,
    notification_permission_status,
    app_notifications_enabled,
    timezone,
    updated_at
  ) VALUES (
    v_user_id,
    v_email,
    v_email,
    'Support',
    'en',
    'consistent',
    v_onboarding_answers->'setup_journey_v1'->'routine_items',
    to_jsonb(array['09:00', '20:00']::text[]),
    'granted',
    true,
    'America/Chicago',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    username = excluded.username,
    first_name = excluded.first_name,
    preferred_locale = excluded.preferred_locale,
    routine_intensity = excluded.routine_intensity,
    routine_items = excluded.routine_items,
    routine_notification_times = excluded.routine_notification_times,
    notification_permission_status = excluded.notification_permission_status,
    app_notifications_enabled = excluded.app_notifications_enabled,
    timezone = excluded.timezone,
    updated_at = now();

  INSERT INTO public.user_preferences (
    user_id,
    first_name,
    preferred_locale,
    routine_intensity,
    routine_items,
    routine_notification_times,
    notification_permission_status,
    app_notifications_enabled,
    timezone,
    embody_active_practices,
    texts_enabled,
    updated_at
  ) VALUES (
    v_user_id,
    'Support',
    'en',
    'consistent',
    v_onboarding_answers->'setup_journey_v1'->'routine_items',
    to_jsonb(array['09:00', '20:00']::text[]),
    'granted',
    true,
    'America/Chicago',
    array['glam-up', 'work', 'self-care', 'drink-water', 'rest']::text[],
    true,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = excluded.first_name,
    preferred_locale = excluded.preferred_locale,
    routine_intensity = excluded.routine_intensity,
    routine_items = excluded.routine_items,
    routine_notification_times = excluded.routine_notification_times,
    notification_permission_status = excluded.notification_permission_status,
    app_notifications_enabled = excluded.app_notifications_enabled,
    timezone = excluded.timezone,
    embody_active_practices = excluded.embody_active_practices,
    updated_at = now();

  INSERT INTO public.user_setup_path (
    user_id,
    first_name,
    email,
    desire_category,
    current_friction,
    tool_preferences,
    conditional_specificity,
    embody_active_practices,
    updated_at
  ) VALUES (
    v_user_id,
    'Support',
    v_email,
    'Self & Direction',
    'I keep restarting instead of finishing one board system.',
    array['daily_wins_progress']::text[],
    v_setup_path->'conditional_specificity',
    array['glam-up', 'work', 'self-care', 'drink-water', 'rest']::text[],
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = excluded.first_name,
    email = excluded.email,
    desire_category = excluded.desire_category,
    current_friction = excluded.current_friction,
    tool_preferences = excluded.tool_preferences,
    conditional_specificity = excluded.conditional_specificity,
    embody_active_practices = excluded.embody_active_practices,
    updated_at = now();

  INSERT INTO public.user_plans (
    user_id,
    tier,
    status,
    billing_period,
    last_payment_source,
    first_payment_source,
    current_period_end,
    starter_provisioned,
    on_trial,
    had_trial,
    updated_at
  ) VALUES (
    v_user_id,
    'monthly',
    'active',
    'monthly',
    'stripe',
    'stripe',
    now() + interval '1 year',
    true,
    false,
    false,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = excluded.tier,
    status = excluded.status,
    billing_period = excluded.billing_period,
    last_payment_source = excluded.last_payment_source,
    first_payment_source = coalesce(public.user_plans.first_payment_source, excluded.first_payment_source),
    current_period_end = excluded.current_period_end,
    starter_provisioned = true,
    on_trial = false,
    updated_at = now();

  SELECT id INTO v_session_id
  FROM public.onboarding_sessions
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_session_id IS NULL THEN
    v_session_id := gen_random_uuid();
    INSERT INTO public.onboarding_sessions (
      id,
      resume_token_hash,
      status,
      email,
      first_name,
      username,
      email_consent,
      app_notifications_consent,
      onboarding_answers,
      selected_tier,
      billing,
      paid_at,
      user_id,
      revenuecat_app_user_id,
      shell_appearance,
      created_at,
      updated_at
    ) VALUES (
      v_session_id,
      encode(extensions.digest('support-test-seed', 'sha256'), 'hex'),
      'active',
      v_email,
      'Support',
      v_email,
      true,
      true,
      v_onboarding_answers,
      'monthly',
      'monthly',
      now(),
      v_user_id,
      v_user_id::text,
      'light',
      now(),
      now()
    );
  ELSE
    UPDATE public.onboarding_sessions
    SET
      status = 'active',
      email = v_email,
      first_name = 'Support',
      username = v_email,
      email_consent = true,
      app_notifications_consent = true,
      onboarding_answers = v_onboarding_answers,
      selected_tier = 'monthly',
      billing = 'monthly',
      paid_at = coalesce(paid_at, now()),
      user_id = v_user_id,
      revenuecat_app_user_id = v_user_id::text,
      shell_appearance = 'light',
      updated_at = now()
    WHERE id = v_session_id;
  END IF;

  -- Demo board workspace (four-board rebrand) so login lands in the real tool UI.
  IF NOT EXISTS (SELECT 1 FROM public.board_workspaces WHERE user_id = v_user_id) THEN
    INSERT INTO public.board_workspaces (user_id, name, preset_slug)
    VALUES (v_user_id, 'Vision Board + Plan', 'four-board-rebrand')
    RETURNING id INTO v_workspace_id;

    INSERT INTO public.boards (workspace_id, user_id, title, role, color_key, sort_order, layout_mode, layout_json)
    VALUES
      (v_workspace_id, v_user_id, 'Vision 1', 'focus', 'rose_gold', 0, 'vision', '{}'::jsonb),
      (v_workspace_id, v_user_id, 'Vision 2', 'focus', 'blue', 1, 'vision', '{}'::jsonb),
      (v_workspace_id, v_user_id, 'Vision 3', 'focus', 'light_pink', 2, 'vision', '{}'::jsonb),
      (v_workspace_id, v_user_id, 'The Plan', 'plan', 'white_opaque', 3, 'vision', '{}'::jsonb);
  END IF;
END
$seed$;
