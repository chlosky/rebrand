# Deployment Checklist for Payment-First Onboarding Flow

## ✅ Webhook Flow Verification

The webhook is correctly configured for the new flow:

1. **`create-onboarding-checkout-session`** sets:
   - `client_reference_id` = `onboarding_session_id` ✅
   - `metadata[onboarding_session_id]` = `onboarding_session_id` ✅
   - `metadata[tier]` = tier ✅
   - `metadata[billing]` = billing ✅

2. **`stripe-webhook`** handles `checkout.session.completed`:
   - Extracts `onboarding_session_id` from `client_reference_id` or metadata ✅
   - Updates `onboarding_sessions.status = 'paid'` ✅
   - Saves Stripe customer/subscription IDs ✅
   - Includes detailed logging ✅

## 📦 Edge Functions to Deploy

### Critical (Required for flow to work):

1. **`stripe-webhook`** ⚠️ **MUST DEPLOY**
   - Updated with onboarding flow support
   - Better error logging
   - Handles `customer.subscription.created/updated` for onboarding sessions
   - File: `supabase/functions/stripe-webhook/index.ts`

2. **`create-onboarding-checkout-session`** ⚠️ **MUST DEPLOY**
   - Updated success URL to redirect to `/payment-processing`
   - File: `supabase/functions/create-onboarding-checkout-session/index.ts`

3. **`create-onboarding-session`** ⚠️ **MUST DEPLOY**
   - Creates anonymous onboarding sessions
   - File: `supabase/functions/create-onboarding-session/index.ts`

4. **`update-onboarding-session`** ⚠️ **MUST DEPLOY**
   - Updates session with character, answers, plan selection
   - File: `supabase/functions/update-onboarding-session/index.ts`

5. **`get-onboarding-session`** ⚠️ **MUST DEPLOY**
   - Retrieves session data (used by PaymentProcessing page)
   - File: `supabase/functions/get-onboarding-session/index.ts`

6. **`claim-onboarding-session`** ⚠️ **MUST DEPLOY**
   - Creates user account and activates plan after payment
   - File: `supabase/functions/claim-onboarding-session/index.ts`

### Optional (Email verification):

7. **`send-email-verification`** (Optional)
   - Sends Postmark verification email
   - File: `supabase/functions/send-email-verification/index.ts`

8. **`verify-email`** (Optional)
   - Verifies email token
   - File: `supabase/functions/verify-email/index.ts`

### Not Used (Can skip):

9. **`verify-checkout-session`** (Not used - webhook-only flow)
   - Created but not needed since we're webhook-only
   - Can skip deployment or remove later

## 🗄️ Database Migration

**MUST APPLY:** `supabase/migrations/20260101000000_create_onboarding_sessions_and_email_verification.sql`

This creates:
- `onboarding_sessions` table
- `email_verification_tokens` table
- Adds `email_verified_at` to `profiles` table

**How to apply:**
1. Go to: https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new
2. Copy entire contents of the migration file
3. Paste and click "Run"

## 🔧 Stripe Webhook Configuration

**Verify in Stripe Dashboard:**

1. Go to: **Stripe Dashboard → Developers → Webhooks**
2. Check endpoint URL: `https://hyckwyjznishkjijrhcw.supabase.co/functions/v1/stripe-webhook`
3. Verify these events are selected:
   - ✅ `checkout.session.completed` (CRITICAL)
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

## 🔐 Environment Variables

**In Supabase Dashboard → Edge Functions → Secrets:**

- ✅ `STRIPE_SECRET_KEY` (required)
- ✅ `STRIPE_WEBHOOK_SECRET` (optional but recommended)
- ✅ `SUPABASE_URL` (auto-configured)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (auto-configured)

## 📋 Deployment Steps

### Step 1: Apply Database Migration
```sql
-- Run: 20260101000000_create_onboarding_sessions_and_email_verification.sql
-- In Supabase Dashboard → SQL Editor
```

### Step 2: Deploy Edge Functions

**Via Supabase Dashboard:**
1. Go to: **Supabase Dashboard → Edge Functions**
2. For each function above, click "Deploy" or "Update"
3. Copy/paste the function code from the file

**Via CLI (if available):**
```bash
supabase functions deploy stripe-webhook
supabase functions deploy create-onboarding-session
supabase functions deploy update-onboarding-session
supabase functions deploy get-onboarding-session
supabase functions deploy create-onboarding-checkout-session
supabase functions deploy claim-onboarding-session
supabase functions deploy send-email-verification
supabase functions deploy verify-email
```

### Step 3: Verify Webhook Configuration
- Check Stripe Dashboard → Webhooks → Your endpoint
- Verify events are selected
- Test with a test payment

## ✅ Testing Checklist

After deployment, test:
1. ✅ Complete onboarding flow → select plan → pay
2. ✅ Check that `onboarding_sessions` table gets created
3. ✅ Verify webhook fires and updates `status = 'paid'`
4. ✅ Confirm PaymentProcessing page redirects to Activate
5. ✅ Verify Activate page shows form (only when `status = 'paid'`)
6. ✅ Complete account creation
7. ✅ Verify `user_plans` is created with active subscription
