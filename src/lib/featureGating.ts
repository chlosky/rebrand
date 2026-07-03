// Feature Gating System
// Monthly and annual have equal access; tier is only subscription interval (billing period).
// Subscribed users (either tier) get full access. No per-feature tier hierarchy.

export type Tier = 'monthly' | 'annual';

export interface FeatureConfig {
  [featureName: string]: {
    description: string;
  };
}

/** List of features (for reference). Access is equal for monthly and annual. */
export const FEATURE_CONFIG: FeatureConfig = {
  'affirmation_generation': { description: 'Affirmation generation' },
  'vision_board_creation': { description: 'Vision Board creation (underlay for affirmations)' },
  'affirmation_viewer': { description: 'Affirmation/Vision Images Viewer' },
  'mirror_work': { description: 'Mirror Work' },
  'affirmation_sync_overlay': { description: 'Affirmation sync overlay' },
  'confidence_meter_feedback': { description: 'Confidence meter and encouragement/Feedback Option' },
  'scenes': { description: 'Scenes' },
  'subliminal_generation': { description: 'Subliminal Generation' },
  'freestyle_voice': { description: 'Freestyle voice (no limit beyond time 5/10/15)' },
  'karaoke_affirmation_sync': { description: 'Karaoke style Affirmation Sync for Read out & Record' },
  'text_to_speech': { description: 'Text to Speech on Affirmations & freeform character limited text 480 characters max' },
  'playback_loops': { description: 'Playback Loops Enabled in app' },
  'belief_refactoring': { description: 'Belief Work' },
  'belief_elimination': { description: 'Belief Elimination Breaks down assumptions of negative/limiting beliefs and refutes MECE style' },
  'belief_integration': { description: 'Belief Integration Helps to integrate new expansionary beliefs by breaking down to conceivable chunks' },
  'png_download_refactor': { description: 'PNG Download of Diagram for Refactor' },
  'double_tracking': { description: 'Double Tracking' },
  'daily_body_doubling': { description: 'Daily Body Doubling (Clean, Self-Care, Exercise, Rest, Water)' },
  'habit_tracking': { description: 'Tracking of Habits for day (based on button presses and affirm that you completed too)' },
  'sms_support': { description: 'SMS Support' },
  'daily_text_message': { description: 'One text message daily (unless opt out)' },
  'rate_limited_followups': { description: 'Rate limited follow-ups based on tier and settings pref (goal nudges, accountability, motivation)' },
};

// Tier-specific limits configuration
export interface TierLimits {
  // Affirmation Sets
  affirmationSetLimit: number;
  aiAffirmationGenerationsPerWeek: number;
  
  // Subliminal Generation
  maxGenerationsPerWeek: number;
  maxStorageMB: number;
  maxAudioLengthMinutes: number;
  
  // Belief Work
  beliefRefactorRateLimit: number | null; // null means unlimited/not available
  
  // Chat Support (in-app chat only - no SMS limits)
  // Frequency Model: Tier 1 = 15/day, Tier 2 = 30/day, Tier 3 = 60/day
  chatDaily: number;
}

/** No separate free product: without an active paid row, quotas are zero (UI + server should still gate). */
export const NON_SUBSCRIBER_LIMITS: TierLimits = {
  affirmationSetLimit: 0,
  aiAffirmationGenerationsPerWeek: 0,
  maxGenerationsPerWeek: 0,
  maxStorageMB: 0,
  maxAudioLengthMinutes: 0,
  beliefRefactorRateLimit: null,
  chatDaily: 0,
};

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  monthly: {
    affirmationSetLimit: 30,
    aiAffirmationGenerationsPerWeek: 15,
    maxGenerationsPerWeek: 10,
    maxStorageMB: 3000,
    maxAudioLengthMinutes: 15,
    beliefRefactorRateLimit: 10,
    chatDaily: 20,
  },
  annual: {
    affirmationSetLimit: 30,
    aiAffirmationGenerationsPerWeek: 15,
    maxGenerationsPerWeek: 10,
    maxStorageMB: 3000,
    maxAudioLengthMinutes: 15,
    beliefRefactorRateLimit: 10,
    chatDaily: 20,
  },
};

/** Tiers that have full feature access (current + legacy from user_plans). */
const SUBSCRIBED_TIERS = ['monthly', 'annual', 'basic', 'plus', 'premium'] as const;
export type SubscribedTier = (typeof SUBSCRIBED_TIERS)[number];

/** Snapshot from `user_plans` for client gating (tier + status). */
export type UserPlanGate = {
  tier: SubscribedTier | null;
  status: string | null;
};

/**
 * Only `active` unlocks the app. `past_due` and everything else are treated as no paid access.
 */
export function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  return status === 'active';
}

/** True when the row represents an actively subscribed user (subscribed tier + active status). */
export function hasActivePaidPlan(plan: UserPlanGate | null | undefined): boolean {
  if (!plan?.tier || !SUBSCRIBED_TIERS.includes(plan.tier as SubscribedTier)) return false;
  return isActiveSubscriptionStatus(plan.status);
}

/**
 * Feature access requires a subscribed tier and `user_plans.status === 'active'`.
 */
export function hasFeatureAccess(plan: UserPlanGate | null | undefined, featureName: string): boolean {
  if (!hasActivePaidPlan(plan)) return false;
  return featureName in FEATURE_CONFIG;
}

/**
 * No per-feature required tier; all features require any subscription (monthly or annual).
 */
export function getRequiredTier(_featureName: string): Tier | null {
  return 'monthly';
}

/**
 * Get all features available when the plan is active and subscribed.
 */
export function getAvailableFeatures(plan: UserPlanGate | null | undefined): string[] {
  if (!hasActivePaidPlan(plan)) {
    return [];
  }

  return Object.keys(FEATURE_CONFIG).filter(featureName =>
    hasFeatureAccess(plan, featureName)
  );
}

/**
 * Paid limits only when `user_plans.status` is active and tier is subscribed; otherwise no quota (no free plan).
 */
export function getTierLimits(plan: UserPlanGate | null | undefined): TierLimits {
  if (!hasActivePaidPlan(plan) || !plan?.tier) {
    return NON_SUBSCRIBER_LIMITS;
  }
  const userTier = plan.tier;
  if (userTier in TIER_LIMITS) {
    return TIER_LIMITS[userTier as Tier];
  }
  return TIER_LIMITS.monthly;
}

/**
 * Get a specific limit value for the user's plan
 */
export function getTierLimit(
  plan: UserPlanGate | null | undefined,
  limitKey: keyof TierLimits
): number | null {
  const limits = getTierLimits(plan);
  return limits[limitKey];
}

/**
 * Check if a user can perform an action based on current usage vs tier limits
 */
export function canPerformAction(
  plan: UserPlanGate | null | undefined,
  limitKey: keyof TierLimits,
  currentUsage: number
): boolean {
  const limit = getTierLimit(plan, limitKey);
  if (limit === null) {
    return false; // Feature not available for this tier
  }
  return currentUsage < limit;
}

/**
 * Get remaining quota for a specific limit
 */
export function getRemainingQuota(
  plan: UserPlanGate | null | undefined,
  limitKey: keyof TierLimits,
  currentUsage: number
): number | null {
  const limit = getTierLimit(plan, limitKey);
  if (limit === null) {
    return null; // Feature not available
  }
  return Math.max(0, limit - currentUsage);
}



