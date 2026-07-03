# Deploy check-content-moderation Edge Function

The `check-content-moderation` edge function needs to be deployed to enable client-side OpenAI guardrail checks.

## Method 1: Supabase Dashboard (Easiest)

1. **Navigate to Edge Functions**
   - Go to: https://supabase.com/dashboard/project/[your-project]/functions
   - Or: Project → Edge Functions

2. **Create New Function**
   - Click "Create new function"
   - Name it: `check-content-moderation`

3. **Copy the Function Code**
   - Open: `supabase/functions/check-content-moderation/index.ts`
   - Copy ALL the code

4. **Paste and Deploy**
   - Paste the code into the Supabase Dashboard editor
   - Click "Deploy" or "Save"

5. **Set Environment Variable**
   - Make sure `OPENAI_API_KEY` is set in your Supabase project settings
   - Go to: Project Settings → Edge Functions → Secrets
   - Add or verify: `OPENAI_API_KEY`

## Method 2: Supabase CLI

```bash
# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref [your-project-ref]

# Deploy the function
npx supabase functions deploy check-content-moderation

# Verify deployment
npx supabase functions list
```

## Verify Deployment

After deployment, test with a simple belief:
- "I am capable" → Should pass
- "Let's slash monkeys" → Should be blocked

## Note

If the function is not deployed, the client-side code will gracefully fall back to server-side checks. The server-side `refactor-belief` function also performs moderation checks, so the system remains protected even if this function isn't deployed yet.













































