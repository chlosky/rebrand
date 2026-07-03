-- Add missing indexes for columns used in RLS policies
-- This ensures fast authorization checks instead of full table scans

-- ============================================================================
-- profiles table
-- Uses 'id' in RLS policies (auth.uid() = id)
-- Since 'id' is PRIMARY KEY, it already has an index, but we ensure it exists
-- ============================================================================
-- No additional index needed - PRIMARY KEY already indexed

-- ============================================================================
-- user_roles table
-- Uses 'user_id' in RLS policies (auth.uid() = user_id)
-- UNIQUE constraint creates index on (user_id, role), but single-column index helps
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
  ON public.user_roles(user_id);

-- ============================================================================
-- user_plans table
-- Uses 'user_id' in RLS policies (auth.uid() = user_id)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id 
  ON public.user_plans(user_id);

-- ============================================================================
-- subscriptions table
-- Uses 'user_id' in RLS policies
-- ============================================================================
-- Index already exists: idx_subscriptions_user_id (from migration 20250118000000)

-- ============================================================================
-- Verify existing indexes on critical tables
-- ============================================================================

-- subliminal_tracks - already has idx_subliminal_tracks_user_id ✓
-- user_affirmation_sets - already has idx_user_affirmation_sets_user_id ✓
-- belief_refactor_entries - already has idx_belief_refactor_entries_user_id ✓
-- user_preferences - already has idx_user_preferences_user_id ✓
-- user_double_progress - already has idx_user_double_progress_user_date ✓
-- user_double_action_history - already has idx_user_double_action_history_user_date ✓
-- chrono_entries - already has idx_chrono_entries_user_date ✓
-- character_messages - already has idx_character_messages_user_date ✓
-- user_message_limits - already has idx_message_limits_user_date ✓
-- user_character_preferences - already has idx_user_character_preferences_user ✓

-- ============================================================================
-- Additional composite indexes for common query patterns
-- ============================================================================

-- For queries that filter by user_id and order by created_at
CREATE INDEX IF NOT EXISTS idx_subliminal_tracks_user_created 
  ON public.subliminal_tracks(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_affirmation_sets_user_created 
  ON public.user_affirmation_sets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_belief_refactor_entries_user_created 
  ON public.belief_refactor_entries(user_id, created_at DESC);

-- ============================================================================
-- Indexes for organization-related tables (if not already created)
-- ============================================================================
-- These are handled in migration 20250123000002_fix_organization_rls_optimization.sql

