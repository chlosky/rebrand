# Stripe + Tiers Architecture

This document describes the architecture for handling Stripe payments and user tiers.

## Overview

- **Stripe handles billing only** (products, prices, subscriptions)
- **App handles tiers and feature access** via `user_plans` table
- **Webhooks are the only place** that updates user tiers
- **Feature gating** is done via `user_plans.tier`, not Stripe

## Database Schema

### `user_plans` Table (Single Source of Truth)

This is the **only** table that should be checked for user tiers and feature access.

```sql
- user_id (UUID, unique)
- tier (TEXT: 'basic' | 'plus' | 'premium')
- stripe_customer_id (TEXT)
- stripe_subscription_id (TEXT)
- status (TEXT: 'active' | 'past_due' | 'canceled' | 'trialing')
- current_period_end (TIMESTAMP)
```

### `subscriptions` Table (Backward Compatibility)

Kept for backward compatibility, but `user_plans` is the source of truth.

## Environment Variables

Set these in Supabase Dashboard → Edge Functions → Secrets:

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_PLUS_MONTHLY=price_...
STRIPE_PRICE_PLUS_ANNUAL=price_...
P_STRIPE_PRICE_PREMIUM_MONTHLY=price_...
P_STRIPE_PRICE_PREMIUM_ANNUAL=price_...
```

## Stripe Setup

1. Create Products and Prices in Stripe Dashboard
2. Copy Price IDs to environment variables
3. Never hardcode dollar amounts in code

## Checkout Flow

1. User selects tier (basic/plus/premium) and billing (monthly/annual)
2. Frontend calls `create-payment-intent` Edge Function
3. Function looks up Price ID from environment variables
4. Creates Stripe Checkout Session with Price ID
5. User redirected to Stripe Checkout
6. After payment, webhook updates `user_plans` table

## Webhook Flow

The `stripe-webhook` Edge Function handles:

- `checkout.session.completed` - Maps Price ID to tier, updates `user_plans`
- `customer.subscription.created/updated` - Maps Price ID to tier, updates `user_plans`
- `customer.subscription.deleted` - Sets status to 'canceled' in `user_plans`
- `invoice.payment_succeeded` - Updates period dates in `user_plans`
- `invoice.payment_failed` - Sets status to 'past_due' in `user_plans`

**Important**: The webhook is the **only** place that should change a user's tier.

## Feature Gating

Use the `featureGating.ts` utility:

```typescript
import { hasFeatureAccess } from '@/lib/featureGating';

const { data: userPlan } = await supabase
  .from('user_plans')
  .select('tier, status')
  .eq('user_id', userId)
  .single();

const tier = userPlan?.status === 'active' ? userPlan.tier : null;

if (!hasFeatureAccess(tier, 'body_double')) {
  // Show upgrade prompt
  return;
}
```

## Customer Portal

Users can manage subscriptions via Stripe Customer Portal:

1. Frontend calls `create-customer-portal` Edge Function
2. Function creates portal session for user's Stripe customer ID
3. User redirected to Stripe portal
4. Changes (upgrade/downgrade/cancel) flow back through webhook
5. Webhook updates `user_plans` table

## Migration Notes

- Existing code may check `subscriptions.plan` - update to use `user_plans.tier`
- Migration script syncs data from `subscriptions` to `user_plans`
- Both tables are kept in sync by webhooks for backward compatibility





















































