-- Boards-forward product baseline schema (fresh Supabase project).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.board_role AS ENUM ('focus', 'plan');
CREATE TYPE public.onboarding_session_status AS ENUM (
  'started',
  'checkout_created',
  'paid',
  'account_created',
  'active'
);

-- ---------------------------------------------------------------------------
-- Shared functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_active_plotting_subscription(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_plans up
    WHERE up.user_id = check_user_id
      AND up.status = 'active'
      AND (up.current_period_end IS NULL OR up.current_period_end > now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_active_plotting_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_plotting_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_plotting_subscription(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_plans_set_first_payment_source()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.first_payment_source IS NULL AND NEW.last_payment_source IS NOT NULL THEN
    NEW.first_payment_source := NEW.last_payment_source;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_brevo_welcome()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.welcome_email_sent_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.user_plan_brevo_welcome_queue (user_id, send_after)
  VALUES (NEW.user_id, now() + interval '1 minute')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_brevo_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.brevo_cancellation_list_synced_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM 'canceled' THEN
    RETURN NEW;
  END IF;
  IF OLD.status IS NOT DISTINCT FROM 'canceled' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.user_plan_brevo_cancellation_queue (user_id, send_after)
  VALUES (NEW.user_id, now() + interval '1 minute')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(trim(email)) = lower(trim(check_email))
      AND confirmed_at IS NOT NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_username_exists(check_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(trim(username)) = lower(trim(check_username))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email
  INTO user_email
  FROM public.profiles
  WHERE lower(trim(username)) = lower(trim(lookup_username))
  LIMIT 1;
  RETURN user_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_web_onboarding_session_user(
  p_client_visit_id text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.web_onboarding_sessions
  SET user_id = p_user_id
  WHERE client_visit_id = p_client_visit_id
    AND user_id IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_web_onboarding_make_my_board_cta_clicked(
  p_client_visit_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.web_onboarding_sessions (
    client_visit_id,
    entry_path,
    make_my_board_cta_clicked
  )
  VALUES (
    p_client_visit_id,
    '/onboarding/welcome',
    true
  )
  ON CONFLICT (client_visit_id) DO UPDATE
  SET make_my_board_cta_clicked = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_exists(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.link_web_onboarding_session_user(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_web_onboarding_session_user(text, uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_web_onboarding_make_my_board_cta_clicked(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_web_onboarding_make_my_board_cta_clicked(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Auth roles
-- ---------------------------------------------------------------------------

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- ---------------------------------------------------------------------------
-- Profiles & preferences
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  username text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  onboarding_answers jsonb DEFAULT '{}'::jsonb,
  preset_theme text DEFAULT 'command'
    CHECK (preset_theme IN ('command', 'glow', 'volt', 'ground')),
  onboarding_data jsonb DEFAULT '{}'::jsonb,
  first_name text,
  signup_code text,
  avatar_url text,
  email_verified_at timestamptz,
  routine_intensity text
    CHECK (routine_intensity IN ('light', 'consistent', 'locked_in')),
  routine_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notification_permission_status text
    CHECK (notification_permission_status IN ('granted', 'denied', 'skipped')),
  app_notifications_enabled boolean NOT NULL DEFAULT false,
  routine_notification_times jsonb NOT NULL DEFAULT '[]'::jsonb,
  timezone text,
  preferred_locale text
);

CREATE UNIQUE INDEX profiles_username_unique_idx
  ON public.profiles (lower(trim(username)))
  WHERE username IS NOT NULL;

CREATE UNIQUE INDEX profiles_email_unique_idx
  ON public.profiles (lower(trim(email)))
  WHERE email IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile or admins can view all"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = profiles.id
    OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Users can update their own profile or admins can update all"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = profiles.id
    OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = profiles.id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = profiles.id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_marketing boolean DEFAULT false,
  texts_enabled boolean DEFAULT true,
  preferred_send_window text
    CHECK (preferred_send_window IN ('morning', 'evening', 'both')) DEFAULT 'both',
  timezone text DEFAULT 'America/New_York',
  phone text,
  preset_theme text,
  avatar_url text,
  first_name text,
  last_name text,
  tutorial_completed jsonb DEFAULT '{}'::jsonb,
  tutorial_last_slide integer DEFAULT 0,
  marketing_sms_enabled boolean DEFAULT false,
  data_training_opt_in boolean NOT NULL DEFAULT false,
  weekly_goals_sms boolean DEFAULT false,
  weekly_checkin_enabled boolean DEFAULT false,
  first_tutorial_shown boolean DEFAULT false,
  app_notifications_enabled boolean NOT NULL DEFAULT false,
  embody_active_practices text[],
  routine_intensity text
    CHECK (routine_intensity IN ('light', 'consistent', 'locked_in')),
  routine_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notification_permission_status text
    CHECK (notification_permission_status IN ('granted', 'denied', 'skipped')),
  routine_notification_times jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_locale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Billing & onboarding
-- ---------------------------------------------------------------------------

CREATE TABLE public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  current_period_end timestamptz,
  billing_period text,
  first_payment_source text,
  last_payment_source text,
  stripe_customer_id_official text,
  apple_customer_id text,
  google_play_customer_id text,
  had_trial boolean NOT NULL DEFAULT false,
  welcome_email_sent_at timestamptz,
  on_trial boolean NOT NULL DEFAULT false,
  starter_provisioned boolean NOT NULL DEFAULT false,
  brevo_cancellation_list_synced_at timestamptz,
  review_prompt_attempted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_plans_tier_check
    CHECK (tier IN ('monthly', 'annual', 'basic', 'plus', 'premium')),
  CONSTRAINT user_plans_billing_period_check
    CHECK (billing_period IS NULL OR billing_period IN ('monthly', 'annual', 'weekly')),
  CONSTRAINT user_plans_first_payment_source_check
    CHECK (first_payment_source IS NULL OR first_payment_source IN ('stripe', 'apple', 'google_play')),
  CONSTRAINT user_plans_last_payment_source_check
    CHECK (last_payment_source IS NULL OR last_payment_source IN ('stripe', 'apple', 'google_play'))
);

CREATE INDEX idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX idx_user_plans_tier ON public.user_plans(tier);
CREATE INDEX idx_user_plans_stripe_customer_id ON public.user_plans(stripe_customer_id);
CREATE INDEX idx_user_plans_stripe_subscription_id ON public.user_plans(stripe_subscription_id);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plan or admins can view all"
  ON public.user_plans FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Users can update their own plan or admins can update all"
  ON public.user_plans FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete all plans"
  ON public.user_plans FOR DELETE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can create user plans"
  ON public.user_plans FOR INSERT TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_user_plans_first_payment_source
  BEFORE INSERT OR UPDATE ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.user_plans_set_first_payment_source();

CREATE TRIGGER on_user_plans_insert_brevo_welcome
  AFTER INSERT ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_user_plan_brevo_welcome();

CREATE TRIGGER on_user_plans_update_brevo_cancellation
  AFTER UPDATE OF status ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_user_plan_brevo_cancellation();

CREATE TABLE public.user_plan_brevo_welcome_queue (
  user_id uuid PRIMARY KEY REFERENCES public.user_plans(user_id) ON DELETE CASCADE,
  send_after timestamptz NOT NULL,
  preferred_locale text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_plan_brevo_welcome_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_plan_brevo_welcome_queue FROM anon, authenticated;
GRANT ALL ON public.user_plan_brevo_welcome_queue TO service_role;

CREATE TABLE public.user_plan_brevo_cancellation_queue (
  user_id uuid PRIMARY KEY REFERENCES public.user_plans(user_id) ON DELETE CASCADE,
  send_after timestamptz NOT NULL,
  preferred_locale text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_plan_brevo_cancellation_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_plan_brevo_cancellation_queue FROM anon, authenticated;
GRANT ALL ON public.user_plan_brevo_cancellation_queue TO service_role;

CREATE TABLE public.onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_token_hash text NOT NULL,
  status public.onboarding_session_status NOT NULL DEFAULT 'started',
  email text,
  first_name text,
  username text,
  email_consent boolean DEFAULT false,
  sms_consent boolean DEFAULT false,
  onboarding_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_tier text,
  billing text,
  stripe_checkout_session_id text UNIQUE,
  stripe_customer_id text,
  stripe_customer_email text,
  stripe_subscription_id text,
  paid_at timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  app_notifications_consent boolean DEFAULT false,
  shell_appearance text,
  tracking_pre_permission_choice text,
  tracking_authorization_status text,
  tracking_permission_asked_at timestamptz,
  first_touch_source text,
  first_touch_medium text,
  first_touch_campaign text,
  first_touch_content text,
  first_touch_term text,
  first_touch_ad_id text,
  first_touch_adset_id text,
  first_touch_campaign_id text,
  first_touch_creative_id text,
  first_touch_click_id_type text,
  first_touch_click_id_value text,
  first_touch_referrer text,
  first_touch_landing_page text,
  first_touch_at timestamptz,
  last_touch_source text,
  last_touch_medium text,
  last_touch_campaign text,
  last_touch_content text,
  last_touch_term text,
  last_touch_ad_id text,
  last_touch_adset_id text,
  last_touch_campaign_id text,
  last_touch_creative_id text,
  last_touch_click_id_type text,
  last_touch_click_id_value text,
  last_touch_referrer text,
  last_touch_landing_page text,
  last_touch_at timestamptz,
  attribution_payload jsonb,
  revenuecat_app_user_id text,
  revenuecat_attributes_synced_at timestamptz,
  paywall_id text,
  paywall_variant text,
  offering_id text,
  package_id text,
  product_id text,
  CONSTRAINT onboarding_sessions_selected_tier_check
    CHECK (selected_tier IS NULL OR selected_tier IN ('monthly', 'annual')),
  CONSTRAINT onboarding_sessions_billing_check
    CHECK (billing IS NULL OR billing IN ('monthly', 'annual', 'weekly'))
);

CREATE INDEX idx_onboarding_sessions_user_id ON public.onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_status ON public.onboarding_sessions(status);
CREATE INDEX idx_onboarding_sessions_stripe_customer_id ON public.onboarding_sessions(stripe_customer_id);
CREATE INDEX idx_onboarding_sessions_expires_at ON public.onboarding_sessions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_onboarding_sessions_revenuecat_app_user_id ON public.onboarding_sessions(revenuecat_app_user_id) WHERE revenuecat_app_user_id IS NOT NULL;
CREATE INDEX idx_onboarding_sessions_first_touch_source ON public.onboarding_sessions(first_touch_source) WHERE first_touch_source IS NOT NULL;

ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_onboarding_sessions_updated_at
  BEFORE UPDATE ON public.onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.onboarding_session_setup (
  onboarding_session_id uuid PRIMARY KEY REFERENCES public.onboarding_sessions(id) ON DELETE CASCADE,
  first_name text,
  email text,
  desire_category text,
  desire_text text,
  why_it_matters text,
  current_friction text,
  desired_identity text,
  tool_preferences text[] NOT NULL DEFAULT '{}',
  conditional_specificity jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_session_setup_updated
  ON public.onboarding_session_setup(updated_at DESC);

ALTER TABLE public.onboarding_session_setup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access onboarding_session_setup"
  ON public.onboarding_session_setup FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_onboarding_session_setup_updated
  BEFORE UPDATE ON public.onboarding_session_setup
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.user_setup_path (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  email text,
  desire_category text,
  desire_text text,
  why_it_matters text,
  current_friction text,
  desired_identity text,
  tool_preferences text[] NOT NULL DEFAULT '{}',
  conditional_specificity jsonb NOT NULL DEFAULT '{}'::jsonb,
  post_paywall_provisioned_at timestamptz,
  embody_active_practices text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_setup_path_updated ON public.user_setup_path(updated_at DESC);

ALTER TABLE public.user_setup_path ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own setup path"
  ON public.user_setup_path FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users insert own setup path"
  ON public.user_setup_path FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users update own setup path"
  ON public.user_setup_path FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE TRIGGER trg_user_setup_path_updated
  BEFORE UPDATE ON public.user_setup_path
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.web_onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_visit_id text NOT NULL,
  entry_path text NOT NULL DEFAULT '/onboarding/welcome',
  page_path text,
  referrer text,
  is_mobile_viewport boolean,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  is_paid boolean,
  from_tiktok boolean,
  user_agent text,
  make_my_board_cta_clicked boolean NOT NULL DEFAULT false,
  ttclid text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fast_path jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX web_onboarding_sessions_client_visit_id_idx
  ON public.web_onboarding_sessions(client_visit_id);

CREATE INDEX web_onboarding_sessions_created_at_idx
  ON public.web_onboarding_sessions(created_at DESC);

CREATE INDEX web_onboarding_sessions_user_id_created_at_idx
  ON public.web_onboarding_sessions(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.web_onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous web onboarding session inserts"
  ON public.web_onboarding_sessions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE TABLE public.email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_email_verification_tokens_token_hash ON public.email_verification_tokens(token_hash);
CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Boards (core product)
-- ---------------------------------------------------------------------------

CREATE TABLE public.board_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My board system',
  preset_slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX board_workspaces_user_id_idx ON public.board_workspaces(user_id);

ALTER TABLE public.board_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_workspaces_select_pro" ON public.board_workspaces
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_workspaces_insert_pro" ON public.board_workspaces
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_workspaces_update_pro" ON public.board_workspaces
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_workspaces_delete_pro" ON public.board_workspaces
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE TRIGGER trg_board_workspaces_updated
  BEFORE UPDATE ON public.board_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.board_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  role public.board_role NOT NULL DEFAULT 'focus',
  color_key text NOT NULL DEFAULT 'light_pink',
  sort_order int NOT NULL DEFAULT 0,
  layout_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  artboard_width int NOT NULL DEFAULT 1080,
  artboard_height int NOT NULL DEFAULT 1350,
  layout_mode text NOT NULL DEFAULT 'vision',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX boards_workspace_sort_idx ON public.boards(workspace_id, sort_order);
CREATE INDEX boards_user_id_idx ON public.boards(user_id);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boards_select_pro" ON public.boards
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "boards_insert_pro" ON public.boards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "boards_update_pro" ON public.boards
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "boards_delete_pro" ON public.boards
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE TRIGGER trg_boards_updated
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.board_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  remind_at timestamptz NOT NULL,
  timezone text,
  channels text[] NOT NULL DEFAULT ARRAY['email']::text[],
  source text NOT NULL DEFAULT 'user'
    CHECK (source IN ('user', 'ai_extracted', 'plan_item')),
  fabric_object_id text,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
  ical_uid text,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX board_reminders_due_idx
  ON public.board_reminders(status, remind_at)
  WHERE status = 'scheduled';

CREATE INDEX board_reminders_user_idx ON public.board_reminders(user_id);

ALTER TABLE public.board_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_reminders_select_pro" ON public.board_reminders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_reminders_insert_pro" ON public.board_reminders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_reminders_update_pro" ON public.board_reminders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_reminders_delete_pro" ON public.board_reminders
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE TRIGGER trg_board_reminders_updated
  BEFORE UPDATE ON public.board_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.board_reminder_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL REFERENCES public.board_reminders(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL,
  provider_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_reminder_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_reminder_deliveries_select_own" ON public.board_reminder_deliveries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.board_reminders r
    WHERE r.id = reminder_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "board_reminder_deliveries_service" ON public.board_reminder_deliveries
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Journal & daily progress (boards-adjacent)
-- ---------------------------------------------------------------------------

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  entry_time timestamptz NOT NULL DEFAULT now(),
  entry_text text NOT NULL,
  title text,
  photo_url text,
  location_name text,
  location_type text,
  latitude numeric,
  longitude numeric,
  has_wins boolean,
  journal_env_3d_rating text
    CHECK (journal_env_3d_rating IS NULL OR journal_env_3d_rating IN ('negative', 'neutral', 'positive')),
  journal_day_experience_rating text
    CHECK (
      journal_day_experience_rating IS NULL
      OR journal_day_experience_rating IN ('negative', 'neutral', 'positive')
    ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_entries_user_date ON public.journal_entries(user_id, entry_date DESC);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal entries"
  ON public.journal_entries FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own journal entries"
  ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON public.journal_entries FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON public.journal_entries FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.user_daily_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_date date NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, progress_date)
);

CREATE INDEX idx_user_daily_progress_user_date
  ON public.user_daily_progress(user_id, progress_date DESC);

ALTER TABLE public.user_daily_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily progress"
  ON public.user_daily_progress FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own daily progress"
  ON public.user_daily_progress FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own daily progress"
  ON public.user_daily_progress FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own daily progress"
  ON public.user_daily_progress FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER update_user_daily_progress_updated_at
  BEFORE UPDATE ON public.user_daily_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.user_action_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_date date NOT NULL,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action_date)
);

CREATE INDEX idx_user_action_history_user_date
  ON public.user_action_history(user_id, action_date DESC);

ALTER TABLE public.user_action_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own action history"
  ON public.user_action_history FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own action history"
  ON public.user_action_history FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own action history"
  ON public.user_action_history FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own action history"
  ON public.user_action_history FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE TRIGGER update_user_action_history_updated_at
  BEFORE UPDATE ON public.user_action_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.weekly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  goal_text text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start_date, goal_text),
  CONSTRAINT weekly_goals_category_check
    CHECK (category IS NULL OR category IN (
      'Self & Direction',
      'Career & Money',
      'Love & Relationships',
      'Home & Space',
      'Beauty & Wellness',
      'Travel & Adventure',
      'Organization & Plan',
      'Aesthetic & Mood',
      'College & School',
      'Health & Fitness'
    ))
);

CREATE INDEX idx_weekly_goals_user_week ON public.weekly_goals(user_id, week_start_date DESC);

ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly goals"
  ON public.weekly_goals FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own weekly goals"
  ON public.weekly_goals FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own weekly goals"
  ON public.weekly_goals FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own weekly goals"
  ON public.weekly_goals FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role can view all weekly goals"
  ON public.weekly_goals FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can insert weekly goals"
  ON public.weekly_goals FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update weekly goals"
  ON public.weekly_goals FOR UPDATE TO service_role USING (true);

CREATE POLICY "Service role can delete weekly goals"
  ON public.weekly_goals FOR DELETE TO service_role USING (true);

-- ---------------------------------------------------------------------------
-- Community
-- ---------------------------------------------------------------------------

CREATE TABLE public.community_daily_prompts (
  category text NOT NULL
    CHECK (category IN ('vision_board_rebrand', 'moodboard', 'home_organization', 'office_organization')),
  day_index int NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  prompt_text text NOT NULL,
  PRIMARY KEY (category, day_index)
);

ALTER TABLE public.community_daily_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_daily_prompts_select_auth"
  ON public.community_daily_prompts FOR SELECT TO authenticated
  USING (true);

CREATE TABLE public.community_feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  body_text text NOT NULL CHECK (char_length(body_text) >= 1 AND char_length(body_text) <= 4000),
  image_path text,
  post_kind text NOT NULL DEFAULT 'announcement'
    CHECK (post_kind IN ('announcement', 'featured_setup', 'poll_winner', 'tip')),
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'vision_board', 'moodboard', 'home_org', 'office_org')),
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_feed_published
  ON public.community_feed_posts (published, published_at DESC);

ALTER TABLE public.community_feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_feed_select_published"
  ON public.community_feed_posts FOR SELECT TO authenticated
  USING (published = true);

CREATE TABLE public.community_setup_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL
    CHECK (category IN ('vision_board_rebrand', 'moodboard', 'home_organization', 'office_organization')),
  setup_medium text NOT NULL DEFAULT 'off_app'
    CHECK (setup_medium IN ('in_app', 'off_app', 'both')),
  title text CHECK (title IS NULL OR char_length(title) <= 120),
  body_text text NOT NULL CHECK (char_length(body_text) >= 10 AND char_length(body_text) <= 2000),
  image_paths text[] NOT NULL DEFAULT '{}',
  feature_opt_in boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'featured', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_setup_submissions_images_max CHECK (cardinality(image_paths) <= 3)
);

CREATE INDEX idx_community_submissions_user
  ON public.community_setup_submissions (user_id, created_at DESC);

CREATE INDEX idx_community_submissions_status
  ON public.community_setup_submissions (status, created_at DESC);

ALTER TABLE public.community_setup_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_submissions_insert_own"
  ON public.community_setup_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "community_submissions_select_own"
  ON public.community_setup_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE public.community_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) <= 200),
  description text,
  reward_note text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_polls_select_active"
  ON public.community_polls FOR SELECT TO authenticated
  USING (status IN ('active', 'closed'));

CREATE TABLE public.community_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.community_setup_submissions(id) ON DELETE SET NULL,
  label text NOT NULL CHECK (char_length(label) <= 120),
  image_path text,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_poll_options_select"
  ON public.community_poll_options FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.community_polls p
    WHERE p.id = poll_id AND p.status IN ('active', 'closed')
  ));

CREATE TABLE public.community_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.community_poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);

CREATE INDEX idx_community_poll_votes_poll ON public.community_poll_votes(poll_id);

ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_poll_votes_insert_own"
  ON public.community_poll_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_poll_votes_select_own"
  ON public.community_poll_votes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "community_poll_votes_select_tallies"
  ON public.community_poll_votes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.community_polls p
    WHERE p.id = poll_id AND p.status IN ('active', 'closed')
  ));

