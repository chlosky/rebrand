/**
 * In-app community ships when you are ready (~500–1000 users).
 *
 * Model: one-way admin feed + separate setup submissions + optional polls.
 * No user chat feed; no AI moderation.
 *
 * When launching:
 * 1. Set COMMUNITY_IN_APP_ENABLED to true
 * 2. Apply migrations on project essjyrhhaiywotvgjkcg (supabase link --project-ref essjyrhhaiywotvgjkcg)
 * 3. Deploy functions: npx supabase functions deploy <name> --project-ref essjyrhhaiywotvgjkcg
 */
export const COMMUNITY_IN_APP_ENABLED = false;
