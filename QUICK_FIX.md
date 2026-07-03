# Quick Fix for Pricing and CORS Issues

## Issue 1: pricing_display table doesn't exist

**Error:** `Could not find the table 'public.pricing_display' in the schema cache`

**Solution:** Run the migration in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/migrations/20250126000001_create_pricing_display_table.sql`
3. Click "Run"

This will create the `pricing_display` table with initial pricing values.

## Issue 2: CORS error on create-payment-intent

**Error:** `Response to preflight request doesn't pass access control check`

**Solution:** Deploy the updated Edge Function:

```bash
npx supabase functions deploy create-payment-intent
```

The CORS headers have been fixed in the code, but the function needs to be deployed to take effect.

## Quick Steps:

1. **Run Migration:**
   - Supabase Dashboard → SQL Editor
   - Run: `supabase/migrations/20250126000001_create_pricing_display_table.sql`

2. **Deploy Edge Function:**
   ```bash
   npx supabase functions deploy create-payment-intent
   ```

3. **Verify:**
   - Check that `pricing_display` table exists in Table Editor
   - Try the payment flow again





















