CREATE TABLE public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_select_self"
  ON public.admin_users FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admin_users_insert_none"
  ON public.admin_users FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "admin_users_update_none"
  ON public.admin_users FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "admin_users_delete_none"
  ON public.admin_users FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "community_feed_admin_all"
  ON public.community_feed_posts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "community_submissions_admin_all"
  ON public.community_setup_submissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "community_polls_admin_all"
  ON public.community_polls FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "community_poll_options_admin_all"
  ON public.community_poll_options FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Support & inbox
-- ---------------------------------------------------------------------------

CREATE TABLE public.app_support_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_first_name text,
  submission_type text NOT NULL
    CHECK (submission_type IN ('report', 'ai_flag', 'feature_request', 'help_me_create')),
  tool_value text NOT NULL,
  tool_label text NOT NULL,
  description text NOT NULL,
  attachment_storage_paths text[] NOT NULL DEFAULT '{}',
  billing_purchase_channel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_support_reports_billing_purchase_channel_check CHECK (
    billing_purchase_channel IS NULL
    OR billing_purchase_channel IN ('apple_app_store', 'google_play', 'web')
  )
);

CREATE INDEX idx_app_support_reports_user_id ON public.app_support_reports(user_id);
CREATE INDEX idx_app_support_reports_created_at ON public.app_support_reports(created_at DESC);

