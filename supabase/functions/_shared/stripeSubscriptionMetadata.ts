/**
 * Attach Supabase user id to a Stripe subscription so Stripe→RevenueCat webhooks and
 * renewal events resolve the same app_user_id as mobile (UUID = RC app user id).
 */
export async function attachAppUserIdToStripeSubscription(
  stripeSecretKey: string,
  subscriptionId: string,
  appUserId: string,
): Promise<void> {
  if (!subscriptionId?.trim() || !appUserId?.trim()) return;

  const encode = (v: string) => encodeURIComponent(v);
  const body = [
    `metadata[user_id]=${encode(appUserId)}`,
    `metadata[app_user_id]=${encode(appUserId)}`,
  ].join("&");

  try {
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(
        "[stripeSubscriptionMetadata] Could not attach app user id to subscription:",
        res.status,
        text.slice(0, 400),
      );
    }
  } catch (e) {
    console.warn("[stripeSubscriptionMetadata] Stripe subscription metadata update failed:", e);
  }
}
