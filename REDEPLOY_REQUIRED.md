# Edge Functions That Need Redeployment

Based on recent commits, these Edge Functions were modified and **MUST be redeployed**:

## ⚠️ Critical - Must Redeploy:

1. **`stripe-webhook`** 
   - Updated with better logging and onboarding flow support
   - Handles `customer.subscription.created/updated` for onboarding sessions
   - **Why:** Webhook won't work correctly without this update

2. **`create-onboarding-checkout-session`**
   - Updated to prefill email in Stripe checkout
   - Updated success URL to redirect to `/payment-processing`
   - **Why:** Email won't prefill and redirect will be wrong

3. **`update-onboarding-session`**
   - Now allows updating `email` and `first_name` fields
   - **Why:** Email collection page won't be able to save email

4. **`get-onboarding-session`**
   - Now returns `email` and `first_name` fields
   - **Why:** PaymentProcessing and Activate pages need these fields

5. **`claim-onboarding-session`**
   - Updated to use `email` and `first_name` from onboarding_sessions
   - **Why:** Account creation won't use the collected email/name

## ✅ Already Deployed (No Changes):

- `create-onboarding-session` - No changes
- `send-email-verification` - No changes  
- `verify-email` - No changes

## ❌ Can Skip:

- `verify-checkout-session` - Created but not used (webhook-only flow)

## 🗄️ Database Migration - MUST APPLY:

**File:** `supabase/migrations/20260101000000_create_onboarding_sessions_and_email_verification.sql`

**What it does:**
- Creates `onboarding_sessions` table (if not exists)
- Adds `email` and `first_name` columns to `onboarding_sessions`
- Creates `email_verification_tokens` table
- Adds `email_verified_at` to `profiles` table

**How to apply:**
1. Go to: https://supabase.com/dashboard/project/hyckwyjznishkjijrhcw/sql/new
2. Copy entire contents of the migration file
3. Paste and click "Run"

## 📋 Quick Deployment Checklist

### Database:
- [ ] Apply migration: `20260101000000_create_onboarding_sessions_and_email_verification.sql`

### Edge Functions (via Supabase Dashboard):
- [ ] Deploy `stripe-webhook`
- [ ] Deploy `create-onboarding-checkout-session`
- [ ] Deploy `update-onboarding-session`
- [ ] Deploy `get-onboarding-session`
- [ ] Deploy `claim-onboarding-session`

### Stripe Webhook (Verify):
- [ ] Check endpoint: `https://hyckwyjznishkjijrhcw.supabase.co/functions/v1/stripe-webhook`
- [ ] Verify `checkout.session.completed` event is selected
- [ ] Verify other 5 subscription events are selected

## 🚨 If You Skip Redeployment:

- Email collection page won't save email
- Stripe checkout won't prefill email
- Activate page won't prefill email
- Webhook might not handle onboarding sessions correctly
- Account creation might not use collected email/name
