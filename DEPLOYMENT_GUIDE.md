# Edge Functions Deployment Guide

This guide explains how to deploy the updated Stripe payment Edge Functions.

## Prerequisites

- Access to Supabase Dashboard
- Stripe account with API keys configured

## Deployment Methods

### Method 1: Supabase Dashboard (Recommended)

1. **Navigate to Edge Functions**
   - Go to: https://supabase.com/dashboard/project/[your-project]/functions
   - Or: Project → Edge Functions

2. **Deploy Each Function**

   **create-payment-intent:**
   - Click on `create-payment-intent` (or "Create new function" if it doesn't exist)
   - Copy the contents of `supabase/functions/create-payment-intent/index.ts`
   - Paste into the code editor
   - Click "Deploy" or "Update"

   **confirm-subscription:**
   - Click on `confirm-subscription` (or "Create new function" if it doesn't exist)
   - Copy the contents of `supabase/functions/confirm-subscription/index.ts`
   - Paste into the code editor
   - Click "Deploy" or "Update"

   **stripe-webhook (NEW):**
   - Click "Create new function"
   - Name it: `stripe-webhook`
   - Copy the contents of `supabase/functions/stripe-webhook/index.ts`
   - Paste into the code editor
   - Click "Deploy"

3. **Set Environment Secrets**
   - Go to: Project Settings → Edge Functions → Secrets
   - Ensure these secrets are set:
     - `STRIPE_SECRET_KEY` - Your Stripe secret key
     - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret (optional but recommended)

### Method 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref [your-project-ref]

# Deploy functions
supabase functions deploy create-payment-intent
supabase functions deploy confirm-subscription
supabase functions deploy stripe-webhook

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## Configure Stripe Webhook

1. **Get Your Webhook URL**
   - Format: `https://[your-project-ref].supabase.co/functions/v1/stripe-webhook`
   - Find your project ref in Supabase Dashboard → Settings → General

2. **Create Webhook in Stripe**
   - Go to: Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Paste your webhook URL
   - Select these events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click "Add endpoint"

3. **Copy Webhook Signing Secret**
   - After creating the webhook, click on it
   - Copy the "Signing secret" (starts with `whsec_`)
   - Add it to Supabase Edge Function secrets as `STRIPE_WEBHOOK_SECRET`

## Verify Deployment

1. **Test Monthly Subscription**
   - Complete onboarding flow
   - Select a monthly plan
   - Use test card: `4242 4242 4242 4242`
   - Verify subscription is created in Stripe Dashboard
   - Check `subscriptions` table in Supabase

2. **Test Annual Payment**
   - Select an annual plan
   - Use test card: `4242 4242 4242 4242`
   - Verify one-time payment is processed
   - Check `subscriptions` table in Supabase

3. **Test Webhook (Optional)**
   - In Stripe Dashboard → Webhooks → Your endpoint
   - Click "Send test webhook"
   - Select event type (e.g., `customer.subscription.updated`)
   - Verify the webhook is received and processed

## Troubleshooting

### Function Not Deploying
- Check that all code is copied correctly
- Verify no syntax errors in the function
- Check Supabase Dashboard logs for errors

### Webhook Not Working
- Verify webhook URL is correct
- Check that `STRIPE_WEBHOOK_SECRET` is set in Supabase
- Verify webhook events are selected in Stripe
- Check Edge Function logs in Supabase Dashboard

### Payment Failing
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Stripe Dashboard for payment errors
- Verify test card numbers are correct
- Check browser console for frontend errors

## Support

- Supabase Docs: https://supabase.com/docs/guides/functions
- Stripe Docs: https://stripe.com/docs/api
- Stripe Webhooks: https://stripe.com/docs/webhooks























