ALTER TABLE public.app_support_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_support_reports_insert_own"
  ON public.app_support_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "app_support_reports_select_own"
  ON public.app_support_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "app_support_reports_select_admin"
  ON public.app_support_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE TABLE public.inbox_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('help_me_create', 'support_report', 'other')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  subject text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inbox_threads_user_id ON public.inbox_threads(user_id);
CREATE INDEX idx_inbox_threads_last_message_at ON public.inbox_threads(last_message_at DESC NULLS LAST);
CREATE INDEX idx_inbox_threads_updated_at ON public.inbox_threads(updated_at DESC);
CREATE UNIQUE INDEX uniq_inbox_threads_user_id ON public.inbox_threads(user_id);

ALTER TABLE public.inbox_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbox_threads_select_own"
  ON public.inbox_threads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "inbox_threads_select_admin"
  ON public.inbox_threads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_threads_insert_admin"
  ON public.inbox_threads FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_threads_update_admin"
  ON public.inbox_threads FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_threads_delete_admin"
  ON public.inbox_threads FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE TRIGGER update_inbox_threads_updated_at
  BEFORE UPDATE ON public.inbox_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL DEFAULT '',
  user_first_name text,
  message_type text NOT NULL CHECK (message_type IN ('help_me_create', 'app_support_feedback')),
  submission_type text,
  tool_or_area text,
  tool_label text,
  subject text NOT NULL DEFAULT '',
  original_submission_text text NOT NULL DEFAULT '',
  latest_message_preview text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  admin_unread boolean NOT NULL DEFAULT true,
  user_unread boolean NOT NULL DEFAULT false,
  attachment_storage_paths text[] NOT NULL DEFAULT '{}',
  report_id uuid REFERENCES public.app_support_reports(id) ON DELETE SET NULL,
  thread_id uuid REFERENCES public.inbox_threads(id) ON DELETE SET NULL,
  closed_at timestamptz,
  closed_by_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_cases_user_id ON public.support_cases(user_id);
