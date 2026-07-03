# Deploy Belief Work Guardrails

The `refactor-belief` edge function has guardrails that should block dangerous content like "kill", "murder", "violence", etc.

## Issue
If the guardrails aren't working, the function likely needs to be redeployed with the latest code.

## Deployment Methods

### Method 1: Supabase Dashboard (Easiest)

1. **Navigate to Edge Functions**
   - Go to: https://supabase.com/dashboard/project/[your-project]/functions
   - Or: Project → Edge Functions

2. **Find or Create `refactor-belief` function**
   - If it exists, click on it
   - If it doesn't exist, click "Create new function" and name it `refactor-belief`

3. **Copy the Function Code**
   - Open: `supabase/functions/refactor-belief/index.ts`
   - Copy ALL the code

4. **Paste and Deploy**
   - Paste the code into the Supabase Dashboard editor
   - Click "Deploy" or "Update"

5. **Verify Guardrails**
   - The function should have `DANGEROUS_CONTENT_KEYWORDS` array (line 125-131)
   - The function should check for dangerous content (lines 145-162)
   - Keywords include: 'kill', 'murder', 'harm', 'violence', 'assault', 'abuse', etc.

### Method 2: Supabase CLI

```bash
# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref [your-project-ref]

# Deploy the function
npx supabase functions deploy refactor-belief

# Verify deployment
npx supabase functions list
```

## Test the Guardrails

After deployment, test with a dangerous belief:
- "I want to kill monkeys" → Should return: "This tool isn't designed to process this type of statement."
- "I want to harm someone" → Should be blocked
- "I want to commit violence" → Should be blocked

## Verify Guardrails Are Active

The guardrail check happens at lines 145-162 in `index.ts`:

```typescript
// Guardrail 18 & 22: Content Sanitization - Check for dangerous content
const beliefLower = belief.toLowerCase();
const containsDangerousContent = DANGEROUS_CONTENT_KEYWORDS.some(keyword => 
  beliefLower.includes(keyword)
);

if (containsDangerousContent) {
  return new Response(
    JSON.stringify({ 
      error: "This tool isn't designed to process this type of statement.",
      rejected: true
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
```

If this code is present and deployed, the guardrails should work.

## Troubleshooting

**Guardrails still not working?**
1. Check Edge Function logs in Supabase Dashboard
2. Verify the function code in Dashboard matches the local file
3. Try redeploying the function
4. Check that the function is being called (not cached)

**Function not found?**
- Make sure the function name is exactly `refactor-belief`
- Check that it's deployed to the correct project













































