# Stripe Integration Setup Guide

This document outlines the Stripe infrastructure that has been set up and what you need to configure.

## Infrastructure Created

### Frontend Components
- **Onboarding Stripe checkout pages** (`Payment.tsx`, `PaymentSuccess.tsx`) were removed from the app. Checkout return URLs used by edge functions now land on **`/dashboard`** (see `create-payment-intent` success URL). Subscription state still relies on **webhooks** and backend verification where applicable.

### Backend Functions
- **create-payment-intent** (`supabase/functions/create-payment-intent/index.ts`)
  - **Monthly plans**: Creates Stripe Checkout Sessions in subscription mode
  - **Annual plans**: Creates Stripe Checkout Sessions in payment mode
  - Returns Checkout Session URL for redirect
  - Stores plan and billing info in session metadata

- **confirm-subscription** (`supabase/functions/confirm-subscription/index.ts`)
  - Handles Checkout Session verification (new flow)
  - Also supports legacy payment intent/subscription verification
  - Verifies payment/subscription with Stripe
  - Creates/updates subscription record in database
  - Handles subscription activation and period tracking

- **stripe-webhook** (`supabase/functions/stripe-webhook/index.ts`)
  - Handles `checkout.session.completed` events (new Checkout flow)
  - Handles Stripe webhook events for subscription lifecycle
  - Updates subscription status on renewals, cancellations, and payment failures
  - Keeps database in sync with Stripe

### Database
- **subscriptions table** (migration: `20250118000000_create_subscriptions.sql`)
  - Stores user subscription information
  - Tracks Stripe payment/subscription IDs
  - Manages subscription status and billing periods

## Environment Variables Required

### Supabase Edge Functions (Set in Supabase Dashboard)
1. Go to: **Project Settings → Edge Functions → Secrets**
2. Add the following secrets:

```env
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your Stripe webhook signing secret (optional but recommended)

# RevenueCat (web Option A — Stripe checkout unchanged; RC gets Stripe subs for unified entitlements)
REVENUECAT_STRIPE_APP_PUBLIC_API_KEY=...  # RC → App → Stripe → "Stripe public API key" (not sk_)
REVENUECAT_SECRET_KEY=sk_...              # RC secret key (sync-revenuecat-entitlement, revenuecat-webhook)
REVENUECAT_WEBHOOK_AUTHORIZATION=...      # Exact string RC sends as Authorization on webhooks
```

**Note:** The following are already configured:
- `SUPABASE_URL` - Auto-configured
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured

### RevenueCat + Stripe (web Option A)

Web keeps **Stripe Checkout** (`create-payment-intent`, `create-onboarding-checkout-session`). After payment, edge functions call `postStripePurchaseToRevenueCat` so the same Supabase user id unlocks **Palette Plotting Pro** in RevenueCat as on iOS/Android.

**Dashboard (one-time):**

1. **RevenueCat → Apps & providers → Stripe** — connect the same Stripe account used in Supabase.
2. **Entitlements** — map each Stripe **Product** id (`prod_…`) to entitlement **Palette Plotting Pro** (product identifier must match Stripe’s `prod_` id exactly).
3. **Webhooks** (optional but recommended for native renewals) — point to `https://[project-ref].supabase.co/functions/v1/revenuecat-webhook` with `REVENUECAT_WEBHOOK_AUTHORIZATION` set to the same value in Supabase secrets.

**Code paths (no RC Web SDK on web):**

| Event | Updates `user_plans` | Syncs to RevenueCat |
|--------|----------------------|---------------------|
| `stripe-webhook` | Yes | `postStripePurchaseToRevenueCat` |
| `confirm-subscription` | Yes | Same |
| Native purchase | `sync-revenuecat-entitlement` / `revenuecat-webhook` | RC StoreKit / Play |

iOS/Android edge functions are unchanged. Web does not use `VITE_REVENUECAT_*` keys.

## Setup Steps

1. **Get Stripe API Keys**
   - Sign up at https://stripe.com
   - Get your test keys from Dashboard → Developers → API keys
   - Publishable key starts with `pk_test_` or `pk_live_`
   - Secret key starts with `sk_test_` or `sk_live_`

2. **Add Supabase Edge Function Secret**
   - Go to Supabase Dashboard
   - Navigate to: Project Settings → Edge Functions → Secrets
   - Add secret: `STRIPE_SECRET_KEY` with your Stripe secret key value