CREATE INDEX idx_support_cases_status ON public.support_cases(status);
CREATE INDEX idx_support_cases_updated_at ON public.support_cases(updated_at DESC);
CREATE INDEX idx_support_cases_admin_unread ON public.support_cases(admin_unread) WHERE admin_unread = true;

ALTER TABLE public.support_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_cases_select_admin"
  ON public.support_cases FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_cases_insert_admin"
  ON public.support_cases FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_cases_update_admin"
  ON public.support_cases FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_cases_delete_admin"
  ON public.support_cases FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_cases_select_own"
  ON public.support_cases FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "support_cases_update_own_user_unread"
  ON public.support_cases FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_support_cases_updated_at
  BEFORE UPDATE ON public.support_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.inbox_threads(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user', 'support', 'system')),
  body_text text NOT NULL,
  attachment_storage_paths text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  case_id uuid REFERENCES public.support_cases(id) ON DELETE SET NULL
);

CREATE INDEX idx_inbox_messages_thread_id ON public.inbox_messages(thread_id);
CREATE INDEX idx_inbox_messages_created_at ON public.inbox_messages(created_at DESC);
CREATE INDEX idx_inbox_messages_case_id ON public.inbox_messages(case_id);

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inbox_messages_select_own"
  ON public.inbox_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.inbox_threads t
    WHERE t.id = inbox_messages.thread_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "inbox_messages_select_admin"
  ON public.inbox_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_messages_insert_admin"
  ON public.inbox_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_messages_insert_own"
  ON public.inbox_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender = 'user'
    AND EXISTS (
      SELECT 1 FROM public.inbox_threads t
      WHERE t.id = inbox_messages.thread_id AND t.user_id = auth.uid()
    )
    AND (
      inbox_messages.case_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.support_cases c
        WHERE c.id = inbox_messages.case_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "inbox_messages_update_admin"
  ON public.inbox_messages FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid())
    AND inbox_messages.sender = 'support'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid())
    AND inbox_messages.sender = 'support'
  );

