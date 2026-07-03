-- Fix all RLS performance issues by replacing auth.uid() with (SELECT auth.uid())
-- This migration addresses all the performance warnings from Supabase
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- Fix policies that use auth.uid() directly (wrapped in DO blocks for safety)
-- ============================================================================

DO $$
BEGIN
  -- text_message_enablement_log
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'text_message_enablement_log') THEN
    DROP POLICY IF EXISTS "Users can view their own text message enablement log" ON public.text_message_enablement_log;
    CREATE POLICY "Users can view their own text message enablement log"
      ON public.text_message_enablement_log FOR SELECT
      USING ((SELECT auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can insert their own text message enablement log" ON public.text_message_enablement_log;
    CREATE POLICY "Users can insert their own text message enablement log"
      ON public.text_message_enablement_log FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  -- support_preferences_log
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_preferences_log') THEN
    DROP POLICY IF EXISTS "Users can view their own support preferences log" ON public.support_preferences_log;
    CREATE POLICY "Users can view their own support preferences log"
      ON public.support_preferences_log FOR SELECT
      USING ((SELECT auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can insert their own support preferences log" ON public.support_preferences_log;
    CREATE POLICY "Users can insert their own support preferences log"
      ON public.support_preferences_log FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  -- character_selection_log
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'character_selection_log') THEN
    DROP POLICY IF EXISTS "Users can view their own character selection log" ON public.character_selection_log;
    CREATE POLICY "Users can view their own character selection log"
      ON public.character_selection_log FOR SELECT
      USING ((SELECT auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can insert their own character selection log" ON public.character_selection_log;
    CREATE POLICY "Users can insert their own character selection log"
      ON public.character_selection_log FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  -- user_roles
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
    CREATE POLICY "Users can view their own roles"
      ON public.user_roles FOR SELECT
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================================================
-- Fix policies for tables that may not exist (using DO block for safety)
-- ============================================================================

DO $$
BEGIN
  -- purchases table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchases') THEN
    -- Drop and recreate with optimized version
    DROP POLICY IF EXISTS "Users can view their purchases" ON public.purchases;
    CREATE POLICY "Users can view their purchases"
      ON public.purchases FOR SELECT
      USING ((SELECT auth.uid()) = user_id);
      
    DROP POLICY IF EXISTS "Users can view circle purchases" ON public.purchases;
    CREATE POLICY "Users can view circle purchases"
      ON public.purchases FOR SELECT
      USING ((SELECT auth.uid()) = user_id);
      
    DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;
    CREATE POLICY "Users can create purchases"
      ON public.purchases FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;

  -- products table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
    DROP POLICY IF EXISTS "Admins can view all products including deleted" ON public.products;
    CREATE POLICY "Admins can view all products including deleted"
      ON public.products FOR SELECT
      USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));
    
    -- Check if products table has user_id, creator_id, or merchant_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Creators can manage their own products" ON public.products;
      CREATE POLICY "Creators can manage their own products"
        ON public.products FOR ALL
        USING ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Merchants can view their deleted products" ON public.products;
      CREATE POLICY "Merchants can view their deleted products"
        ON public.products FOR SELECT
        USING ((SELECT auth.uid()) = user_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'creator_id') THEN
      DROP POLICY IF EXISTS "Creators can manage their own products" ON public.products;
      CREATE POLICY "Creators can manage their own products"
        ON public.products FOR ALL
        USING ((SELECT auth.uid()) = creator_id);
        
      DROP POLICY IF EXISTS "Merchants can view their deleted products" ON public.products;
      CREATE POLICY "Merchants can view their deleted products"
        ON public.products FOR SELECT
        USING ((SELECT auth.uid()) = creator_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'merchant_id') THEN
      DROP POLICY IF EXISTS "Creators can manage their own products" ON public.products;
      CREATE POLICY "Creators can manage their own products"
        ON public.products FOR ALL
        USING ((SELECT auth.uid()) = merchant_id);
        
      DROP POLICY IF EXISTS "Merchants can view their deleted products" ON public.products;
      CREATE POLICY "Merchants can view their deleted products"
        ON public.products FOR SELECT
        USING ((SELECT auth.uid()) = merchant_id);
    END IF;
  END IF;

  -- sound_effect_presets table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sound_effect_presets') THEN
    DROP POLICY IF EXISTS "Admins can manage sound presets" ON public.sound_effect_presets;
    CREATE POLICY "Admins can manage sound presets"
      ON public.sound_effect_presets FOR ALL
      USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;

  -- product_reviews table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_reviews') THEN
    -- Check for user_id column (product_reviews typically has user_id for reviewers)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_reviews' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can submit reviews" ON public.product_reviews;
      CREATE POLICY "Users can submit reviews"
        ON public.product_reviews FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Users can view own reviews" ON public.product_reviews;
      CREATE POLICY "Users can view own reviews"
        ON public.product_reviews FOR SELECT
        USING ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Admins can view all reviews" ON public.product_reviews;
      CREATE POLICY "Admins can view all reviews"
        ON public.product_reviews FOR SELECT
        USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));
        
      DROP POLICY IF EXISTS "Admins can update reviews" ON public.product_reviews;
      CREATE POLICY "Admins can update reviews"
        ON public.product_reviews FOR UPDATE
        USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));
        
      -- Check if product_reviews has merchant_id or product_id that links to products.user_id
      -- For now, assume merchants access via product ownership (would need JOIN, so skip merchant policies if no direct link)
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_reviews' AND column_name = 'merchant_id') THEN
        DROP POLICY IF EXISTS "Merchants can view approved reviews" ON public.product_reviews;
        CREATE POLICY "Merchants can view approved reviews"
          ON public.product_reviews FOR SELECT
          USING ((SELECT auth.uid()) = merchant_id);
          
        DROP POLICY IF EXISTS "Merchants can flag reviews" ON public.product_reviews;
        CREATE POLICY "Merchants can flag reviews"
          ON public.product_reviews FOR UPDATE
          USING ((SELECT auth.uid()) = merchant_id);
      END IF;
    END IF;
  END IF;

  -- cart_items table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cart_items') THEN
    -- Check for user_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cart_items' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own cart" ON public.cart_items;
      DROP POLICY IF EXISTS "Users can modify their own cart" ON public.cart_items;
      
      -- Combine into single policy to avoid multiple permissive policies
      CREATE POLICY "Users can manage their own cart"
        ON public.cart_items FOR ALL
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
  END IF;

  -- battle_events table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'battle_events') THEN
    -- Check for user_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'battle_events' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can create battle events" ON public.battle_events;
      CREATE POLICY "Users can create battle events"
        ON public.battle_events FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
  END IF;

  -- profiles table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    DROP POLICY IF EXISTS "own_profile_insert" ON public.profiles;
    CREATE POLICY "own_profile_insert"
      ON public.profiles FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = id);
      
    DROP POLICY IF EXISTS "own_profile_update" ON public.profiles;
    CREATE POLICY "own_profile_update"
      ON public.profiles FOR UPDATE
      USING ((SELECT auth.uid()) = id)
      WITH CHECK ((SELECT auth.uid()) = id);
      
    DROP POLICY IF EXISTS "own_profile_delete" ON public.profiles;
    CREATE POLICY "own_profile_delete"
      ON public.profiles FOR DELETE
      USING ((SELECT auth.uid()) = id);
      
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      USING ((SELECT auth.uid()) = id);
      
    DROP POLICY IF EXISTS "Users view own complete profile" ON public.profiles;
    CREATE POLICY "Users view own complete profile"
      ON public.profiles FOR SELECT
      USING ((SELECT auth.uid()) = id);
  END IF;

  -- customer_analytics table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_analytics') THEN
    -- Check for user_id or merchant_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_analytics' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Merchants can view their analytics" ON public.customer_analytics;
      CREATE POLICY "Merchants can view their analytics"
        ON public.customer_analytics FOR SELECT
        USING ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.customer_analytics;
      CREATE POLICY "Authenticated users can insert analytics"
        ON public.customer_analytics FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_analytics' AND column_name = 'merchant_id') THEN
      DROP POLICY IF EXISTS "Merchants can view their analytics" ON public.customer_analytics;
      CREATE POLICY "Merchants can view their analytics"
        ON public.customer_analytics FOR SELECT
        USING ((SELECT auth.uid()) = merchant_id);
        
      DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.customer_analytics;
      CREATE POLICY "Authenticated users can insert analytics"
        ON public.customer_analytics FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = merchant_id);
    END IF;
  END IF;

  -- merchant_settings table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'merchant_settings') THEN
    -- Check for user_id or merchant_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_settings' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Merchants can manage their settings" ON public.merchant_settings;
      CREATE POLICY "Merchants can manage their settings"
        ON public.merchant_settings FOR ALL
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_settings' AND column_name = 'merchant_id') THEN
      DROP POLICY IF EXISTS "Merchants can manage their settings" ON public.merchant_settings;
      CREATE POLICY "Merchants can manage their settings"
        ON public.merchant_settings FOR ALL
        USING ((SELECT auth.uid()) = merchant_id)
        WITH CHECK ((SELECT auth.uid()) = merchant_id);
    END IF;
  END IF;

  -- merchant_subscriptions table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'merchant_subscriptions') THEN
    -- Check for user_id or merchant_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Merchants can view their subscriptions" ON public.merchant_subscriptions;
      CREATE POLICY "Merchants can view their subscriptions"
        ON public.merchant_subscriptions FOR SELECT
        USING ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Merchants can update their subscriptions" ON public.merchant_subscriptions;
      CREATE POLICY "Merchants can update their subscriptions"
        ON public.merchant_subscriptions FOR UPDATE
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_subscriptions' AND column_name = 'merchant_id') THEN
      DROP POLICY IF EXISTS "Merchants can view their subscriptions" ON public.merchant_subscriptions;
      CREATE POLICY "Merchants can view their subscriptions"
        ON public.merchant_subscriptions FOR SELECT
        USING ((SELECT auth.uid()) = merchant_id);
        
      DROP POLICY IF EXISTS "Merchants can update their subscriptions" ON public.merchant_subscriptions;
      CREATE POLICY "Merchants can update their subscriptions"
        ON public.merchant_subscriptions FOR UPDATE
        USING ((SELECT auth.uid()) = merchant_id)
        WITH CHECK ((SELECT auth.uid()) = merchant_id);
    END IF;
  END IF;

  -- user_roles table (additional policies)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
    CREATE POLICY "Admins can manage all roles"
      ON public.user_roles FOR ALL
      USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;

  -- merchant_api_keys table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'merchant_api_keys') THEN
    -- Check for user_id or merchant_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_api_keys' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Merchants can manage their API keys" ON public.merchant_api_keys;
      CREATE POLICY "Merchants can manage their API keys"
        ON public.merchant_api_keys FOR ALL
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_api_keys' AND column_name = 'merchant_id') THEN
      DROP POLICY IF EXISTS "Merchants can manage their API keys" ON public.merchant_api_keys;
      CREATE POLICY "Merchants can manage their API keys"
        ON public.merchant_api_keys FOR ALL
        USING ((SELECT auth.uid()) = merchant_id)
        WITH CHECK ((SELECT auth.uid()) = merchant_id);
    END IF;
  END IF;

  -- admin_audit_log table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_audit_log') THEN
    DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
    CREATE POLICY "Admins can view audit logs"
      ON public.admin_audit_log FOR SELECT
      USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;

  -- user_circles table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_circles') THEN
    -- Check for user_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_circles' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their circles" ON public.user_circles;
      DROP POLICY IF EXISTS "Users can manage their circles" ON public.user_circles;
      
      -- Combine into single policy
      CREATE POLICY "Users can manage their circles"
        ON public.user_circles FOR ALL
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
  END IF;

  -- social_engagements table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_engagements') THEN
    -- Check for user_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'social_engagements' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their engagements" ON public.social_engagements;
      CREATE POLICY "Users can view their engagements"
        ON public.social_engagements FOR SELECT
        USING ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Users can create engagements" ON public.social_engagements;
      CREATE POLICY "Users can create engagements"
        ON public.social_engagements FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
  END IF;

  -- user_follows table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_follows') THEN
    -- Check for follower_id and following_id columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_follows' AND column_name = 'follower_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_follows' AND column_name = 'following_id') THEN
      DROP POLICY IF EXISTS "Users can view their own follows" ON public.user_follows;
      DROP POLICY IF EXISTS "Users can view who follows them" ON public.user_follows;
      
      -- Combine into single policy
      CREATE POLICY "Users can view follows"
        ON public.user_follows FOR SELECT
        USING (
          (SELECT auth.uid()) = follower_id 
          OR (SELECT auth.uid()) = following_id
        );
        
      DROP POLICY IF EXISTS "Users can follow others" ON public.user_follows;
      CREATE POLICY "Users can follow others"
        ON public.user_follows FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = follower_id);
        
      DROP POLICY IF EXISTS "Users can unfollow" ON public.user_follows;
      CREATE POLICY "Users can unfollow"
        ON public.user_follows FOR DELETE
        USING ((SELECT auth.uid()) = follower_id);
    END IF;
  END IF;

  -- user_notifications table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_notifications') THEN
    -- Check for user_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_notifications' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
      CREATE POLICY "Users can view their own notifications"
        ON public.user_notifications FOR SELECT
        USING ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Users can mark their notifications as read" ON public.user_notifications;
      CREATE POLICY "Users can mark their notifications as read"
        ON public.user_notifications FOR UPDATE
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    END IF;
  END IF;

  -- user_blocks table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_blocks') THEN
    -- Check for user_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_blocks' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can view their blocks" ON public.user_blocks;
      CREATE POLICY "Users can view their blocks"
        ON public.user_blocks FOR SELECT
        USING ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Users can block others" ON public.user_blocks;
      CREATE POLICY "Users can block others"
        ON public.user_blocks FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Users can unblock others" ON public.user_blocks;
      CREATE POLICY "Users can unblock others"
        ON public.user_blocks FOR DELETE
        USING ((SELECT auth.uid()) = user_id);
    END IF;
  END IF;

  -- product_likes table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_likes') THEN
    -- Check for user_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_likes' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Users can like products" ON public.product_likes;
      CREATE POLICY "Users can like products"
        ON public.product_likes FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id);
        
      DROP POLICY IF EXISTS "Users can unlike products" ON public.product_likes;
      CREATE POLICY "Users can unlike products"
        ON public.product_likes FOR DELETE
        USING ((SELECT auth.uid()) = user_id);
    END IF;
  END IF;

  -- messages table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
    CREATE POLICY "Users can view their own messages"
      ON public.messages FOR SELECT
      USING (
        (SELECT auth.uid()) = sender_id 
        OR (SELECT auth.uid()) = receiver_id
      );
      
    DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
    CREATE POLICY "Users can send messages"
      ON public.messages FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = sender_id);
      
    DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
    CREATE POLICY "Users can update their received messages"
      ON public.messages FOR UPDATE
      USING ((SELECT auth.uid()) = receiver_id)
      WITH CHECK ((SELECT auth.uid()) = receiver_id);
  END IF;

  -- merchant_invitations table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'merchant_invitations') THEN
    DROP POLICY IF EXISTS "Super admins can manage invitations" ON public.merchant_invitations;
    CREATE POLICY "Super admins can manage invitations"
      ON public.merchant_invitations FOR ALL
      USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;

  -- merchant_integrations table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'merchant_integrations') THEN
    -- Check for user_id or merchant_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_integrations' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Merchants can manage their integrations" ON public.merchant_integrations;
      CREATE POLICY "Merchants can manage their integrations"
        ON public.merchant_integrations FOR ALL
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'merchant_integrations' AND column_name = 'merchant_id') THEN
      DROP POLICY IF EXISTS "Merchants can manage their integrations" ON public.merchant_integrations;
      CREATE POLICY "Merchants can manage their integrations"
        ON public.merchant_integrations FOR ALL
        USING ((SELECT auth.uid()) = merchant_id)
        WITH CHECK ((SELECT auth.uid()) = merchant_id);
    END IF;
  END IF;

  -- product_sync_mappings table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_sync_mappings') THEN
    -- Check for user_id or merchant_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_sync_mappings' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Merchants can view their product mappings" ON public.product_sync_mappings;
      DROP POLICY IF EXISTS "Merchants can manage their product mappings" ON public.product_sync_mappings;
      
      -- Combine into single policy
      CREATE POLICY "Merchants can manage their product mappings"
        ON public.product_sync_mappings FOR ALL
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_sync_mappings' AND column_name = 'merchant_id') THEN
      DROP POLICY IF EXISTS "Merchants can view their product mappings" ON public.product_sync_mappings;
      DROP POLICY IF EXISTS "Merchants can manage their product mappings" ON public.product_sync_mappings;
      
      -- Combine into single policy
      CREATE POLICY "Merchants can manage their product mappings"
        ON public.product_sync_mappings FOR ALL
        USING ((SELECT auth.uid()) = merchant_id)
        WITH CHECK ((SELECT auth.uid()) = merchant_id);
    END IF;
  END IF;

  -- product_deletions table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_deletions') THEN
    -- Check for user_id or merchant_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_deletions' AND column_name = 'user_id') THEN
      DROP POLICY IF EXISTS "Merchants can view their product deletions" ON public.product_deletions;
      DROP POLICY IF EXISTS "Admins can view all product deletions" ON public.product_deletions;
      
      -- Combine into single policy
      CREATE POLICY "Users can view product deletions"
        ON public.product_deletions FOR SELECT
        USING (
          (SELECT auth.uid()) = user_id
          OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
        );
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_deletions' AND column_name = 'merchant_id') THEN
      DROP POLICY IF EXISTS "Merchants can view their product deletions" ON public.product_deletions;
      DROP POLICY IF EXISTS "Admins can view all product deletions" ON public.product_deletions;
      
      -- Combine into single policy
      CREATE POLICY "Users can view product deletions"
        ON public.product_deletions FOR SELECT
        USING (
          (SELECT auth.uid()) = merchant_id
          OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
        );
    END IF;
  END IF;

  -- crshm_credit_presets table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crshm_credit_presets') THEN
    DROP POLICY IF EXISTS "Admins can manage CRSHM credit presets" ON public.crshm_credit_presets;
    CREATE POLICY "Admins can manage CRSHM credit presets"
      ON public.crshm_credit_presets FOR ALL
      USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));
  END IF;

END $$;

