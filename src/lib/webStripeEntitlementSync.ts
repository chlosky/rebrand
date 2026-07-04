import { supabase } from "@/integrations/supabase/client";

const SUBSCRIBED_TIERS = new Set(["monthly", "annual", "basic", "plus", "premium", "weekly"]);

const POST_PURCHASE_INITIAL_DELAY_MS = 800;
const POST_PURCHASE_RETRY_DELAY_MS = 1200;

async function userHasActiveStripePlan(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_plans")
    .select("status, tier, last_payment_source")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return false;

  const tier = typeof data.tier === "string" ? data.tier.trim().toLowerCase() : "";
  const status = typeof data.status === "string" ? data.status.trim().toLowerCase() : "";
  const source = typeof data.last_payment_source === "string" ? data.last_payment_source.trim().toLowerCase() : "";

  if (status !== "active" || !SUBSCRIBED_TIERS.has(tier)) return false;
  if (source && source !== "stripe" && source !== "web") return false;
  return true;
}

/** After Stripe Checkout, poll `user_plans` until the webhook has activated the membership. */
export async function syncWebStripeEntitlementAfterPurchaseWithRetries(
  attempts = 6,
): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    console.warn("[webStripeEntitlementSync] No session; skipping poll.");
    return false;
  }

  await new Promise((r) => setTimeout(r, POST_PURCHASE_INITIAL_DELAY_MS));

  for (let i = 0; i < attempts; i += 1) {
    if (await userHasActiveStripePlan(userId)) return true;
    await new Promise((r) => setTimeout(r, POST_PURCHASE_RETRY_DELAY_MS));
  }

  return false;
}