CREATE POLICY "inbox_messages_delete_admin"
  ON public.inbox_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE TRIGGER trg_inbox_messages_user_case_bump
  AFTER INSERT ON public.inbox_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_support_case_on_user_inbox_message();

CREATE TABLE public.support_case_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.support_cases(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_case_internal_notes_case_id
  ON public.support_case_internal_notes(case_id, created_at DESC);

ALTER TABLE public.support_case_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_case_internal_notes_select_admin"
  ON public.support_case_internal_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_case_internal_notes_insert_admin"
  ON public.support_case_internal_notes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_case_internal_notes_delete_admin"
  ON public.support_case_internal_notes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Misc app infra
-- ---------------------------------------------------------------------------

-- Legacy projects may have an older email_captures shape from pre-baseline migrations.
DROP TABLE IF EXISTS public.email_captures CASCADE;

CREATE TABLE public.email_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  marketing_consent boolean NOT NULL DEFAULT false,
  first_name text,
  feedback text,
  source text,
  page_path text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_captures_email_idx ON public.email_captures(email);
CREATE INDEX email_captures_created_at_idx ON public.email_captures(created_at);
CREATE INDEX email_captures_source_idx ON public.email_captures(source);

ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous email captures"
  ON public.email_captures FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous email captures unsubscribe"
  ON public.email_captures FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE TABLE public.demo_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT token_expires_check CHECK (expires_at > created_at)
);

