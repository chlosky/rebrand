// Feature gating — palette plotting (boards-forward). Monthly and annual have equal access.

export type Tier = 'monthly' | 'annual';

export interface FeatureConfig {
  [featureName: string]: {
    description: string;
  };
}

/** Boards product features (reference list). Paid users get full access. */
export const FEATURE_CONFIG: FeatureConfig = {
  boards_workspace: { description: 'Board workspaces and planning' },
  board_ai: { description: 'Board design chat and insight extraction' },
  journal: { description: 'Journal entries' },
  daily_progress: { description: 'Daily progress and action history' },
  routine_reminders: { description: 'Routine reminders and push nudges' },
  community: { description: 'Community posts and engagement' },
  support_inbox: { description: 'Help requests and support inbox' },
};

export interface TierLimits {
  boardAiSessionsPerWeek: number;
  journalEntriesPerWeek: number;
}

export const NON_SUBSCRIBER_LIMITS: TierLimits = {
  boardAiSessionsPerWeek: 0,
  journalEntriesPerWeek: 0,
};

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  monthly: {
    boardAiSessionsPerWeek: 50,
    journalEntriesPerWeek: 100,
  },
  annual: {
    boardAiSessionsPerWeek: 50,
    journalEntriesPerWeek: 100,
  },
};

const SUBSCRIBED_TIERS = ['monthly', 'annual', 'basic', 'plus', 'premium'] as const;
export type SubscribedTier = (typeof SUBSCRIBED_TIERS)[number];

export type UserPlanGate = {
  tier: SubscribedTier | null;
  status: string | null;
};

export function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  return status === 'active';
}

export function hasActivePaidPlan(plan: UserPlanGate | null | undefined): boolean {
  if (!plan?.tier || !SUBSCRIBED_TIERS.includes(plan.tier as SubscribedTier)) return false;
  return isActiveSubscriptionStatus(plan.status);
}

export function hasFeatureAccess(plan: UserPlanGate | null | undefined, featureName: string): boolean {
  if (!hasActivePaidPlan(plan)) return false;
  return featureName in FEATURE_CONFIG;
}

export function getRequiredTier(_featureName: string): Tier | null {
  return 'monthly';
}

export function getAvailableFeatures(plan: UserPlanGate | null | undefined): string[] {
  if (!hasActivePaidPlan(plan)) {
    return [];
  }

  return Object.keys(FEATURE_CONFIG).filter((featureName) =>
    hasFeatureAccess(plan, featureName),
  );
}

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

export function getTierLimit(
  plan: UserPlanGate | null | undefined,
  limitKey: keyof TierLimits,
): number | null {
  const limits = getTierLimits(plan);
  return limits[limitKey];
}

export function canPerformAction(
  plan: UserPlanGate | null | undefined,
  limitKey: keyof TierLimits,
  currentUsage: number,
): boolean {
  const limit = getTierLimit(plan, limitKey);
  if (limit === null) {
    return false;
  }
  return currentUsage < limit;
}

export function getRemainingQuota(
  plan: UserPlanGate | null | undefined,
  limitKey: keyof TierLimits,
  currentUsage: number,
): number | null {
  const limit = getTierLimit(plan, limitKey);
  if (limit === null) {
    return null;
  }
  return Math.max(0, limit - currentUsage);
}
