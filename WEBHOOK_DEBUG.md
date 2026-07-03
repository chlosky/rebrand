# Webhook Debugging Guide

## Current Webhook Implementation

The webhook handler at `supabase/functions/stripe-webhook/index.ts` now includes:
- Better error logging
- Detailed console logs for debugging
- Proper error handling that doesn't break Stripe retries

## How to Debug Webhook Issues

### 1. Check if Webhook is Configured in Stripe

1. Go to: **Stripe Dashboard → Developers → Webhooks**
2. Verify you have an endpoint pointing to:
   ```
   https://hyckwyjznishkjijrhcw.supabase.co/functions/v1/stripe-webhook
   ```
3. Check that these events are selected:
   - `checkout.session.completed` (CRITICAL for new flow)
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. Check Webhook Logs in Stripe

1. Go to: **Stripe Dashboard → Developers → Webhooks → Your endpoint**
2. Click on "Recent deliveries"
3. Check if webhooks are being sent
4. Check the response status (should be 200)
5. If failed, check the error message

### 3. Check Supabase Edge Function Logs

1. Go to: **Supabase Dashboard → Edge Functions → stripe-webhook**
2. Click on "Logs"
3. Look for:
   - `Stripe webhook event received: checkout.session.completed`
   - `Processing checkout.session.completed for onboarding session: [id]`
   - `Successfully updated onboarding_sessions: [id] Status: paid`
   - Any error messages

### 4. Verify Environment Variables

In **Supabase Dashboard → Edge Functions → Secrets**, ensure:
- `STRIPE_SECRET_KEY` is set
- `STRIPE_WEBHOOK_SECRET` is set (optional but recommended)

### 5. Verify Database Migration

Ensure the `onboarding_sessions` table exists:
1. Go to: **Supabase Dashboard → SQL Editor**
2. Run:
   ```sql
   SELECT * FROM onboarding_sessions LIMIT 1;
   ```
3. If error, apply migration: `20260101000000_create_onboarding_sessions_and_email_verification.sql`

### 6. Test Webhook Manually

1. Complete a test payment
2. Check Stripe Dashboard → Webhooks → Recent deliveries
3. Find the `checkout.session.completed` event
4. Check if it succeeded (200) or failed
5. If failed, check the error in the response

## Common Issues

### Webhook Not Firing
- **Cause**: Webhook not configured in Stripe or wrong URL
- **Fix**: Add webhook endpoint in Stripe Dashboard

### Webhook Firing but Failing
- **Cause**: Database table doesn't exist or wrong session ID
- **Fix**: Apply migration and check logs for specific error

### Webhook Firing but Not Updating Database
- **Cause**: `onboarding_session_id` or `client_reference_id` not matching
- **Fix**: Check that `create-onboarding-checkout-session` is setting `client_reference_id` correctly

## Expected Flow

1. User completes payment → Stripe sends `checkout.session.completed` webhook
2. Webhook receives event → Logs: `Stripe webhook event received: checkout.session.completed`
3. Webhook extracts `onboarding_session_id` from `client_reference_id` or metadata
4. Webhook updates `onboarding_sessions` table → Sets `status = 'paid'`
5. Webhook logs: `Successfully updated onboarding_sessions: [id] Status: paid`

## Next Steps

After verifying the webhook is working:
1. Test a complete payment flow
2. Check that `onboarding_sessions.status` is set to `paid`
3. Verify user can activate account
4. Check that `user_plans` is created after activation