CREATE INDEX idx_demo_access_tokens_token ON public.demo_access_tokens(token);
CREATE INDEX idx_demo_access_tokens_email ON public.demo_access_tokens(email);
CREATE INDEX idx_demo_access_tokens_expires_at ON public.demo_access_tokens(expires_at);

ALTER TABLE public.demo_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read of demo tokens"
  ON public.demo_access_tokens FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role to insert demo tokens"
  ON public.demo_access_tokens FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to update demo tokens"
  ON public.demo_access_tokens FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

CREATE TABLE public.account_deletion_requests (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion request"
  ON public.account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deletion request (cancel)"
  ON public.account_deletion_requests FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.marketing_homepage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'store_click')),
  visit_id uuid NOT NULL,
  page_path text,
  landing_query text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  click_source text,
  store_target text CHECK (store_target IS NULL OR store_target IN ('apple', 'google', 'qr_scroll')),
  routed_store_url text,
  is_mobile_viewport boolean,
  device_os text,
  browser_language text,
  timezone text,
  screen_width int,
  screen_height int,
  pixel_ratio numeric(4, 2),
  user_agent text,
  in_app_browser text,
  country_code text,
  region text,
  city text,
  is_from_tiktok boolean
);

CREATE INDEX idx_marketing_homepage_events_created_at
  ON public.marketing_homepage_events(created_at DESC);

