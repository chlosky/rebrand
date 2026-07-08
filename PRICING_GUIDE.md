# Pricing Configuration Guide

## Overview

Pricing is handled in a way that separates **display prices** (for UI) from **Stripe Price IDs** (for billing). This allows you to update prices in Stripe without changing code.

## Architecture

1. **Stripe Dashboard** - Controls actual dollar amounts and Price IDs
2. **`pricing_display` table** - Stores display prices for UI (editable in Supabase)
3. **Environment Variables** - Store Stripe Price IDs (one per tier/billing combo)
4. **App Code** - Uses Price IDs for checkout, reads display prices from database

## How It Works

### Display Prices (UI)

The `pricing_display` table in Supabase stores the prices shown to users:

```sql
- tier: 'basic' | 'plus' | 'premium'
- monthly_display_price: 29.00
- annual_display_price: 250.00
```

**To update display prices:**
1. Go to Supabase Dashboard → Table Editor → `pricing_display`
2. Edit the `monthly_display_price` or `annual_display_price` values
3. Changes appear immediately in the app (no code changes needed)

### Stripe Price IDs (Billing)

Stripe Price IDs are stored in environment variables:

```
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_PLUS_MONTHLY=price_...
STRIPE_PRICE_PLUS_ANNUAL=price_...
P_STRIPE_PRICE_PREMIUM_MONTHLY=price_...
P_STRIPE_PRICE_PREMIUM_ANNUAL=price_...
```

**To update Stripe prices:**
1. Create a new Price in Stripe Dashboard for the Product
2. Copy the new Price ID
3. Update the corresponding environment variable in Supabase
4. Existing subscribers stay on their old price; new subscribers use the new price

## Workflow: Changing Prices

### Scenario: You want to change Basic plan from $29/month to $35/month

1. **In Stripe Dashboard:**
   - Create a new Price for "Basic Plan - Monthly" = $35
   - Copy the new Price ID (e.g., `price_new123`)

2. **In Supabase:**
   - Update environment variable: `STRIPE_PRICE_BASIC_MONTHLY=price_new123`
   - Update `pricing_display` table: Set `monthly_display_price = 35.00` for `tier = 'basic'`

3. **Result:**
   - New customers see $35/month and are charged $35
   - Existing subscribers continue paying $29/month (grandfathered)
   - UI automatically shows $35/month

## Important Notes

- ✅ **Display prices** are stored in `pricing_display` table (editable in Supabase)
- ✅ **Price IDs** are in environment variables (updated when creating new Stripe prices)
- ✅ **No hardcoded prices** in the code
- ✅ **No Stripe API calls** on page load (prices cached from database)
- ✅ **Existing subscribers** stay on their original price
- ✅ **Feature logic** doesn't change when prices change

## Database Schema

```sql
CREATE TABLE pricing_display (
  id UUID PRIMARY KEY,
  tier TEXT UNIQUE CHECK (tier IN ('basic', 'plus', 'premium')),
  monthly_display_price NUMERIC(10, 2),
  annual_display_price NUMERIC(10, 2),
  updated_at TIMESTAMP
);
```

## Code Flow

1. **Pricing Page** (`Pricing.tsx`):
   - Fetches display prices from `pricing_display` table on mount
   - Shows prices to user
   - Stores selected `tier` (not price) in localStorage

2. **Checkout** (`create-payment-intent` Edge Function):
   - Receives `tier` and `billing` from frontend
   - Looks up Price ID from environment variables
   - Creates Stripe Checkout Session with Price ID

3. **Webhook** (`stripe-webhook` Edge Function):
   - Maps Price ID → tier
   - Updates `user_plans` table with tier

## Migration

Run this migration to create the `pricing_display` table:

```sql
-- File: supabase/migrations/20250126000001_create_pricing_display_table.sql
```

This will create the table and insert initial pricing values.





















