4. **Deploy Edge Functions via Supabase Dashboard**
   
   **Option A: Using Supabase Dashboard (Recommended)**
   1. Go to: **Supabase Dashboard → Edge Functions**
   2. For each function, click **"Deploy"** or **"Update"**:
      - `create-payment-intent` - Upload `supabase/functions/create-payment-intent/index.ts`
      - `confirm-subscription` - Upload `supabase/functions/confirm-subscription/index.ts`
      - `stripe-webhook` - Upload `supabase/functions/stripe-webhook/index.ts` (NEW)
   3. Or use the Supabase CLI if installed:
      ```bash
      supabase functions deploy create-payment-intent
      supabase functions deploy confirm-subscription
      supabase functions deploy stripe-webhook
      ```

4. **Configure Stripe Webhook** (Required for recurring payments and Checkout completion)
   1. Go to **Stripe Dashboard → Developers → Webhooks**
   2. Click **"Add endpoint"**
   3. Endpoint URL: `https://[your-project-ref].supabase.co/functions/v1/stripe-webhook`
      - Replace `[your-project-ref]` with your Supabase project reference
      - Example: `https://hyckwyjznishkjijrhcw.supabase.co/functions/v1/stripe-webhook`
   4. Select events to listen to:
      - `checkout.session.completed` (NEW - for Checkout flow)
      - `customer.subscription.created`
      - `customer.subscription.updated`
      - `customer.subscription.deleted`
      - `invoice.payment_succeeded`
      - `invoice.payment_failed`
   5. Click **"Add endpoint"**
   6. Copy the **"Signing secret"** (starts with `whsec_`)
   7. Add it to Supabase Edge Function secrets as `STRIPE_WEBHOOK_SECRET`

5. **Run Database Migration** (if not already applied)
   - Apply the migration manually in Supabase Dashboard → SQL Editor
   - Or use: `supabase db push` (if CLI is installed)

## Testing

### Test Cards (Stripe Test Mode)
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`
- Use any future expiry date, any 3-digit CVC, any ZIP code

### Test Flow
1. Complete onboarding flow
2. Select a plan on pricing page
3. You'll be redirected to Stripe Checkout
4. Enter test card details on Stripe's payment page
5. Payment should process successfully
6. You'll be redirected back to the success page
7. Subscription should be created in database

## Current Implementation

✅ **Stripe Checkout Integration:**
- **Monthly plans**: Use Stripe Checkout in subscription mode for automatic monthly renewals
- **Annual plans**: Use Stripe Checkout in payment mode for one-time payments
- **Webhook handler**: Automatically updates subscription status on Checkout completion, renewals, cancellations, and payment failures

## Payment Flow

### Monthly Plans (Recurring)
1. User selects monthly plan → Creates Stripe Checkout Session (subscription mode)
2. User redirected to Stripe Checkout → Enters payment details
3. Payment completed → Webhook creates/updates subscription
4. Stripe automatically charges monthly
5. Webhook updates database on each renewal

### Annual Plans (One-time)
1. User selects annual plan → Creates Stripe Checkout Session (payment mode)
2. User redirected to Stripe Checkout → Enters payment details
3. Payment completed → Webhook creates subscription record
4. Subscription period set to 1 year
5. No automatic renewal (user must manually renew)

### Monthly subscription with 3-day trial (web onboarding)

Web checkout uses **`create-onboarding-checkout-session`** with:

- `mode=subscription` and `STRIPE_PRICE_PREMIUM_MONTHLY` (or selected tier price)
- `subscription_data[trial_period_days]=3` (override with Edge secret `STRIPE_TRIAL_DAYS`)
- `payment_method_collection=always` so a card is saved before the trial ends and Stripe can auto-renew
- `subscription_data[trial_settings][end_behavior][missing_payment_method]=cancel`

During trial, `user_plans.status` is `trialing` and `on_trial` is true. The app locks **board downloads** and **calendar (.ics) export** until the user starts paid billing (Settings → **Start subscription now**, or the same option when tapping a locked export).

Deploy **`end-stripe-trial`** to end a trial immediately via Stripe (`trial_end=now`).

**Stripe Dashboard:** Your monthly Price should be a recurring subscription price. The trial is applied at Checkout — you do not need a separate trial Price in Stripe.

## Next Steps (Optional Enhancements)

1. **Subscription Management UI**: Add interface for users to manage/cancel subscriptions
2. **Coupon Codes**: Integrate with existing referral_codes table
4. **Email Notifications**: Send emails on subscription events
5. **Subscription Upgrade/Downgrade**: Allow users to change plans

## Support

For Stripe API documentation:
- Payment Intents: https://stripe.com/docs/payments/payment-intents
- Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Webhooks: https://stripe.com/docs/webhooks