CREATE INDEX idx_marketing_homepage_events_event_type_created_at
  ON public.marketing_homepage_events(event_type, created_at DESC);

CREATE INDEX idx_marketing_homepage_events_utm_campaign
  ON public.marketing_homepage_events(utm_campaign)
  WHERE utm_campaign IS NOT NULL;

CREATE INDEX idx_marketing_homepage_events_visit_id
  ON public.marketing_homepage_events(visit_id);

ALTER TABLE public.marketing_homepage_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_homepage_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.marketing_homepage_events TO service_role;
GRANT SELECT ON public.marketing_homepage_events TO authenticated;

CREATE POLICY "marketing_homepage_events_select_admin"
  ON public.marketing_homepage_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE TABLE public.routine_push_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_slot int NOT NULL CHECK (alert_slot >= 1 AND alert_slot <= 3),
  scheduled_for_date date NOT NULL,
  scheduled_time text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  onesignal_response jsonb,
  UNIQUE (user_id, alert_slot, scheduled_for_date)
);

CREATE INDEX idx_routine_push_delivery_log_user_date
  ON public.routine_push_delivery_log(user_id, scheduled_for_date);

ALTER TABLE public.routine_push_delivery_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.routine_push_delivery_log FROM anon, authenticated;
GRANT ALL ON public.routine_push_delivery_log TO service_role;

CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT true,
  description text,
  config jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature flags"
  ON public.feature_flags FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE TABLE public.gamification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gamification settings"
  ON public.gamification_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can update gamification settings"
  ON public.gamification_settings FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE TRIGGER update_gamification_settings_updated_at
  BEFORE UPDATE ON public.gamification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.user_gamification_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  tools_used_this_week jsonb DEFAULT '[]'::jsonb,
  milestones_achieved jsonb DEFAULT '[]'::jsonb,
  total_tools_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_gamification_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats or admins can view all"
  ON public.user_gamification_stats FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  );

CREATE POLICY "Users can update their own stats"
  ON public.user_gamification_stats FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own stats"
  ON public.user_gamification_stats FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE TRIGGER update_user_gamification_stats_updated_at
  BEFORE UPDATE ON public.user_gamification_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  call_name text NOT NULL,
  user_id uuid,
  route text,
  model text NOT NULL,
  input_tokens int,
  output_tokens int,
  total_tokens int,
  characters int,
  input_cost_usd numeric,
  output_cost_usd numeric,
  total_cost_usd numeric,
  meta jsonb
);

CREATE INDEX ai_usage_created_at_idx ON public.ai_usage(created_at);
CREATE INDEX ai_usage_call_name_idx ON public.ai_usage(call_name);
CREATE INDEX ai_usage_user_id_idx ON public.ai_usage(user_id);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage logs"
  ON public.ai_usage FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('board-uploads', 'board-uploads', false, 10485760)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

CREATE POLICY "board_uploads_insert_pro" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'board-uploads'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
    AND public.has_active_plotting_subscription(auth.uid())
  );

CREATE POLICY "board_uploads_select_pro" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'board-uploads'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
    AND public.has_active_plotting_subscription(auth.uid())
  );

CREATE POLICY "board_uploads_delete_pro" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'board-uploads'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
    AND public.has_active_plotting_subscription(auth.uid())
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('community-posts', 'community-posts', true, 5242880)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit;

CREATE POLICY "community_posts_storage_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-posts'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
  );

CREATE POLICY "community_posts_storage_select_public" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'community-posts');

CREATE POLICY "community_posts_storage_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-posts'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('support-reports', 'support-reports', false, 5242880)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

CREATE POLICY "support_reports_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-reports'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
  );

CREATE POLICY "support_reports_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'support-reports'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
  );

CREATE POLICY "support_reports_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'support-reports'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
  );
